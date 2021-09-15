'use strict';
const { Model } = require('sequelize');
const config = require('../config');
const { APPS } = require('../enums');

module.exports = (sequelize, DataTypes) => {
  class Company extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Company.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      Company.belongsTo(models.User, {
        foreignKey: 'contactId',
        as: 'Contact'
      });
      Company.hasMany(models.User, {
        foreignKey: 'companyId',
        as: 'Employees'
      });
    };
  };
  Company.init({
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: 'Please enter company name' } }
    },
    logoId: DataTypes.INTEGER,
    allowedApps: {
      type: DataTypes.ENUM({
        values: Object.keys(APPS)
      }),
      allowNull: false,
      defaultValue: APPS.CUSTOMER
    },
    notes: DataTypes.STRING,
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
  }, {
    sequelize,
    paranoid: true,
    modelName: 'Company',
  });

  return Company;
};