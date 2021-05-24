'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.belongsTo(models.Role, {
        foreignKey: 'roleId'
      });
      User.hasOne(models.Customer, {
        foreignKey: 'contactId'
      });
    };
    generateHash(password) {
      return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    };
    comparePassword(password) {
      return bcrypt.compareSync(password, this.password);
    };
  };
  User.init({
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { notEmpty: { msg: 'Role cannot be empty' } }
    },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { notEmpty: { msg: 'Username cannot be empty' } }
    },
    phone: {
      type: DataTypes.STRING,
      validate: {
        isNumeric: { msg: 'Please enter correct phone number' }
      }
    },
    password: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Email cannot be empty' },
        isEmail: { msg: 'Email format is incorrect' }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
  }, {
    sequelize,
    paranoid: true,
    modelName: 'User',
  });
  User.beforeUpdate((user, options) => {
    if (options.fields.indexOf('password') > -1 && user.password) {
      const hashedPassword = user.generateHash(user.password);
      user.password = hashedPassword;
    }
  });
  User.beforeCreate((user, options) => {
    const hashedPassword = user.generateHash(user.password);
    user.password = hashedPassword;
  });

  return User;
};