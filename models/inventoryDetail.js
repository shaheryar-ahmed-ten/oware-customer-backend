"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class InventoryDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      InventoryDetail.belongsTo(models.Inventory, {
        foreignKey: "inventoryId",
        as: "Inventory",
      });
    }
  }
  InventoryDetail.init(
    {
      InventoryId: DataTypes.INTEGER,
      internalIdForBusiness: DataTypes.INTEGER,
      manufacturingDate: DataTypes.DATE,
      expiryDate: DataTypes.DATE,
      batchNumber: DataTypes.STRING,
      inwardQuantity: DataTypes.INTEGER,
      availableQuantity: DataTypes.INTEGER,
      outwardQuantity: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "InventoryDetail",
    }
  );
  return InventoryDetail;
};
