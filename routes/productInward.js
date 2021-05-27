const express = require('express');
const router = express.Router();
const moment = require('moment')
const { Inventory, ProductInward, ProductOutward, DispatchOrder, User, Customer, Warehouse, Product, UOM } = require('../models')
const config = require('../config');
const { Op } = require("sequelize");
const Sequelize = require('sequelize')
const authService = require('../services/auth.service');
const { digitizie } = require('../services/common.services');

/* GET productInwards listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['$Product.name$', '$Customer.companyName$', '$Warehouse.name$'].map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await ProductInward.findAndCountAll({
    include: [{ model: User }, { model: Product, include: [{ model: UOM }] }, { model: Customer }, { model: Warehouse }],
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

router.get('/dashboard/', async (req, res) => {
  const currentDate = moment()
  const previousDate = moment().subtract(7, 'days')
  const inboundStats = await ProductInward.findAndCountAll({
    where: { [Op.and]: [{ "customerId": 1 }, { createdAt: { [Op.between]: [previousDate, currentDate] } }] },
    attributes: [
      [Sequelize.fn('sum', Sequelize.col('quantity')), 'totalQuantity'],
    ],
    include: [{
      model: Product, attributes: [
        [Sequelize.fn('sum', Sequelize.col('weight')), 'totalWeightInKGs'],
        [Sequelize.fn('sum', Sequelize.col('dimensionsCBM')), 'totalInCm3']
      ],
    }],
    group: ['customerId', 'productId'],
    orderBy: [['updatedAt', 'DESC']],

  });


  const productAndWarehouseDetails = await Inventory.findAll({
    where: { "customerId": 1 },
    attributes: [
      [Sequelize.fn('count', Sequelize.col('productId')), 'productsStored'],
      [Sequelize.fn('count', Sequelize.col('warehouseId')), 'warehousesUsed'],
    ],
    group: ['customerId', 'productId'],
    orderBy: [['updatedAt', 'DESC']],
  });

  res.json({
    success: true,
    message: 'respond with a resource',
    inboundStats,
    productAndWarehouseDetails,
    //pages: Math.ceil(response.count / limit)
  });

})

module.exports = router;
