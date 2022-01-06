"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  class InwardGroupBatch extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      InwardGroupBatch.belongsTo(models.InwardGroup, {
        foreignKey: "inwardGroupId",
        as: "InwardGroup",
      });
      InwardGroupBatch.belongsTo(models.InventoryDetail, {
        foreignKey: "inventoryDetailId",
        as: "InventoryDetail",
      });
    }
  }
  InwardGroupBatch.init(
    {
      inwardGroupId: {
        type: DataTypes.INTEGER,
        validate: {
          isInt: { msg: "Please enter group Id" },
        },
      },
      inventoryDetailId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Please provide inventoryDetailId" } },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      paranoid: true,
      modelName: "InwardGroupBatch",
    }
  );

  return InwardGroupBatch;
};
