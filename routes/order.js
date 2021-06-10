const express = require('express');
const router = express.Router();
const moment = require('moment')
const { Warehouse, Product, UOM, OutboundStat, DispatchOrder, ProductOutward, Vehicle } = require('../models')
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
      having = Sequelize.literal(`sum(productOutwardQuantity) = 0`);
    if (req.query.status === '1') // Partially fulfilled
      having = Sequelize.literal(`sum(productOutwardQuantity) > 0 && sum(productOutwardQuantity) < dispatchOrderQuantity`);
    if (req.query.status === '2') // Fulfilled
      having = Sequelize.literal(`sum(productOutwardQuantity) = dispatchOrderQuantity`);
  }

  if (req.query.search) where[Op.or] = ['product', 'referenceId', 'warehouse'].map(key => ({
    [key]: { [Op.like]: '%' + req.query.search + '%' }
  }));

  const response = await OutboundStat.findAndCountAll({
    attributes: [
      'referenceId', 'shipmentDate', 'internalIdForBusiness',
      'dispatchOrderId', 'warehouse', 'customer', 'product', 'dispatchOrderQuantity',
      [Sequelize.fn('sum', Sequelize.col('productOutwardQuantity')), 'outwardQuantity'],
      ['dispatchOrderId', 'productOutwardId'],
      [Sequelize.fn('count', Sequelize.col('productOutwardId')), 'outwardCount']
    ],
    orderBy: [['createdAt', 'DESC']],
    where, limit, offset, having,
    group: ['dispatchOrderId', 'dispatchOrderQuantity', 'warehouse', 'customer', 'product']
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
    warehouses: await OutboundStat.aggregate('warehouse', 'distinct', {
      plain: false,
      where: whereClauseWithoutDate
    }),
    products: await OutboundStat.aggregate('product', 'distinct', {
      plain: false,
      where: whereClauseWithoutDate
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
      include: [{ model: ProductOutward, include: [{ model: Vehicle }] }]
    });
    return res.json({
      success: true,
      message: 'Product Outwards',
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
