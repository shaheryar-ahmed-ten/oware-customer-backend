"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class InboundStat extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      InboundStat.belongsTo(models.Company, {
        foreignKey: "customerId"
      });
      InboundStat.belongsTo(models.Warehouse, {
        foreignKey: "warehouseId"
      });
      InboundStat.belongsTo(models.Product, {
        foreignKey: "productId"
      });
      InboundStat.belongsTo(models.ProductInward, {
        foreignKey: "id"
      });
      // InboundStat.belongsToMany(models.Product, {
      //   through: models.InwardGroup,
      //   foreignKey: "productInwardId",
      //   as: "Products"
      // });
    }
  }
  InboundStat.init(
    {
      customerId: DataTypes.INTEGER,
      warehouseId: DataTypes.INTEGER,
      productId: DataTypes.INTEGER,
      productInwardId: DataTypes.INTEGER,
      product: DataTypes.STRING,
      weight: DataTypes.INTEGER,
      dimensionsCBM: DataTypes.INTEGER,
      uom: DataTypes.STRING,
      warehouse: DataTypes.STRING,
      customer: DataTypes.STRING,
      productInwardCreatedAt: DataTypes.DATE
    },
    {
      sequelize,
      modelName: "InboundStat"
    }
  );
  return InboundStat;
};
