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
        foreignKey: "userId",
      });
      InwardGroup.belongsTo(models.Product, {
        foreignKey: "productId",
      });
      InwardGroup.belongsTo(models.ProductInward, {
        foreignKey: "inwardId",
      });
      InwardGroup.belongsToMany(models.InventoryDetail, {
        through: models.InwardGroupBatch,
        as: "InventoryDetail",
        foreignKey: "inwardGroupId",
      });
    }
  }
  InwardGroup.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true },
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true },
      },
      quantity: {
        type: DataTypes.INTEGER,
        validate: {
          isInt: { msg: "Please enter quantity" },
        },
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Product cannot be empty" } },
      },
      inwardId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Inward cannot be empty" } },
      },
      inventoryDetailId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      paranoid: true,
      modelName: "InwardGroup",
      sync: true,
      defaultScope: {
        include: "InventoryDetail",
      },
    }
  );

  return InwardGroup;
};
