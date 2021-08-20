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
  OrderGroup,
  User
} = require("../models");
const config = require("../config");
const { Op, Sequelize, fn, col } = require("sequelize");
const { digitize } = require("../services/common.services");
const { RELATION_TYPES } = require("../enums");

// /* GET dispatchOrders listing. */
router.get("/", async (req, res, next) => {
  try {
    const limit = req.query.rowsPerPage || config.rowsPerPage;
    const offset = (req.query.page - 1 || 0) * limit;
    let where = {
      // userId: req.userId
    };
    if (req.query.search)
      where[Op.or] = ["$Inventory.Warehouse.name$", "internalIdForBusiness", "referenceId"].map(key => ({
        [key]: { [Op.like]: "%" + req.query.search + "%" }
      }));
    if (req.query.days) {
      const endDate = new Date();
      const startDate = new Date(new Date().setDate(new Date().getDate() - req.query.days));
      console.log("startDate", startDate), console.log("endDate", endDate);
      where[Op.or] = ["$Inventory.createdAt$"].map(key => ({
        [key]: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      }));
    }
    if (req.query.status)
      where[Op.or] = ["status"].map(key => ({
        [key]: { [Op.eq]: req.query.status }
      }));
    const { companyId } = await User.findOne({ where: { id: req.userId } });
    const response = await DispatchOrder.findAndCountAll({
      include: [
        {
          model: Inventory,
          as: "Inventory",
          include: [
            { model: Product, include: [{ model: UOM }] },
            { model: Company, required: true },
            { model: Warehouse, required: true }
          ],
          where: { customerId: companyId },
          required: true
        },
        {
          model: Inventory,
          as: "Inventories",
          include: [{ model: Product, include: [{ model: UOM }] }, Company, Warehouse],
          where: { customerId: companyId },
          required: true
        }
      ],
      order: [["updatedAt", "DESC"]],
      // subQuery: false,
      where,
      limit,
      offset,
      distinct: true
    });
    for (const { dataValues } of response.rows) {
      dataValues["ProductOutwards"] = await ProductOutward.findAll({
        include: ["OutwardGroups", "Vehicle"],
        attributes: ["quantity", "referenceId", "internalIdForBusiness"],
        required: false,
        where: { dispatchOrderId: dataValues.id }
      });
    }

    res.json({
      success: true,
      message: "respond with a resource",
      data: response.rows,
      count: response.count,
      pages: Math.ceil(response.count / limit)
    });
  } catch (error) {
    console.log("err", error);
    res.json(error);
  }
});

/* POST create new dispatchOrder. */
router.post("/", async (req, res, next) => {
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

router.get("/inventory", async (req, res, next) => {
  if (req.query.customerId && req.query.warehouseId && req.query.productId) {
    const inventory = await Inventory.findOne({
      where: {
        customerId: req.query.customerId,
        warehouseId: req.query.warehouseId,
        productId: req.query.productId
      }
    });
    res.json({
      success: true,
      message: "respond with a resource",
      inventory
    });
  } else
    res.json({
      success: false,
      message: "No inventory found"
    });
});

router.get("/warehouses", async (req, res, next) => {
  if (req.query.customerId) {
    const inventories = await Inventory.findAll({
      where: {
        customerId: req.query.customerId
      },
      attributes: ["warehouseId", fn("COUNT", col("warehouseId"))],
      include: [
        {
          model: Warehouse
        }
      ],
      group: "warehouseId"
    });
    res.json({
      success: true,
      message: "respond with a resource",
      warehouses: inventories.map(inventory => inventory.Warehouse)
    });
  } else
    res.json({
      success: false,
      message: "No inventory found"
    });
});

router.get("/products", async (req, res, next) => {
  if (req.query.customerId) {
    const inventories = await Inventory.findAll({
      where: {
        customerId: req.query.customerId,
        warehouseId: req.query.warehouseId,
        availableQuantity: {
          [Op.ne]: 0
        }
      },
      attributes: ["productId", fn("COUNT", col("productId"))],
      include: [
        {
          model: Product,
          include: [{ model: UOM }]
        }
      ],
      group: "productId"
    });
    res.json({
      success: true,
      message: "respond with a resource",
      products: inventories.map(inventory => inventory.Product)
    });
  } else
    res.json({
      products: [],
      success: false,
      message: "No inventory found"
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
