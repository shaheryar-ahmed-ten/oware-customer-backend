'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const config = require('../config');
const db = {};

let sequelize = new Sequelize(config.DB_NAME, config.DB_USER, config.DB_PASSWORD, {
  // username: config.DB_USER,
  // password: config.DB_PASSWORD,
  // database: config.DB_NAME,
  host: config.DB_HOST,
  dialect: config.dialect,
  logging: config.dbLogging || false
});

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
