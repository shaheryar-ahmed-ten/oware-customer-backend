'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VerificationCode extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      VerificationCode.belongsTo(models.User, {
        foreignKey: 'userId'
      });
    }
  };
  VerificationCode.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: true }
    },
    identity: {
      type: DataTypes.STRING,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    expiryDate: DataTypes.DATE
  }, {
    sequelize,
    paranoid: true,
    modelName: 'VerificationCode',
  });
  return VerificationCode;
};