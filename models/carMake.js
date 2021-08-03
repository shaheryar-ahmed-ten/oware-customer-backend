"use strict";
const { Model } = require("sequelize");
const config = require("../config");
module.exports = (sequelize, DataTypes) => {
  class CarMake extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CarMake.belongsTo(models.User, {
        foreignKey: "userId",
      });
      CarMake.hasMany(models.Car, {
        foreignKey: "makeId",
      });
    }
  }
  CarMake.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: true }
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { notEmpty: { msg: "Please enter a make name" } },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    paranoid: true,
    modelName: "CarMake",
    timestamps: true,
  });
  return CarMake;
};
