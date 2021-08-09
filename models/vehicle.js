"use strict";
const { Model } = require("sequelize");
const { VEHICLE_TYPES } = require("../enums");
module.exports = (sequelize, DataTypes) => {
  class Vehicle extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Vehicle.belongsTo(models.User, {
        foreignKey: "userId"
      });
      Vehicle.hasOne(models.ProductOutward, {
        foreignKey: "vehicleId"
      });
      Vehicle.belongsTo(models.Driver, {
        foreignKey: "driverId"
      });
      Vehicle.belongsTo(models.File, {
        foreignKey: "runningPaperId",
        as: "RunningPaper"
      });
      Vehicle.belongsTo(models.File, {
        foreignKey: "routePermitId",
        as: "RoutePermit"
      });
      Vehicle.belongsTo(models.File, {
        foreignKey: "photoId",
        as: "Photo"
      });
      Vehicle.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "Vendor"
      });
      Vehicle.belongsTo(models.Car, {
        foreignKey: "carId"
      });
      Vehicle.belongsTo(models.Driver, {
        foreignKey: "driverId"
      });
      Vehicle.belongsTo(models.Car, {
        foreignKey: "carId"
      });
    }
  }
  Vehicle.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true }
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter vendor name" } }
      },
      driverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter driver name" } }
      },
      registrationNumber: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter a vehicle number" } }
      },
      carId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { notEmpty: { msg: "Please enter car" } }
      },
      photoId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      runningPaperId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      routePermitId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      paranoid: true,
      modelName: "Vehicle",
      timestamps: true
    }
  );
  return Vehicle;
};
