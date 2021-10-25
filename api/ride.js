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
  Vehicle,
  Car,
  Category,
  Driver,
} = require("../models");
const { sendForgotPasswordOTPEmail } = require("../services/mailer.service");
const { generateOTP } = require("../services/common.services");
const config = require("../config");
const authService = require("../services/auth.service");
const { APPS } = require("../enums");
const moment = require("moment");

/* GET rides listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = { customerId: req.user.companyId };
  if (req.query.search)
    where[Op.or] = [
      "$PickupCity.name$",
      "$DropoffCity.name$",
      "pickupAddress",
      "dropoffAddress",
      "$Vehicle.Car.CarModel.name$",
      "$Vehicle.registrationNumber$",
      "id",
      "$Customer.name$",
      "$Driver.Vendor.name$",
      "$Driver.name$",
    ].map((key) => ({ [key]: { [Op.like]: "%" + req.query.search + "%" } }));
  if (req.query.status) where["status"] = req.query.status;
  const response = await Ride.findAndCountAll({
    include: [
      {
        model: Vehicle,
        include: [Driver, { model: Company, as: "Vendor" }],
      },
      {
        model: RideProduct,
        include: [Category],
      },
      {
        model: City,
        as: "pickupCity",
      },
      {
        model: City,
        as: "dropoffCity",
      },
    ],
    distinct: true,
    subQuery: false,
    order: [["createdAt", "DESC"]],
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

router.get("/:id", async (req, res, next) => {
  let where = {};
  const response = await Ride.findOne({
    order: [["updatedAt", "DESC"]],
    where: { id: req.params.id, customerId: req.user.companyId },
    include: [
      {
        model: Vehicle,
        include: [Driver, { model: Company, as: "Vendor" }],
      },
      {
        model: RideProduct,
        include: [Category],
      },
      {
        model: City,
        as: "pickupCity",
      },
      {
        model: City,
        as: "dropoffCity",
      },
    ],
  });

  res.json({
    success: true,
    message: "respond with a resource",
    data: response,
  });
});

module.exports = router;
