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
      //   Ride.belongsTo(models.User, {
      //     foreignKey: 'userId'
      //   });
      //   Ride.belongsTo(models.Vehicle, {
      //     foreignKey: 'vehicleId'
      //   });
      //   Ride.belongsTo(models.Driver, {
      //     foreignKey: 'driverId'
      //   });
      Ride.belongsTo(models.Area, {
        foreignKey: "pickupAreaId",
        as: "PickupArea"
      });
      Ride.belongsTo(models.Area, {
        foreignKey: "dropoffAreaId",
        as: "DropoffArea"
      });
      Ride.hasMany(models.RideProduct, {
        foreignKey: "rideId",
        sourceKey: "id"
      });
    }
  }
  Ride.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true }
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      vehicleId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      driverId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      // manifestId: {
      //   type: DataTypes.INTEGER,
      //   allowNull: true
      // },
      // internalIdForBusiness: DataTypes.STRING,
      pickupDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: { notEmpty: { msg: "Please select pickup date" } }
      },
      dropoffDate: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: { notEmpty: { msg: "Please select dropoff date" } }
      },
      pickupAddress: DataTypes.STRING,
      pickupAreaId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      dropoffAddress: DataTypes.STRING,
      dropoffAreaId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      cancellationReason: DataTypes.STRING,
      cancellationComment: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM({
          values: Object.keys(RIDE_STATUS)
        }),
        allowNull: false,
        defaultValue: RIDE_STATUS.UNASSIGNED
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      cost: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      customerDiscount: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      driverIncentive: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      paranoid: true,
      modelName: "Ride",
      timestamps: true
    }
  );
  return Ride;
};
