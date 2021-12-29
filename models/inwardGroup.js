"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  class InwardGroup extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      InwardGroup.belongsTo(models.User, {
        foreignKey: "userId"
      });
      InwardGroup.belongsTo(models.Product, {
        foreignKey: "productId"
      });
      InwardGroup.belongsTo(models.ProductInward, {
        foreignKey: "inwardId"
      });
      InwardGroup.belongsTo(models.InventoryDetail, {
        foreignKey: "inventoryDetailId",
        as: "InventoryDetail",
      });
    }
  }
  InwardGroup.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true }
      },
      quantity: {
        type: DataTypes.INTEGER,
        validate: {
          isInt: { msg: "Please enter quantity" }
        }
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Product cannot be empty" } }
      },
      inwardId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Inward cannot be empty" } }
      }
    },
    {
      sequelize,
      paranoid: true,
      modelName: "InwardGroup"
    }
  );

  return InwardGroup;
};
