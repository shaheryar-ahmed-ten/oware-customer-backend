const express = require("express");
const router = express.Router();
const moment = require("moment");
const {
  Warehouse,
  Product,
  UOM,
  OutboundStat,
  DispatchOrder,
  ProductOutward,
  Vehicle,
  Car,
  CarMake,
  CarModel,
  Inventory,
  Company,
  sequelize,
  OrderGroup
} = require("../models");
const config = require("../config");
const { Op, Sequelize } = require("sequelize");
const { digitize } = require("../services/common.services");
const { RELATION_TYPES } = require("../enums");

/* GET orders listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    customerId: req.companyId
  };
  let having;
  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  }

  if ("status" in req.query) {
    if (req.query.status === "0")
      // Pending
      having = Sequelize.literal(`sum(quantity) = 0`);
    if (req.query.status === "1")
      // Partially fulfilled
      having = Sequelize.literal(`sum(quantity) > 0 && sum(productOutwardQuantity) < dispatchOrderQuantity`);
    if (req.query.status === "2")
      // Fulfilled
      having = Sequelize.literal(`sum(quantity) = dispatchOrderQuantity`);
  }

  if ("warehouse" in req.query) {
    where["warehouseId"] = req.query.warehouse;
  }
  if ("product" in req.query) {
    where["productId"] = req.query.product;
  }
  if ("referenceId" in req.query) {
    where["referenceId"] = req.query.referenceId;
  }

  if (req.query.search)
    where[Op.or] = ["product", "referenceId", "warehouse"].map(key => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" }
    }));

  const response = await OutboundStat.findAndCountAll({
    attributes: [
      "referenceId",
      "shipmentDate",
      "internalIdForBusiness",
      "dispatchOrderId",
      "warehouse",
      "customer",
      "dispatchOrderQuantity",
      [Sequelize.fn("sum", Sequelize.col("quantity")), "outwardQuantity"],
      ["dispatchOrderId", "productOutwardId"],
      [Sequelize.fn("count", Sequelize.col("productOutwardId")), "outwardCount"]
    ],
    where,
    limit,
    offset,
    having,
    group: ["dispatchOrderId", "dispatchOrderQuantity", "warehouse", "customer"]
  });
  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    count: response.count.length,
    pages: Math.ceil(response.count.length / limit)
  });
});

/* POST create new dispatchOrder. */
router.post("/", async (req, res, next) => {
  req.body.inventories.forEach(item => {
    console.log("item", item);
  });
  let message = "New dispatchOrder registered";
  let dispatchOrder;
  req.body.inventories = req.body.inventories || [{ id: req.body.inventoryId, quantity: req.body.quantity }];
  req.body.customerId = req.userId;
  try {
    await sequelize.transaction(async transaction => {
      dispatchOrder = await DispatchOrder.create(
        {
          userId: req.userId,
          ...req.body
        },
        { transaction }
      );
      const numberOfInternalIdForBusiness = digitize(dispatchOrder.id, 6);
      dispatchOrder.internalIdForBusiness = req.body.internalIdForBusiness + numberOfInternalIdForBusiness;
      let sumOfComitted = [];
      let comittedAcc;
      req.body.inventories.forEach(Inventory => {
        let quantity = parseInt(Inventory.quantity);
        sumOfComitted.push(quantity);
      });
      comittedAcc = sumOfComitted.reduce((acc, po) => {
        return acc + po;
      });
      dispatchOrder.quantity = comittedAcc;
      await dispatchOrder.save({ transaction });
      let inventoryIds = [];
      inventoryIds = req.body.inventories.map(inventory => {
        return inventory.id;
      });
      const toFindDuplicates = arry => arry.filter((item, index) => arry.indexOf(item) != index);
      const duplicateElements = toFindDuplicates(inventoryIds);
      if (duplicateElements.length != 0) {
        throw new Error("Can not add same inventory twice");
      }

      await OrderGroup.bulkCreate(
        req.body.inventories.map(inventory => ({
          userId: req.userId,
          orderId: dispatchOrder.id,
          inventoryId: inventory.id,
          quantity: inventory.quantity
        })),
        { transaction }
      );

      return Promise.all(
        req.body.inventories.map(_inventory => {
          return Inventory.findByPk(_inventory.id, { transaction }).then(inventory => {
            if (!inventory && !_inventory.id) throw new Error("Inventory is not available");
            console.log(
              "inventory.id",
              _inventory.id,
              "_inventory.quantity",
              _inventory.quantity,
              "inventory.availableQuantity",
              inventory.availableQuantity
            );
            if (_inventory.quantity > inventory.availableQuantity)
              throw new Error("Cannot create orders above available quantity");
            try {
              inventory.committedQuantity += +_inventory.quantity;
              inventory.availableQuantity -= +_inventory.quantity;
              return inventory.save({ transaction });
            } catch (err) {
              throw new Error(err.errors.pop().message);
            }
          });
        })
      );
    });
    res.json({
      success: true,
      message,
      data: dispatchOrder
    });
  } catch (err) {
    console.log("err", err);
    res.json({
      success: false,
      message: err.toString().replace("Error: ", "")
    });
  }
});

router.get("/relations", async (req, res, next) => {
  const whereClauseWithoutDate = { customerId: req.companyId };
  const relations = {
    warehouses: await OutboundStat.findAll({
      group: ["warehouseId"],
      plain: false,
      where: whereClauseWithoutDate,
      attributes: [
        ["warehouseId", "id", "businessWarehouseCode"],
        [Sequelize.col("warehouse"), "name"]
      ]
    }),
    products: await OutboundStat.findAll({
      group: ["productId"],
      plain: false,
      where: whereClauseWithoutDate,
      attributes: [
        ["productId", "id"],
        [Sequelize.col("product"), "name"]
      ]
    })
  };

  res.json({
    success: true,
    message: "respond with a resource",
    relations
  });
});

router.get("/:id", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  try {
    let response = await DispatchOrder.findAndCountAll({
      distinct: true,
      where: { id: req.params.id },
      include: [
        {
          model: Inventory,
          as: "Inventories",
          include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
        },
        {
          model: ProductOutward,
          include: [
            {
              model: Inventory,
              as: "Inventories",
              include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
            },
            {
              model: Vehicle,
              include: [{ model: Car, include: [CarMake, CarModel] }]
            }
          ]
        }
      ]
    });
    return res.json({
      success: true,
      message: "Product Outwards inside Dispatch Orders",
      data: response.rows,
      count: response.count,
      pages: Math.ceil(response.count / limit)
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
