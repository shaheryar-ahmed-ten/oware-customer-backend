const express = require('express');
const router = express.Router();
const moment = require('moment')
const { Warehouse, Product, UOM, OutboundStat, DispatchOrder, ProductOutward, Vehicle, Car, CarMake, CarModel, Inventory, Company} = require('../models')
const config = require('../config');
const { Op, Sequelize } = require('sequelize');

/* GET orders listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    customerId: req.companyId
  };
  let having;
  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, 'days');
    where['createdAt'] = { [Op.between]: [previousDate, currentDate] };
  }

  if ('status' in req.query) {
    if (req.query.status === '0') // Pending
      having = Sequelize.literal(`sum(quantity) = 0`);
    if (req.query.status === '1') // Partially fulfilled
      having = Sequelize.literal(`sum(quantity) > 0 && sum(productOutwardQuantity) < dispatchOrderQuantity`);
    if (req.query.status === '2') // Fulfilled
      having = Sequelize.literal(`sum(quantity) = dispatchOrderQuantity`);
  }

  if ('warehouse' in req.query) {
    where['warehouseId'] = req.query.warehouse;
  }
  if ('product' in req.query) {
    where['productId'] = req.query.product;
  }
  if ('referenceId' in req.query) {
    where['referenceId'] = req.query.referenceId;
  }

  if (req.query.search) where[Op.or] = ['product', 'referenceId', 'warehouse'].map(key => ({
    [key]: { [Op.like]: '%' + req.query.search + '%' }
  }));

  const response = await OutboundStat.findAndCountAll({
    attributes: [
      'referenceId', 'shipmentDate', 'internalIdForBusiness',
      'dispatchOrderId', 'warehouse', 'customer', 'dispatchOrderQuantity',
      [Sequelize.fn('sum', Sequelize.col('quantity')), 'outwardQuantity'],
      ['dispatchOrderId', 'productOutwardId'],
      [Sequelize.fn('count', Sequelize.col('productOutwardId')), 'outwardCount']
    ],
    where, limit, offset, having,
    group: ['dispatchOrderId', 'dispatchOrderQuantity', 'warehouse', 'customer']
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: response.rows,
    count: response.count.length,
    pages: Math.ceil(response.count.length / limit)
  });
});

router.get('/relations', async (req, res, next) => {
  const whereClauseWithoutDate = { customerId: req.companyId };
  const relations = {
    warehouses: await OutboundStat.findAll({
      group: ['warehouseId'],
      plain: false,
      where: whereClauseWithoutDate,
      attributes: [
        ['warehouseId', 'id'],
        [Sequelize.col('warehouse'), 'name']
      ]
    }),
    products: await OutboundStat.findAll({
      group: ['productId'],
      plain: false,
      where: whereClauseWithoutDate,
      attributes: [
        ['productId', 'id'],
        [Sequelize.col('product'), 'name']
      ]
    }),
  }

  res.json({
    success: true,
    message: 'respond with a resource',
    relations
  });
});

router.get('/:id', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  try {
    let response = await DispatchOrder.findAndCountAll({

      where: { id: req.params.id },
      include: [{
        model: Inventory,
        as: 'Inventories',
        include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
      }, {
        model: ProductOutward, include: [{
          model: Inventory, as: 'Inventories',
          include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
        }, {
          model: Vehicle,
          include: [{ model: Car, include: [CarMake, CarModel] }]
        }]
      }]
    });
    return res.json({
      success: true,
      message: 'Product Outwards inside Dispatch Orders',
      data: response.rows,
      count: response.count,
      pages: Math.ceil(response.count / limit)
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
