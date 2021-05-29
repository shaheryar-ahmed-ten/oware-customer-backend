const express = require('express');
const router = express.Router();
const moment = require('moment')
const { Inventory, ProductInward, Warehouse, Product, UOM, OutboundStat, InboundStat, sequelize } = require('../models')
const config = require('../config');
const { Op, where } = require('sequelize');
const Sequelize = require('sequelize')

/* GET productInwards listing. */
router.get('/inwards', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    customerId: req.companyId
  };
  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, 'days');
    where['createdAt'] = { [Op.between]: [previousDate, currentDate] };
  }
  if (req.query.search) where[Op.or] = ['$Product.name$', '$ProductInward.referenceId$', '$Warehouse.name$'].map(key => ({
    [key]: { [Op.like]: '%' + req.query.search + '%' }
  }));

  const response = await ProductInward.findAndCountAll({
    include: [{ model: Product, include: [{ model: UOM }] }, { model: Warehouse }],
    orderBy: [['createdAt', 'DESC']],
    where, limit, offset
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: response.rows,
    pages: Math.ceil(response.count / limit)
  });
});

router.get('/', async (req, res) => {
  const currentDate = moment();
  const previousDate = moment().subtract(55, 'days');
  const whereClauseWithDate = dateKey => ({ customerId: req.companyId, [dateKey]: { [Op.between]: [previousDate, currentDate] } });
  const whereClauseWithoutDate = { customerId: req.companyId };
  const counts = await ProductInward.findAndCountAll({ where });

  const inboundStats = {
    total: await InboundStat.aggregate('id', 'count', {
      where: whereClauseWithDate
    }),
    weight: await InboundStat.aggregate('weight', 'sum', {
      where: whereClauseWithDate
    }),
    dimensionsCBM: await InboundStat.aggregate('dimensionsCBM', 'sum', {
      where: whereClauseWithDate
    })
  }

  const outboundStats = {
    total: await OutboundStat.aggregate('productOutwardId', 'count', {
      distinct: true,
      where: whereClauseWithDate
    }),
    weight: await OutboundStat.aggregate('weight', 'sum', {
      where: whereClauseWithDate
    }),
    dimensionsCBM: await OutboundStat.aggregate('dimensionsCBM', 'sum', {
      where: whereClauseWithDate
    })
  }

  const generalStats = {
    products: await Inventory.aggregate('productId', 'count', {
      distinct: true,
      where: whereClauseWithoutDate
    }),
    warehouses: await Inventory.aggregate('warehouseId', 'count', {
      distinct: true,
      where: whereClauseWithoutDate
    }),
    ...(await sequelize.query(`
      select count(*) as pendingOrders from
      (select dispatchOrderId as id,
        count(productOutwardId) as totalOutwards,
        sum(dispatchOrderQuantity) > sum(productOutwardQuantity) as isPendingOrder
        from OutboundStats group by dispatchOrderId)
        as orders where isPendingOrder = 1;
    `, {
      plain: true
    }))
  };

  res.json({
    success: true,
    message: 'respond with a resource',
    inboundStats, generalStats, outboundStats
  });
});

router.get('/relations', async (req, res, next) => {
  const relations = await Inventory.findAll({
    where: { customerId: req.companyId },
    attributes: ['id'],
    include: [{
      model: Product,
      attributes: ['name']
    }, {
      model: Warehouse,
      attributes: ['name']
    }]
  });

  res.json({
    success: true,
    message: 'respond with a resource',
    relations
  });
});

module.exports = router;
