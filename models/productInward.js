'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class ProductInward extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ProductInward.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      ProductInward.belongsTo(models.Product, {
        foreignKey: 'productId'
      });
      ProductInward.belongsTo(models.Warehouse, {
        foreignKey: 'warehouseId'
      });
      ProductInward.belongsTo(models.Company, {
        foreignKey: 'customerId'
      });
    };
  };
  ProductInward.init({
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
    internalIdForBusiness: {
      type: DataTypes.STRING(30),
      allowNull: true
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
    referenceId:{
      type: DataTypes.STRING(30),
      allowNull:true,
    },
    warehouseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: { msg: 'Warehouse cannot be empty' } }
    },
  }, {
    sequelize,
    paranoid: true,
    modelName: 'ProductInward',
  });

  return ProductInward;
};