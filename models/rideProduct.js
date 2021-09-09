'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class RideProduct extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      RideProduct.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      RideProduct.belongsTo(models.Category, {
        foreignKey: 'categoryId'
      });
      RideProduct.belongsTo(models.Ride, {
        foreignKey: 'rideId'
      });
    };
  };
  RideProduct.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: true }
    },
    rideId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: true }
    },
    name: {
      type: DataTypes.STRING,
      validate: { notEmpty: { msg: 'Please enter name' } }
    },
    quantity: {
      type: DataTypes.INTEGER,
      validate: {
        isInt: { msg: 'Please enter quantity' }
      }
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: { msg: 'Category cannot be empty' } }
    }
  }, {
    sequelize,
    paranoid: true,
    modelName: 'RideProduct',
  }); return RideProduct;
};