'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Brand extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Brand.belongsTo(models.User, {
        foreignKey: 'userId'
      });
    }
  };
  Brand.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: true }
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      validate: { notEmpty: { msg: 'Please enter brand name' } }
    },
    manufacturerName: {
      type: DataTypes.STRING,
      unique: true,
      validate: { notEmpty: { msg: 'Please enter manufacturer name' } }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
  }, {
    sequelize,
    paranoid: true,
    modelName: 'Brand',
  });
  return Brand;
};