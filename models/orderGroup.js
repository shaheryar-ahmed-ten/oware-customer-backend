'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrderGroup extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      OrderGroup.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      OrderGroup.belongsTo(models.Inventory, {
        foreignKey: 'inventoryId'
      });
      OrderGroup.belongsTo(models.DispatchOrder, {
        foreignKey: 'orderId'
      });
    };
  };
  OrderGroup.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: true }
    },
    quantity: {
      type: DataTypes.INTEGER,
      validate: {
        isInt: { msg: 'Please enter quantity' }
      }
    },
    inventoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: { msg: 'Inventory cannot be empty' } }
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: { msg: 'Order cannot be empty' } }
    },
  }, {
    sequelize,
    paranoid: true,
    modelName: 'OrderGroup',
  });

  return OrderGroup;
};