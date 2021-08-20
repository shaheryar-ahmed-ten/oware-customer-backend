require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "mysql"
  },
  test: {
    username: "root",
    password: "root",
    database: "database_test",
    host: "127.0.0.1",
    dialect: "mysql"
  },
  production: {
    username: "root",
    password: "root",
    database: "database_production",
    host: "127.0.0.1",
    dialect: "mysql"
  },
  misc: {
    rowsPerPage: 10,
    customerTypes: ["Manufacturer", "Distributor", "Importer", "Trader", "Wholesaler", "Retailer"],
    vehicleTypes: ["Bike", "Mini Truck", "Light Truck", "Heavy Truck", "Refregerated Truck"],
    dbLogging: false
  }
};
