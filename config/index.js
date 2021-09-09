const env_config = require("dotenv").config();
const env = process.env.NODE_ENV || "development";
const config = require("./config.js")[env];
const miscConfig = require("./config.js").misc;
module.exports = { ...env_config.parsed, ...config, ...miscConfig };
