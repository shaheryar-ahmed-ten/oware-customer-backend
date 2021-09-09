'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class City extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      City.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      City.hasMany(models.Zone, {
        foreignKey: 'cityId'
      });
    }
  };
  City.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: true }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: {msg: 'Please enter zone name'} },
      unique: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
  }, {
    sequelize,
    paranoid: true,
    modelName: 'City',
  });
  return City;
};