"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  class Inventory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Inventory.belongsTo(models.Product, {
        foreignKey: "productId"
      });
      Inventory.belongsTo(models.Warehouse, {
        foreignKey: "warehouseId"
      });
      Inventory.belongsTo(models.Company, {
        foreignKey: "customerId"
      });
      Inventory.hasMany(models.DispatchOrder, {
        foreignKey: "inventoryId"
      });
      Inventory.belongsToMany(models.DispatchOrder, {
        through: models.OrderGroup,
<<<<<<< HEAD
        foreignKey: "inventoryId"
      });
      Inventory.belongsToMany(models.ProductOutward, {
        through: models.OutwardGroup,
        foreignKey: "inventoryId"
      });
    }
  }
  Inventory.init(
    {
      availableQuantity: DataTypes.INTEGER,
      totalInwardQuantity: DataTypes.INTEGER,
      committedQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      dispatchedQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Product cannot be empty" } }
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Customer cannot be empty" } }
      },
      warehouseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Warehouse cannot be empty" } }
      }
=======
        foreignKey: 'inventoryId'
      });
      Inventory.belongsToMany(models.ProductOutward, {
        through: models.OutwardGroup,
        foreignKey: 'inventoryId'
      });
    };
  };
  Inventory.init({
    availableQuantity: DataTypes.INTEGER,
    totalInwardQuantity: DataTypes.INTEGER,
    committedQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    dispatchedQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: { msg: 'Product cannot be empty' } }

    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: { msg: 'Customer cannot be empty' } }
    },
    warehouseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: { msg: 'Warehouse cannot be empty' } }

>>>>>>> 289312a42b5e8ebdbc32c38eb6393dc9c66d40fa
    },
    {
      sequelize,
      paranoid: true,
      modelName: "Inventory"
    }
  );

  return Inventory;
};
