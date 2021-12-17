"use strict";
const { Model } = require("sequelize");
const DROPOFF_STATUS = require("../enums/dropoffStatus.js");
module.exports = (sequelize, DataTypes) => {
  class RideDropoff extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      RideDropoff.belongsTo(models.File, {
        foreignKey: "manifestId",
        as: "Manifest",
      });
      // RideDropoff.belongsTo(models.City, {
      //   foreignKey: "pickupCityId",
      //   as: "pickupCity",
      // });
      RideDropoff.belongsTo(models.City, {
        foreignKey: "cityId",
        as: "DropoffCity",
      });
      RideDropoff.belongsTo(models.ProductOutward, {
        foreignKey: "outwardId",
        as: "ProductOutward",
      });
      RideDropoff.belongsTo(models.Ride, {
        foreignKey: "rideId",
      });
    }
  }
  RideDropoff.init(
    {
      rideId: DataTypes.INTEGER,
      outwardId: DataTypes.INTEGER,
      cityId: DataTypes.INTEGER,
      address: DataTypes.STRING,
      location: DataTypes.JSON,
      dateTime: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: { notEmpty: { msg: "Please select dropoff date time" } },
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      pocName: DataTypes.STRING,
      pocNumber: DataTypes.STRING,
      currentLocation: DataTypes.STRING,
      memo: DataTypes.STRING,
      manifestId: DataTypes.INTEGER,
      sequenceNumber: DataTypes.INTEGER,
      cancellationReason: DataTypes.STRING,
      cancellationComment: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "RideDropoff",
    }
  );
  return RideDropoff;
};
