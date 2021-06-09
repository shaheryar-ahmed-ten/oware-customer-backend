const express = require('express');
const router = express.Router();
const moment = require('moment')
const { Inventory, ProductInward, OutboundStat, InboundStat, sequelize } = require('../models')
const { Op, where } = require('sequelize');

router.get('/', async (req, res) => {
  const currentDate = moment();
  const previousDate = moment().subtract(7, 'days');
  const whereClauseWithDate = dateKey => ({ customerId: req.companyId, [dateKey]: { [Op.between]: [previousDate, currentDate] } });
  const whereClauseWithoutDate = { customerId: req.companyId };

  console.log(whereClauseWithDate('createdAt'), whereClauseWithoutDate);
  const inboundStats = {
    total: await InboundStat.aggregate('id', 'count', {
      where: whereClauseWithDate('createdAt')
    }),
    weight: await InboundStat.aggregate('weight', 'sum', {
      where: whereClauseWithDate('createdAt')
    }),
    dimensionsCBM: await InboundStat.aggregate('dimensionsCBM', 'sum', {
      where: whereClauseWithDate('createdAt')
    })
  }

  const outboundStats = {
    total: await OutboundStat.aggregate('id', 'count', {
      distinct: true,
      where: whereClauseWithDate('createdAt')
    }),
    weight: await OutboundStat.aggregate('weight', 'sum', {
      where: whereClauseWithDate('createdAt')
    }),
    dimensionsCBM: await OutboundStat.aggregate('dimensionsCBM', 'sum', {
      where: whereClauseWithDate('createdAt')
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
        count(id) as totalOutwards,
        dispatchOrderQuantity > sum(productOutwardQuantity) as isPendingOrder
        from OutboundStats where customerId = ${req.companyId} group by dispatchOrderId)
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

module.exports = router;
