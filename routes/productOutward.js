const express = require('express');
const router = express.Router();
const { Inventory, ProductOutward, Vehicle, DispatchOrder, ProductInward, User, Customer, Warehouse, Product, UOM } = require('../models')
const config = require('../config');
const { Op } = require("sequelize");
const { digitizie } = require('../services/common.services');


/* GET productOutwards listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['$DispatchOrder.Inventory.Product.name$', '$DispatchOrder.Inventory.Customer.companyName$', '$DispatchOrder.Inventory.Warehouse.name$']
    .map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await ProductOutward.findAndCountAll({
    include: [
      {
        model: DispatchOrder,
        include: [{
          model: Inventory,
          include: [{ model: Product, include: [{ model: UOM }] }, { model: Customer }, { model: Warehouse }]
        }]
      }, {
        model: Vehicle
      }
    ],
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
