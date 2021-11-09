const express = require("express");
const router = express.Router();
const moment = require("moment-timezone");
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
const ExcelJS = require("exceljs");

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
    where[Op.or] = ["internalIdForBusiness", "$Warehouse.name$", "referenceId"].map(key => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" }
    }));
  if ("warehouse" in req.query) {
    where["warehouseId"] = req.query.warehouse;
  }
  // if ("product" in req.query) {
  //   where["$Products.id$"] = req.query.product;
  // }
  if ("referenceId" in req.query) {
    where["referenceId"] = req.query.referenceId;
  }

  const response = await ProductInward.findAndCountAll({
    include: [
      {
        model: Product,
        as: "Products",
        include: [{ model: UOM }],
        required: true
      },
      {
        model: Warehouse,
        required: true
      }
    ],
    order: [["createdAt", "DESC"]],
    where, offset, limit,
    distinct: true
  });
  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    count: response.count,
    pages: Math.ceil(response.count / limit)
  });
});

router.get("/export", async (req, res, next) => {
  let where = {
    customerId: req.companyId
  };

  let workbook = new ExcelJS.Workbook();

  worksheet = workbook.addWorksheet("Product Inwards");

  const getColumnsConfig = (columns) =>
    columns.map((column) => ({ header: column, width: Math.ceil(column.length * 1.5), outlineLevel: 1 }));

  worksheet.columns = getColumnsConfig([
    "INWARD ID",
    "PRODUCT",
    "WAREHOUSE",
    "UOM",
    "QUANTITY",
    "REFERENCE ID",
    "CREATOR",
    "INWARD DATE",
  ]);

  const response = await ProductInward.findAndCountAll({
    include: [
      {
        model: Product,
        as: "Products",
        include: [{ model: UOM }],
        required: true
      },
      {
        model: Warehouse,
        required: true
      },
      {
        model: User
      }
    ],
    order: [["createdAt", "DESC"]],
    where
  });

  const inwardArray = [];
  for (const inward of response.rows) {
    for (const Product of inward.Products) {
      inwardArray.push([
        inward.internalIdForBusiness || "",
        Product.name,
        inward.Warehouse.name,
        Product.UOM.name,
        Product.InwardGroup.quantity,
        inward.referenceId || "",
        `${inward.User.firstName || ""} ${inward.User.lastName || ""}`,
        moment(inward.createdAt).tz(req.query.client_Tz).format("DD/MM/yy HH:mm"),
      ]);
    }
  }

  worksheet.addRows(inwardArray);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=" + "Inventory.xlsx");

  await workbook.xlsx.write(res).then(() => res.end());
})

router.get("/relations", async (req, res, next) => {
  let where = { isActive: true, "$ProductInwards.customerId$": req.companyId };
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
        [Sequelize.col("warehouse"), "name"],
        [Sequelize.col("warehouse"), "businessWarehouseCode"]
      ]
    }),
    products: await Product.findAll({ where, include: [{ model: ProductInward }, { model: UOM }] }),
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
    req.body.products = req.body.products || [{ id: req.body.productId, quantity: req.body.quantity }];

    const { companyId } = await User.findOne({ where: { id: req.userId } });
    req.body["customerId"] = companyId;
    await sequelize.transaction(async transaction => {
      productInward = await ProductInward.create(
        {
          userId: req.userId,
          ...req.body
        },
        { transaction }
      );

      const numberOfinternalIdForBusiness = digitize(productInward.id, 6);
      productInward.internalIdForBusiness = req.body.internalIdForBusiness + numberOfinternalIdForBusiness;
      await productInward.save({ transaction });

      await InwardGroup.bulkCreate(
        req.body.products.map(product => ({
          userId: req.userId,
          inwardId: productInward.id,
          productId: product.id,
          quantity: product.quantity
        })),
        { transaction }
      );

      return await Promise.all(
        req.body.products.map(product =>
          Inventory.findOne({
            where: {
              customerId: companyId,
              warehouseId: req.body.warehouseId,
              productId: product.id
            }
          }).then(inventory => {
            if (!inventory)
              return Inventory.create(
                {
                  customerId: companyId,
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
    res.json({
      success: true,
      message,
      data: productInward
    });
  } catch (error) {
    console.log("error", error);
  }
});

module.exports = router;
