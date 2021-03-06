const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const {
  User,
  Company,
  Role,
  VerificationCode,
  Ride,
  RideProduct,
  Area,
  Zone,
  City,
  CarMake,
  CarModel,
  Vehicle,
  Car,
  Category,
  Driver,
  VehicleType,
  File,
  RideDropoff,
} = require("../models");
const models = require("../models/index");
const { sendForgotPasswordOTPEmail } = require("../services/mailer.service");
const { generateOTP, attachDateFilter,isValidDate } = require("../services/common.services");
const config = require("../config");
const authService = require("../services/auth.service");
const { APPS } = require("../enums");
const moment = require("moment-timezone");
const ExcelJS = require("exceljs");
const { Op, Sequelize } = require("sequelize");
// const { digitize, addActivityLog, isValidDate, convertToUTC } = require("../services/common.services");

/* GET rides listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {};
  where = { customerId: req.user.companyId };
  where = attachDateFilter(req.query, where, "createdAt");
  if (req.query.search)
    where[Op.or] = [
      // "$pickupCity.name$", 
      "pickupAddress", 
      "id"].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
    }));
    const response = await Ride.findAndCountAll({
      distinct: true,
      include: [
        {
          model: Company,
          as: "Customer",
          required: true,
        },
        {
          model: Vehicle,
          include: [
            {
              model: Company,
              as: "Vendor",
            },
            {
              model: Car,
              include: [{ model: CarModel }, CarMake, VehicleType],
            },
          ],
        },
        {
          model: Driver,
          include: [{ model: Company, as: "Vendor" }],
        },
        {
          model: City,
          as: "pickupCity",
        },
        {
          model: RideDropoff,
          as: "RideDropoff",
          include: ["DropoffCity", "ProductOutward"],
        },
      ],
      order: [["updatedAt", "DESC"]],
      where,
      limit,
      offset,
  });

  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    pages: Math.ceil(response.count / limit),
    count: response.count,
    currentPage: Math.ceil(response.rows.length / limit),
  });
});

router.get("/export", async (req, res, next) => {
  let where = { customerId: req.user.companyId };

  if (req.query.search)
  where[Op.or] = ["$pickupCity.name$","pickupAddress", "id"].map((key) => ({
    [key]: { [Op.like]: "%" + req.query.search + "%" },
  }));
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

  let workbook = new ExcelJS.Workbook();

  let worksheet = workbook.addWorksheet("Loads");

  const getColumnsConfig = (columns) =>
    columns.map((column) => ({ header: column, width: Math.ceil(column.length * 1.5), outlineLevel: 1 }));

  worksheet.columns = getColumnsConfig([
    "LOAD ID",
    "STATUS",
    // "VENDOR",
    "VEHICLE TYPE",
    "DRIVER",
    "VEHICLE",
    "PRICE",
    // "VENDOR COST",
    // "CUSTOMER DISCOUNT",
    // "DRIVER INCENTIVE",
    "PICKUP CITY",
    "PICKUP ADDRESS",
    "PICKUP DATE",
    // "DROPOFF CITY",
    // "DROPOFF ADDRESS",
    // "DROPOFF DATE",
    // "POC NAME",
    // "POC NUMBER",
    // "ETA(MINUTES)",
    // "TRIP COMPLETION TIME(MINUTES)",
    // "CURRENT LOCATION",
    "WEIGHT OF CARGO(KG)",
    // "MEMO",
  ]);

  const response = await Ride.findAndCountAll({
    distinct: true,
    include: [
      {
        model: Company,
        as: "Customer",
        required: true,
      },
      {
        model: Vehicle,
        include: [
          {
            model: Company,
            as: "Vendor",
          },
          {
            model: Car,
            include: [{ model: CarModel }, CarMake, VehicleType],
          },
        ],
      },
      {
        model: Driver,
        include: [{ model: Company, as: "Vendor" }],
      },
      {
        model: City,
        as: "pickupCity",
      },
      {
        model: RideDropoff,
        as: "RideDropoff",
        include: ["DropoffCity", "ProductOutward"],
      },
    ],
    order: [["updatedAt", "DESC"]],
    where,
  });

  worksheet.addRows(
    response.rows.map((row) => [
      row.id,
      row.status,
      // row.Vehicle.Vendor.name,
      // row.Vehicle.Car.CarMake.name + " " + row.Vehicle.Car.CarModel.name,
      row.Vehicle ? row.Vehicle.Car.CarMake.name + " " + row.Vehicle.Car.CarModel.name : " ",
      row.Driver ? row.Driver.name : " ",
      row.Vehicle ? row.Vehicle.registrationNumber : " ",
      row.price ? row.price : " ",
      // row.cost,
      // row.customerDiscount,
      // row.driverIncentive,
      row.pickupCity ? row.pickupCity.name : " ",
      row.pickupAddress ? row.pickupAddress : " ",
      // row.pickupDate ? moment(row.pickupDate).tz(req.query.client_Tz).format("DD/MM/yy h:mm A"): " ",
      isValidDate(row.pickupDate) ? moment(row.pickupDate).tz(req.query.client_Tz).format("DD/MM/yy h:mm A") : " ",
      // row.dropoffCity.name,
      // row.dropoffAddress,
      // isValidDate(row.dropoffDate) ? moment(row.dropoffDate).tz(req.query.client_Tz).format("DD/MM/yy h:mm A") : " ",
      // row.pocName,
      // row.pocNumber,
      // row.eta !== null && row.eta !== 0 ? row.eta / 60 : 0,
      // row.completionTime !== null && row.completionTime !== 0 ? row.completionTime / 60 : 0,
      // row.currentLocation,
      row.weightCargo ? row.weightCargo : " ",
      // row.memo,
    ])
  );

  // Ride Products Sheet

  worksheet = workbook.addWorksheet("Dropoff Details");

  worksheet.columns = getColumnsConfig([
    "LOAD ID", 
    "OUTWARD ID", 
    "DROPOFF CITY", 
    "DROPOFF ADDRESS", 
    "DROPOFF DATE",
    "POC NAME",
    "POC NUMBER",
    "CURRENT LOCATION",
    "MEMO"
  ]);

  response.rows.map((row) => {
    worksheet.addRows(
      row.RideDropoff.map((dropoff) => [
        row.id, 
        dropoff.ProductOutward ? dropoff.ProductOutward.internalIdForBusiness : " ", 
        dropoff.DropoffCity ? dropoff.DropoffCity.name : " ",
        dropoff.address ? dropoff.address : " ", 
        isValidDate(dropoff.dateTime) ? moment(dropoff.dateTime).tz(req.query.client_Tz).format("DD/MM/yy h:mm A") : " ",
        dropoff.pocName ? dropoff.pocName : " ",
        dropoff.pocNumber ? dropoff.pocNumber : " ",
        dropoff.currentLocation ? dropoff.currentLocation : " ",
        dropoff.memo ? dropoff.memo : " ",
      
      ])
    );
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=" + "Inventory.xlsx");

  await workbook.xlsx.write(res).then(() => res.end());
});

router.get("/:id", async (req, res, next) => {
  let where = {};
  const response = await Ride.findOne({
    order: [["updatedAt", "DESC"]],
    where: { id: req.params.id, customerId: req.user.companyId  },
    include: [
      {
        model: Company,
        as: "Customer",
      },
      {
        model: Vehicle,
        include: [
          {
            model: Company,
            as: "Vendor",
          },
          {
            model: Car,
            include: [CarModel, CarMake, VehicleType],
          },
        ],
      },
      {
        model: Driver,
        include: [{ model: Company, as: "Vendor" }],
      },
      {
        model: City,
        as: "pickupCity",
      },
      { model: RideDropoff, as: "RideDropoff", include: [{ model: City, as: "DropoffCity" },{ model: models.ProductOutward, as: "ProductOutward" }] },
    ],
  });

  res.json({
    success: true,
    message: "respond with a resource",
    data: response,
  });
});

module.exports = router;
