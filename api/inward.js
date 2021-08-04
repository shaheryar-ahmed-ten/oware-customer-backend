const express = require("express");
const router = express.Router();
const moment = require("moment");
const {
  ProductInward,
  Warehouse,
  Product,
  UOM,
  InboundStat,
  Inventory,
  sequelize,
  InwardGroup,
  User,
  Company,
  DispatchOrder,
  ProductOutward,
  Vehicle
} = require("../models");
const config = require("../config");
const { Op, Sequelize } = require("sequelize");
const authService = require("../services/auth.service");
const { digitize } = require("../services/common.services");

/* GET productInwards listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    customerId: req.companyId
  };
  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  }
  if (req.query.search)
    where[Op.or] = ["$Product.name$", "$ProductInward.referenceId$", "$Warehouse.name$"].map(key => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" }
    }));
  if ("warehouse" in req.query) {
    where["warehouseId"] = req.query.warehouse;
  }
  if ("product" in req.query) {
    where["productId"] = req.query.product;
  }
  if ("referenceId" in req.query) {
    where["referenceId"] = req.query.referenceId;
  }

  const response = await ProductInward.findAndCountAll({
    include: [
      {
        model: Product,
        include: [{ model: UOM }]
      },
      {
        model: Product,
        as: "Products",
        include: [{ model: UOM }]
      },
      {
        model: Warehouse
      }
    ],
    order: [["createdAt", "DESC"]],
    where,
    limit,
    offset
  });
  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    count: response.count,
    pages: Math.ceil(response.count / limit)
  });
});

router.get("/relations", async (req, res, next) => {
  const whereClauseWithoutDate = { customerId: req.companyId };
  const whereClauseWithoutDateAndQuantity = {
    customerId: req.companyId,
    availableQuantity: {
      [Op.ne]: 0
    }
  };
  const relations = {
    warehouses: await InboundStat.findAll({
      group: ["warehouseId"],
      plain: false,
      where: whereClauseWithoutDate,
      attributes: [
        ["warehouseId", "id"],
        [Sequelize.col("warehouse"), "name"]
      ]
    }),
    products: await sequelize.query(
      `select distinct productId as id, product.name as name 
        from Inventories join Products as product on product.id = Inventories.productId 
        where customerId = ${req.companyId} and availableQuantity != 0;`,
      { type: Sequelize.QueryTypes.SELECT }
    ),
    dispatchOrders: await DispatchOrder.findAll({
      include: [
        {
          model: Inventory,
          as: "Inventory",
          include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
        },
        {
          model: Inventory,
          as: "Inventories",
          include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
        },
        {
          model: ProductOutward,
          include: [
            {
              model: Vehicle
            },
            {
              model: Inventory,
              as: "Inventories",
              include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
            }
          ]
        }
      ],
      order: [["updatedAt", "DESC"]]
    }),
    vehicles: await Vehicle.findAll({ where: { isActive: true } })
  };

  res.json({
    success: true,
    message: "respond with a resource",
    relations
  });
});

router.post("/", async (req, res, next) => {
  try {
    let productInward;
    let message = "New productInward registered";
    // Hack for backward compatibility
    console.log("------------- debug1 ----------------------------");
    req.body.products = req.body.products || [{ id: req.body.productId, quantity: req.body.quantity }];
    console.log("------------- debug2 ----------------------------");

    await sequelize.transaction(async transaction => {
      productInward = await ProductInward.create(
        {
          userId: req.userId,
          ...req.body
        },
        { transaction }
      );
      console.log("------------- debug3 ----------------------------");

      const numberOfinternalIdForBusiness = digitize(productInward.id, 6);
      productInward.internalIdForBusiness = req.body.internalIdForBusiness + numberOfinternalIdForBusiness;
      await productInward.save({ transaction });
      console.log("------------- debug4 ----------------------------");
      req.body.products.map(product => console.log("product", product));

      await InwardGroup.bulkCreate(
        req.body.products.map(product => ({
          userId: req.userId,
          inwardId: productInward.id,
          productId: product.id,
          quantity: product.quantity
        })),
        { transaction }
      );
      console.log("------------- debug5 ----------------------------");

      return await Promise.all(
        req.body.products.map(product =>
          Inventory.findOne({
            where: {
              customerId: req.userId,
              warehouseId: req.body.warehouseId,
              productId: product.id
            }
          }).then(inventory => {
            if (!inventory)
              return Inventory.create(
                {
                  customerId: req.userId,
                  warehouseId: req.body.warehouseId,
                  productId: product.id,
                  availableQuantity: product.quantity,
                  referenceId: req.body.referenceId,
                  totalInwardQuantity: product.quantity
                },
                { transaction }
              );
            else {
              inventory.availableQuantity += +product.quantity;
              inventory.totalInwardQuantity += +product.quantity;
              return inventory.save({ transaction });
            }
          })
        )
      );
    });
    console.log("------------- debug6 ----------------------------");
    res.json({
      success: true,
      message,
      data: productInward
    });
  } catch (error) {
    console.log("error", error);
  }
});

router.get("/listing", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search)
    where[Op.or] = ["$Product.name$", "$Company.name$", "$Warehouse.name$"].map(key => ({ [key]: { [Op.like]: "%" + req.query.search + "%" } }));
  const response = await ProductInward.findAndCountAll({
    distinct: true,
    include: [
      {
        model: Product,
        as: "Product",
        include: [{ model: UOM }]
      },
      {
        model: Product,
        as: "Products",
        include: [{ model: UOM }]
      },
      User,
      Company,
      Warehouse
    ],
    order: [["updatedAt", "DESC"]],
    where,
    limit,
    offset
  });
  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    pages: Math.ceil(response.count / limit)
  });
});

module.exports = router;
