'use strict';
const { Model } = require('sequelize');
const { APPS } = require('../enums');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Role.hasMany(models.PermissionAccess, {
        sourceKey: 'id',
        foreignKey: 'roleId'
      });
    }
  };
  Role.init({
    type: {
      type: DataTypes.STRING,
      unique: true
    },
    name: DataTypes.STRING,
    allowedApps: {
      type: DataTypes.ENUM({
        values: Object.keys(APPS)
      }),
      allowNull: false
    }
  }, {
    sequelize,
    paranoid: true,
    modelName: 'Role',
  }).sync();
  return Role;
};