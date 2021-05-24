"use strict";
const { Model } = require("sequelize");
const config = require("../config");
module.exports = (sequelize, DataTypes) => {
  class Vehicle extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Vehicle.hasOne(models.ProductOutward, {
        foreignKey: "vehicleId",
      });
    }
  }
  Vehicle.init(
    {
      number: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        //validate: { notEmpty: { msg: "Please enter a vehicle number" } },
      },
      type: {
        type: DataTypes.ENUM({
          values: config.vehicleTypes,
        }),
        allowNull: false,
        validate: { notEmpty: { msg: "Please select vehicle type" } },
      },
    },
    {
      sequelize,
      paranoid: true,
      modelName: "Vehicle",
      timestamps: true,
    }
  );
  return Vehicle;
};
