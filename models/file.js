"use strict";
const { Model } = require("sequelize");
const config = require("../config");
module.exports = (sequelize, DataTypes) => {
  class File extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  File.init({
    bucket: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: "Please enter a file" } },
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: "Please enter a file" } },
    },
    originalName: {
      type: DataTypes.STRING,
    },
    encoding: {
      type: DataTypes.STRING,
    },
    mimeType: {
      type: DataTypes.STRING,
    },
    size: {
      type: DataTypes.STRING,
    },
    location: {
      type: DataTypes.STRING,
    }
  },
    {
      sequelize,
      paranoid: true,
      modelName: "File",
      timestamps: true,
    }
  );
  return File;
};
