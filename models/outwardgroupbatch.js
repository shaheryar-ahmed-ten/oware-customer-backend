"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class OutwardGroupBatch extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      OutwardGroupBatch.belongsTo(models.InventoryDetail, {
        foreignKey: "inventoryDetailId",
        as: "InventoryDetail",
      });
      OutwardGroupBatch.belongsTo(models.OutwardGroup, {
        foreignKey: "outwardGroupId",
        as: "OutwardGroup",
      });
    }
  }
  OutwardGroupBatch.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true },
        primaryKey: true,
        autoIncrement: true,
      },
      outwardGroupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true },
      },
      inventoryDetailId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "OutwardGroupBatch",
    }
  );
  return OutwardGroupBatch;
};
