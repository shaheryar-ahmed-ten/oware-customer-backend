"use strict";
const { Model } = require("sequelize");
const config = require("../config");
module.exports = (sequelize, DataTypes) => {
  class Driver extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Driver.belongsTo(models.User, {
        foreignKey: "userId"
      });
      Driver.hasMany(models.Vehicle, {
        foreignKey: "driverId"
      });
      Driver.hasMany(models.Ride, {
        foreignKey: "driverId"
      });
<<<<<<< HEAD
      Driver.belongsTo(models.File, {
        foreignKey: "drivingLicenseId",
        as: 'DrivingLicense'
      });
      Driver.belongsTo(models.File, {
        foreignKey: "cnicId",
        as: 'Cnic'
      });
      Driver.belongsTo(models.File, {
        foreignKey: "photoId",
        as: 'Photo'
      });
=======
>>>>>>> 289312a42b5e8ebdbc32c38eb6393dc9c66d40fa
      Driver.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: 'Vendor'
      });
    }
  }
  Driver.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: true }
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: { msg: "Please enter vendor name" } },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: "Please enter name" } },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: "Please enter phone number" } },
    },
    photoId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cnicId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cnicNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: "Please enter cnic number" } },
    },
    drivingLicenseId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    drivingLicenseNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: "Please enter driving license number" } },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    paranoid: true,
    modelName: "Driver",
    timestamps: true,
  });
  return Driver;
};
