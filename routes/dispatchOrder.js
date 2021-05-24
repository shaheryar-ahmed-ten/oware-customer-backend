const express = require('express');
const router = express.Router();
const { Inventory, DispatchOrder, ProductOutward, User, Customer, Warehouse, Product, UOM } = require('../models');
const config = require('../config');
const { Op, fn, col } = require("sequelize");
const authService = require('../services/auth.service');
const { digitizie } = require('../services/common.services');

/* GET dispatchOrders listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['$Inventory.Product.name$', '$Inventory.Customer.companyName$', '$Inventory.Warehouse.name$']
    .map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await DispatchOrder.findAndCountAll({
    include: [{
      model: Inventory,
      include: [{ model: Product, include: [{ model: UOM }] }, { model: Customer }, { model: Warehouse }],
    }],
    orderBy: [['updatedAt', 'DESC']],
    where, limit, offset
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: response.rows,
    pages: Math.ceil(response.count / limit)
  });
});

module.exports = router;
