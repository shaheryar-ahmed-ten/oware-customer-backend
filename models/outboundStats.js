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
      OutboundStat.belongsTo(models.Company, {
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
        foreignKey: 'id'
      });
    }
  };
  OutboundStat.init({
    customerId: DataTypes.INTEGER,
    warehouseId: DataTypes.INTEGER,
    vehicleId: DataTypes.INTEGER,
    productId: DataTypes.INTEGER,
    productOutwardId: {
      allowNull: true,
      type: DataTypes.INTEGER
    },
    productOutwardQuantity: {
      allowNull: true,
      type: DataTypes.INTEGER
    },
    dispatchOrderId: DataTypes.INTEGER,
    dispatchOrderQuantity: DataTypes.INTEGER,
    product: DataTypes.STRING,
    weight: DataTypes.INTEGER,
    dimensionsCBM: DataTypes.INTEGER,
    uom: DataTypes.STRING,
    warehouse: DataTypes.STRING,
    customer: DataTypes.STRING,
    dispatchOrderCreatedAt: DataTypes.DATE,
    createdAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'OutboundStat',
  });
  return OutboundStat;
};