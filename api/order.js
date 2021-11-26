const express = require("express");
const router = express.Router();
const moment = require("moment-timezone");
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
  User,
} = require("../models");
const config = require("../config");
const { Op, Sequelize, fn, col } = require("sequelize");
const { digitize, attachDateFilter } = require("../services/common.services");
const { RELATION_TYPES } = require("../enums");
const ExcelJS = require("exceljs");
const { CloudWatchLogs } = require("aws-sdk");

// /* GET dispatchOrders listing. */
router.get("/", async (req, res, next) => {
  try {
    const limit = req.query.rowsPerPage || config.rowsPerPage;
    const offset = (req.query.page - 1 || 0) * limit;
    let where = {
      // userId: req.userId
    };
    where = attachDateFilter(req.query, where, "createdAt");
    if (req.query.search)
      where[Op.or] = ["$Inventory.Warehouse.name$", "internalIdForBusiness", "referenceId"].map((key) => ({
        [key]: { [Op.like]: "%" + req.query.search + "%" },
      }));
    if (req.query.status)
      where[Op.or] = ["status"].map((key) => ({
        [key]: { [Op.eq]: req.query.status },
      }));
    if (req.query.warehouse)
      where[Op.or] = ["$Inventory.Warehouse.id$"].map((key) => ({
        [key]: { [Op.eq]: req.query.warehouse },
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
            { model: Warehouse, required: true },
          ],
          where: { customerId: companyId },
          required: true,
        },
        {
          model: Inventory,
          as: "Inventories",
          include: [{ model: Product, include: [{ model: UOM }] }, Company, Warehouse],
          where: { customerId: companyId },
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
      where,
      limit,
      offset,
      distinct: true,
    });
    for (const { dataValues } of response.rows) {
      dataValues["ProductOutwards"] = await ProductOutward.findAll({
        include: ["OutwardGroups", "Vehicle"],
        attributes: ["quantity", "referenceId", "internalIdForBusiness"],
        required: false,
        where: { dispatchOrderId: dataValues.id },
      });
    }

    res.json({
      success: true,
      message: "respond with a resource",
      data: response.rows,
      count: response.count,
      pages: Math.ceil(response.count / limit),
    });
  } catch (error) {
    res.json(error);
  }
});

router.get("/export", async (req, res, next) => {
  let where = {};
  let workbook = new ExcelJS.Workbook();

  worksheet = workbook.addWorksheet("Orders");

  const getColumnsConfig = (columns) =>
    columns.map((column) => ({ header: column, width: Math.ceil(column.length * 1.5), outlineLevel: 1 }));

  worksheet.columns = getColumnsConfig([
    "DISPATCH ORDER ID",
    "PRODUCT",
    "WAREHOUSE",
    "UOM",
    "RECEIVER NAME",
    "RECEIVER PHONE",
    "QUANTITY REQUESTED ",
    "QUANTITY SHIPPED ",
    "REFERENCE ID",
    "CREATOR",
    "CREATED DATE",
    "STATUS",
    "ORDER MEMO",
  ]);

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

  if (req.query.search)
      where[Op.or] = ["$Inventory.Warehouse.name$", "internalIdForBusiness", "referenceId"].map((key) => ({
        [key]: { [Op.like]: "%" + req.query.search + "%" },
      }));
  if (req.query.status)
    where[Op.or] = ["status"].map((key) => ({
      [key]: { [Op.eq]: req.query.status },
    }));
  if (req.query.warehouse)
    where[Op.or] = ["$Inventory.Warehouse.id$"].map((key) => ({
      [key]: { [Op.eq]: req.query.warehouse },
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
          { model: Warehouse, required: true },
        ],
        where: { customerId: companyId },
        required: true,
      },
      {
        model: Inventory,
        as: "Inventories",
        include: [{ model: Product, include: [{ model: UOM }] }, Company, Warehouse],
        where: { customerId: companyId },
        required: true,
      },
      {
        model: User,
      },
    ],
    order: [["createdAt", "DESC"]],
    where,
  });
  for (const { dataValues } of response.rows) {
    dataValues["ProductOutwards"] = await ProductOutward.findAll({
      include: ["OutwardGroups", "Vehicle"],
      attributes: ["quantity", "referenceId", "internalIdForBusiness"],
      required: false,
      where: { dispatchOrderId: dataValues.id },
    });
  }
  const orderArray = [];
  for (const order of response.rows) {
    for (const inv of order.Inventories) {
      if (order.dataValues.ProductOutwards && order.dataValues.ProductOutwards.length > 0) {
        for (const outInv of order.dataValues.ProductOutwards) {
          orderArray.push([
            order.internalIdForBusiness || "",
            inv.Product.name,
            order.Inventory.Warehouse.name,
            inv.Product.UOM.name,
            order.receiverName,
            order.receiverPhone,
            inv.OrderGroup.quantity,
            outInv.OutwardGroups.find((oGroup) => oGroup.inventoryId === inv.OrderGroup.inventoryId)
              ? outInv.OutwardGroups.find((oGroup) => oGroup.inventoryId === inv.OrderGroup.inventoryId).quantity
              : 0, // incase of partial/fullfilled i.e 0 < outwards
            order.referenceId || "",
            `${order.User.firstName || ""} ${order.User.lastName || ""}`,
            moment(order.createdAt).tz(req.query.client_Tz).format("DD/MM/yy HH:mm"),
            order.status == "0"
              ? "PENDING"
              : order.status == "1"
              ? "PARTIALLY FULFILLED"
              : order.status == "2"
              ? "FULFILLED"
              : order.status == "3"
              ? "CANCELLED"
              : "",
            order.orderMemo || "",
          ]);
        }
      } else {
        orderArray.push([
          order.internalIdForBusiness || "",
          inv.Product.name,
          order.Inventory.Warehouse.name,
          inv.Product.UOM.name,
          order.receiverName,
          order.receiverPhone,
          inv.OrderGroup.quantity,
          0, // incase of pending i.e 0 outwards
          order.referenceId || "",
          `${order.User.firstName || ""} ${order.User.lastName || ""}`,
          moment(order.createdAt).tz(req.query.client_Tz).format("DD/MM/yy HH:mm"),
          order.status == "0"
            ? "PENDING"
            : order.status == "1"
            ? "PARTIALLY FULFILLED"
            : order.status == "2"
            ? "FULFILLED"
            : order.status == "3"
            ? "CANCELLED"
            : "",
          order.orderMemo || "",
        ]);
      }
    }
  }

  worksheet.addRows(orderArray);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=" + "Inventory.xlsx");

  await workbook.xlsx.write(res).then(() => res.end());
});

/* POST create new dispatchOrder. */
router.post("/", async (req, res, next) => {
  let message = "New dispatchOrder registered";
  let dispatchOrder;
  req.body["shipmentDate"] = new Date(moment(req.body["shipmentDate"]).tz("Africa/Abidjan"));
  req.body.inventories = req.body.inventories || [{ id: req.body.inventoryId, quantity: req.body.quantity }];
  req.body.customerId = req.userId;
  try {
    await sequelize.transaction(async (transaction) => {
      dispatchOrder = await DispatchOrder.create(
        {
          userId: req.userId,
          ...req.body,
        },
        { transaction }
      );
      const numberOfInternalIdForBusiness = digitize(dispatchOrder.id, 6);
      dispatchOrder.internalIdForBusiness = req.body.internalIdForBusiness + numberOfInternalIdForBusiness;
      let sumOfComitted = [];
      let comittedAcc;
      req.body.inventories.forEach((Inventory) => {
        let quantity = parseInt(Inventory.quantity);
        sumOfComitted.push(quantity);
      });
      comittedAcc = sumOfComitted.reduce((acc, po) => {
        return acc + po;
      });
      dispatchOrder.quantity = comittedAcc;
      await dispatchOrder.save({ transaction });
      let inventoryIds = [];
      inventoryIds = req.body.inventories.map((inventory) => {
        return inventory.id;
      });
      const toFindDuplicates = (arry) => arry.filter((item, index) => arry.indexOf(item) != index);
      const duplicateElements = toFindDuplicates(inventoryIds);
      if (duplicateElements.length != 0) {
        throw new Error("Can not add same inventory twice");
      }

      await OrderGroup.bulkCreate(
        req.body.inventories.map((inventory) => ({
          userId: req.userId,
          orderId: dispatchOrder.id,
          inventoryId: inventory.id,
          quantity: inventory.quantity,
        })),
        { transaction }
      );

      return Promise.all(
        req.body.inventories.map((_inventory) => {
          return Inventory.findByPk(_inventory.id, { transaction }).then((inventory) => {
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
      data: dispatchOrder,
    });
  } catch (err) {
    console.log("err", err);
    res.json({
      success: false,
      message: err.toString().replace("Error: ", ""),
    });
  }
});

router.get("/relations", async (req, res, next) => {
  const whereClauseWithoutDate = { customerId: req.companyId };
  const relations = {
    warehouses: await sequelize
      .query(
        `select w.id,w.name from DispatchOrders do 
      inner join Inventories i on do.inventoryId = i.id 
      inner join Warehouses w on i.warehouseId = w.id 
      where i.customerId = ${req.companyId}
      group by w.name,w.id`
      )
      .then((item) => item[0]),
    products: [],
  };
  res.json({
    success: true,
    message: "respond with a resource",
    relations,
  });
});

router.get("/inventory", async (req, res, next) => {
  if (req.query.customerId && req.query.warehouseId && req.query.productId) {
    const inventory = await Inventory.findOne({
      where: {
        customerId: req.query.customerId,
        warehouseId: req.query.warehouseId,
        productId: req.query.productId,
      },
    });
    res.json({
      success: true,
      message: "respond with a resource",
      inventory,
    });
  } else
    res.json({
      success: false,
      message: "No inventory found",
    });
});

router.get("/warehouses", async (req, res, next) => {
  if (req.query.customerId) {
    const inventories = await Inventory.findAll({
      where: {
        customerId: req.query.customerId,
      },
      attributes: ["warehouseId", fn("COUNT", col("warehouseId"))],
      include: [
        {
          model: Warehouse,
        },
      ],
      group: "warehouseId",
    });
    res.json({
      success: true,
      message: "respond with a resource",
      warehouses: inventories.map((inventory) => inventory.Warehouse),
    });
  } else
    res.json({
      success: false,
      message: "No inventory found",
    });
});

router.get("/products", async (req, res, next) => {
  if (req.query.customerId) {
    const inventories = await Inventory.findAll({
      where: {
        customerId: req.query.customerId,
        warehouseId: req.query.warehouseId,
        availableQuantity: {
          [Op.ne]: 0,
        },
      },
      attributes: ["productId", fn("COUNT", col("productId"))],
      include: [
        {
          model: Product,
          include: [{ model: UOM }],
        },
      ],
      group: "productId",
    });
    res.json({
      success: true,
      message: "respond with a resource",
      products: inventories.map((inventory) => inventory.Product),
    });
  } else
    res.json({
      products: [],
      success: false,
      message: "No inventory found",
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
          include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }],
        },
        {
          model: ProductOutward,
          include: [
            {
              model: Inventory,
              as: "Inventories",
              include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }],
            },
            {
              model: Vehicle,
              include: [{ model: Car, include: [CarMake, CarModel] }],
            },
          ],
        },
      ],
    });
    return res.json({
      success: true,
      message: "Product Outwards inside Dispatch Orders",
      data: response.rows,
      count: response.count,
      pages: Math.ceil(response.count / limit),
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
