'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OutboundStat extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      OutboundStat.belongsTo(models.Customer, {
        foreignKey: 'customerId'
      });
      OutboundStat.belongsTo(models.Warehouse, {
        foreignKey: 'warehouseId'
      });
      OutboundStat.belongsTo(models.Product, {
        foreignKey: 'productId'
      });
      OutboundStat.belongsTo(models.DispatchOrder, {
        foreignKey: 'dispatchOrderId'
      });
      OutboundStat.belongsTo(models.ProductOutward, {
        foreignKey: 'productOutwardId'
      });
    }
  };
  OutboundStat.init({
    customerId: DataTypes.INTEGER,
    warehouseId: DataTypes.INTEGER,
    productId: DataTypes.INTEGER,
    dispatchOrderId: DataTypes.INTEGER,
    productOutwardId: DataTypes.INTEGER,
    product: DataTypes.STRING,
    weight: DataTypes.INTEGER,
    dimensionsCBM: DataTypes.INTEGER,
    uom: DataTypes.STRING,
    warehouse: DataTypes.STRING,
    customer: DataTypes.STRING,
    dispatchOrderCreatedAt: DataTypes.DATE,
    productOutwardCreatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'OutboundStat',
  });
  return OutboundStat;
};