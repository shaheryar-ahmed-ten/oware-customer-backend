'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');
const config = require('../config');

module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Customer.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      Customer.belongsTo(models.User, {
        foreignKey: 'contactId',
        as: 'Contact'
      });
      Customer.hasMany(models.User, {
        foreignKey: 'companyId',
        as: 'Employees'
      });
    };
  };
  Customer.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: true }
    },
    type: {
      type: DataTypes.ENUM({
        values: config.customerTypes
      }),
      allowNull: false,
    },
    contactId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: { msg: 'Please select a contact' } }
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: 'Please enter company name' } }
    },
    notes: DataTypes.STRING,
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
  }, {
    sequelize,
    paranoid: true,
    modelName: 'Customer',
  });

  return Customer;
};