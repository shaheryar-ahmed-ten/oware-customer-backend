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
  InventoryDetail,
  InwardGroupBatch,
  Company,
  DispatchOrder,
  ProductOutward,
  Vehicle,
} = require("../models");
const config = require("../config");
const { Op, Sequelize } = require("sequelize");
const authService = require("../services/auth.service");
const { digitize, attachDateFilter } = require("../services/common.services");
const ExcelJS = require("exceljs");
const { CloudWatchLogs } = require("aws-sdk");

/* GET productInwards listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    customerId: req.companyId,
  };
  where = attachDateFilter(req.query, where, "createdAt");
  if (req.query.search)
    where[Op.or] = [
      "internalIdForBusiness",
      "$Warehouse.name$",
      "referenceId",
    ].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
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
        required: true,
      },
      {
        model: Warehouse,
        required: true,
      },
      { model: InwardGroup, as: "InwardGroup", include: ["InventoryDetail"] },
    ],
    order: [["createdAt", "DESC"]],
    where,
    offset,
    limit,
    distinct: true,
  });

  for (const inward of response.rows) {
    for (const product of inward.Products) {
      const detail = await InventoryDetail.findAll({
        include: [
          {
            model: InwardGroup,
            as: "InwardGroup",
            through: InwardGroupBatch,
          },
        ],
        where: { "$InwardGroup.id$": { [Op.eq]: product.InwardGroup.id } },
      });
      product.InwardGroup.dataValues.InventoryDetail = detail;
    }
  }

  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    count: response.count,
    pages: Math.ceil(response.count / limit),
  });
});

router.get("/export", async (req, res, next) => {
  let where = {
    customerId: req.companyId,
  };

  let workbook = new ExcelJS.Workbook();

  worksheet = workbook.addWorksheet("Product Inwards");

  const getColumnsConfig = (columns) =>
    columns.map((column) => ({
      header: column,
      width: Math.ceil(column.length * 1.5),
      outlineLevel: 1,
    }));

  worksheet.columns = getColumnsConfig([
    "INWARD ID",
    "PRODUCT",
    "WAREHOUSE",
    "UOM",
    "INWARD QUANTITY",
    "VEHICLE TYPE",
    "VEHICLE NUMBER",
    "VEHICLE NAME",
    "DRIVER NAME",
    "REFERENCE ID",
    "CREATOR",
    "INWARD DATE",
    "MEMO",
    "BATCH NUMBER",
    "BATCH QUANTITY",
    "MANUFACTURING DATE",
    "EXPIRY DATE",
    // "BATCH NAME",
  ]);

  if (req.query.search)
    where[Op.or] = [
      "internalIdForBusiness",
      "$Warehouse.name$",
      "referenceId",
    ].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
    }));
  if ("warehouse" in req.query) {
    where["warehouseId"] = req.query.warehouse;
  }
  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  } else if (req.query.startingDate && req.query.endingDate) {
    const startDate = moment(req.query.startingDate);
    const endDate = moment(req.query.endingDate).set({
      hour: 23,
      minute: 53,
      second: 59,
      millisecond: 0,
    });
    where["createdAt"] = { [Op.between]: [startDate, endDate] };
  }
  const response = await ProductInward.findAndCountAll({
    include: [
      // {
      //   model: Product,
      //   as: "Products",
      //   attributes: ["name"],
      //   include: [{ model: UOM, attributes: ["name"] }],
      //   required: true,
      // },
      {
        model: Warehouse,
        required: true,
        attributes: ["name"],
      },
      {
        model: User,
        attributes: ["firstName", "lastName"],
      },
      {
        model: InwardGroup,
        as: "InwardGroup",
        include: ["InventoryDetail", "Product"],
      },
    ],
    order: [["createdAt", "DESC"]],
    where,
  });

  const inwardArray = [];

  await Promise.all(
    response.rows.map(async (inward) => {
      for (const IG of inward.InwardGroup) {
        for (const batch of IG.InventoryDetail) {
          inwardArray.push([
            inward.internalIdForBusiness || "",
            IG.Product.name,
            inward.Warehouse.name,
            IG.Product.UOM.name,
            IG.Product.InwardGroup.quantity,
            inward.vehicleType || "",
            inward.vehicleNumber || "",
            inward.vehicleName || "",
            inward.driverName || "",
            inward.referenceId || "",
            `${inward.User.firstName || ""} ${inward.User.lastName || ""}`,
            moment(inward.createdAt)
              .tz(req.query.client_Tz)
              .format("DD/MM/yy HH:mm"),
            inward.memo || "",
            batch.batchNumber || "",
            batch.availableQuantity || "",
            batch.manufacturingDate || "",
            batch.expiryDate || "",
          ]);
        }
      }
      // for (const Product of inward.Products) {
      //   const detail = await InventoryDetail.findAll({
      //     include: [
      //       {
      //         model: InwardGroup,
      //         as: "InwardGroup",
      //         through: InwardGroupBatch,
      //         attributes: [],
      //       },
      //     ],
      //     attributes: [
      //       "expiryDate",
      //       "manufacturingDate",
      //       "batchNumber",
      //       "availableQuantity",
      //     ],
      //     where: { "$InwardGroup.id$": { [Op.eq]: Product.InwardGroup.id } },
      //   });
      //   Product.InwardGroup.dataValues.InventoryDetail = detail;
      //   for (const batch of Product.InwardGroup.dataValues.InventoryDetail) {
      //     // console.log("batch", batch);
      //     inwardArray.push([
      //       inward.internalIdForBusiness || "",
      //       Product.name,
      //       inward.Warehouse.name,
      //       Product.UOM.name,
      //       Product.InwardGroup.quantity,
      //       inward.vehicleType || "",
      //       inward.vehicleNumber || "",
      //       inward.vehicleName || "",
      //       inward.driverName || "",
      //       inward.referenceId || "",
      //       `${inward.User.firstName || ""} ${inward.User.lastName || ""}`,
      //       moment(inward.createdAt)
      //         .tz(req.query.client_Tz)
      //         .format("DD/MM/yy HH:mm"),
      //       inward.memo || "",
      //       batch.batchNumber || "",
      //       batch.availableQuantity || "",
      //       batch.manufacturingDate || "",
      //       batch.expiryDate || "",
      //     ]);
      //   }
      // }
    })
  );

  for (const inward of response.rows) {
  }

  worksheet.addRows(inwardArray);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=" + "Inventory.xlsx"
  );

  await workbook.xlsx.write(res).then(() => res.end());
});

router.get("/relations", async (req, res, next) => {
  let where = { isActive: true, "$ProductInwards.customerId$": req.companyId };
  const whereClauseWithoutDate = { customerId: req.companyId };
  const whereClauseWithoutDateAndQuantity = {
    customerId: req.companyId,
    availableQuantity: {
      [Op.ne]: 0,
    },
  };
  const relations = {
    warehouses: await InboundStat.findAll({
      group: ["warehouseId"],
      plain: false,
      where: whereClauseWithoutDate,
      attributes: [
        ["warehouseId", "id"],
        [Sequelize.col("warehouse"), "name"],
        [Sequelize.col("warehouse"), "businessWarehouseCode"],
      ],
    }),
  };

  res.json({
    success: true,
    message: "respond with a resource",
    relations,
  });
});

router.post("/", async (req, res, next) => {
  try {
    let productInward;
    let message = "New productInward registered";
    // Hack for backward compatibility
    req.body.products = req.body.products || [
      { id: req.body.productId, quantity: req.body.quantity },
    ];

    const { companyId } = await User.findOne({ where: { id: req.userId } });
    req.body["customerId"] = companyId;
    await sequelize.transaction(async (transaction) => {
      productInward = await ProductInward.create(
        {
          userId: req.userId,
          ...req.body,
        },
        { transaction }
      );

      const numberOfinternalIdForBusiness = digitize(productInward.id, 6);
      productInward.internalIdForBusiness =
        req.body.internalIdForBusiness + numberOfinternalIdForBusiness;
      await productInward.save({ transaction });

      await InwardGroup.bulkCreate(
        req.body.products.map((product) => ({
          userId: req.userId,
          inwardId: productInward.id,
          productId: product.id,
          quantity: product.quantity,
        })),
        { transaction }
      );

      return await Promise.all(
        req.body.products.map((product) =>
          Inventory.findOne({
            where: {
              customerId: companyId,
              warehouseId: req.body.warehouseId,
              productId: product.id,
            },
          }).then((inventory) => {
            if (!inventory)
              return Inventory.create(
                {
                  customerId: companyId,
                  warehouseId: req.body.warehouseId,
                  productId: product.id,
                  availableQuantity: product.quantity,
                  referenceId: req.body.referenceId,
                  totalInwardQuantity: product.quantity,
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
      data: productInward,
    });
  } catch (error) {
    console.log("error", error);
  }
});

module.exports = router;
