"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  class DispatchOrder extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      DispatchOrder.belongsTo(models.User, {
        foreignKey: "userId"
      });
      DispatchOrder.hasMany(models.ProductOutward, {
<<<<<<< HEAD
        foreignKey: "dispatchOrderId"
      });
      DispatchOrder.belongsTo(models.Inventory, {
        foreignKey: "inventoryId",
        as: "Inventory"
=======
        foreignKey: 'dispatchOrderId',
      });
      DispatchOrder.belongsTo(models.Inventory, {
        foreignKey: 'inventoryId',
        as: 'Inventory'
      });
      DispatchOrder.belongsToMany(models.Inventory, {
        through: models.OrderGroup,
        foreignKey: 'orderId',
        as: 'Inventories'
>>>>>>> 289312a42b5e8ebdbc32c38eb6393dc9c66d40fa
      });
      DispatchOrder.belongsToMany(models.Inventory, {
        through: models.OrderGroup,
        foreignKey: "orderId",
        as: "Inventories"
      });
    }
  }
  DispatchOrder.init(
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
      internalIdForBusiness: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      referenceId: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      receiverName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter receiver name" } }
      },
      receiverPhone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Please enter receiver phone number" },
          isNumeric: { msg: "Please enter correct receiver phone number" }
        }
      },
      shipmentDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: { notEmpty: { msg: "Please select shipment date" } }
      },
      inventoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Please select inventory" } }
      }
    },
    {
      sequelize,
      paranoid: true,
      modelName: "DispatchOrder"
    }
  );

  return DispatchOrder;
};
