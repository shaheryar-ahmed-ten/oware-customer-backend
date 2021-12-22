"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class RideCancellationReason extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  RideCancellationReason.init(
    {
      cancellationReason: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "RideCancellationReason",
    }
  );
  return RideCancellationReason;
};
