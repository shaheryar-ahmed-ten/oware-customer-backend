"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Product.belongsTo(models.User, {
        foreignKey: "userId",
      });
      Product.belongsTo(models.Brand, {
        foreignKey: "brandId",
      });
      Product.belongsTo(models.UOM, {
        foreignKey: "uomId",
      });
      Product.belongsTo(models.Category, {
        foreignKey: "categoryId",
      });
      Product.belongsToMany(models.ProductInward, {
        through: models.InwardGroup,
        foreignKey: "productId",
      });
      Product.hasMany(models.Inventory, {
        foreignKey: "productId",
      });
    }
  }
  Product.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true },
      },
      name: {
        type: DataTypes.STRING,
        validate: { notEmpty: { msg: "Please enter name" } },
      },
      description: {
        type: DataTypes.STRING,
        validate: { notEmpty: { msg: "Please enter description" } },
      },
      dimensionsCBM: {
        type: DataTypes.INTEGER,
        validate: { notEmpty: { msg: "Please enter dimensionsCBM" } },
      },
      weight: {
        type: DataTypes.INTEGER,
        validate: { notEmpty: { msg: "Please enter weight" } },
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Category cannot be empty" } },
      },
      brandId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Brand cannot be empty" } },
      },
      uomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "UOM cannot be empty" } },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      batchEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      paranoid: true,
      modelName: "Product",
    }
  );
  return Product;
};
