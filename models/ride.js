"use strict";
const { Model } = require("sequelize");
const config = require("../config");
const { RIDE_STATUS } = require("../enums");
module.exports = (sequelize, DataTypes) => {
  class Ride extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Ride.belongsTo(models.User, {
        foreignKey: "userId",
      });
      Ride.belongsTo(models.Vehicle, {
        foreignKey: "vehicleId",
      });
      Ride.belongsTo(models.Driver, {
        foreignKey: "driverId",
      });
      Ride.belongsTo(models.Company, {
        foreignKey: "customerId",
        as: "Customer",
      });
      Ride.hasMany(models.RideDropoff, {
        foreignKey: "rideId",
        as: "RideDropoff",
      });
      Ride.belongsTo(models.City, {
        foreignKey: "pickupCityId",
        as: "pickupCity",
      });
    }
  }
  Ride.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true },
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM({
          values: Object.keys(RIDE_STATUS),
        }),
        allowNull: false,
        defaultValue: RIDE_STATUS.UNASSIGNED,
      },
      vehicleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      driverId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // manifestId: {
      //   type: DataTypes.INTEGER,
      //   allowNull: true,
      // },
      internalIdForBusiness: DataTypes.STRING,
      pickupDate: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: { notEmpty: { msg: "Please select pickup date" } },
      },
      pickupAddress: DataTypes.STRING,
      pickupCityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cancellationReason: DataTypes.STRING,
      cancellationComment: DataTypes.STRING,

      weightCargo: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      eta: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      completionTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      eirId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      builtyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      cost: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      customerDiscount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      driverIncentive: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pickupLocation: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      paranoid: true,
      modelName: "Ride",
      timestamps: true,
    }
  );
  return Ride;
};
