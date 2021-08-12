"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  class ProductOutward extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ProductOutward.belongsTo(models.User, {
        foreignKey: "userId"
      });
      ProductOutward.belongsTo(models.Vehicle, {
        foreignKey: "vehicleId"
      });
      ProductOutward.belongsTo(models.DispatchOrder, {
        foreignKey: "dispatchOrderId"
      });
      ProductOutward.belongsToMany(models.Inventory, {
        through: models.OutwardGroup,
        foreignKey: "outwardId",
        as: "Inventories"
      });
      ProductOutward.hasMany(models.OutwardGroup, {
        foreignKey: "outwardId"
      });
    }
  }
  ProductOutward.init(
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
      referenceId: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      internalIdForBusiness: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      dispatchOrderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Dispatch order cannot be empty" } }
      },
      vehicleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Dispatch order cannot be empty" } }
      }
    },
    {
      sequelize,
      paranoid: true,
      modelName: "ProductOutward"
    }
  );

  return ProductOutward;
};
