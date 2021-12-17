const express = require('express');
const router = express.Router();
const moment = require('moment')
const { Inventory, ProductInward, OutboundStat, InboundStat,Ride,Vehicle,Car,Driver,City,RideProduct ,Company,Category,InwardGroup, Product, sequelize, Sequelize } = require('../models')
const { Op, where } = require('sequelize');
moment.prototype.toMySqlDateTime = function () {
  return this.format('YYYY-MM-DD HH:mm:ss');
};

router.get('/', async (req, res) => {
  const currentDate = moment().format("YYYY-MM-DD HH:mm:ss");;
  const previousDate = moment().subtract(7, 'days');
  const formattedPreviousDate = previousDate.format("YYYY-MM-DD HH:mm:ss");
  const whereClauseWithDate = dateKey => ({ customerId: req.companyId, [dateKey]: { [Op.between]: [previousDate, currentDate] } });
  const whereClauseWithDateNotAssigned = dateKey => ({ customerId: req.companyId, status:"Not Assigned", [dateKey]: { [Op.between]: [previousDate, currentDate] } });
  const whereClauseWithDateOnTheWay = dateKey => ({ customerId: req.companyId, status:"On the way", [dateKey]: { [Op.between]: [previousDate, currentDate] } });
  const whereClauseWithDateLoadingComplete = dateKey => ({ customerId: req.companyId, status:"Loading Complete", [dateKey]: { [Op.between]: [previousDate, currentDate] } });
  const whereClauseWithDateCancelled = dateKey => ({ customerId: req.companyId, status:"Cancelled", [dateKey]: { [Op.between]: [previousDate, currentDate] } });
  const whereClauseWithDateScheduled = dateKey => ({ customerId: req.companyId, status:"Scheduled", [dateKey]: { [Op.between]: [previousDate, currentDate] } });
  const whereClauseWithDateArrived = dateKey => ({ customerId: req.companyId, status:"Arrived", [dateKey]: { [Op.between]: [previousDate, currentDate] } });
  const whereClauseWithDateLoadingInProgress = dateKey => ({ customerId: req.companyId, status:"Loading in-progress", [dateKey]: { [Op.between]: [previousDate, currentDate] } });
  const whereClauseWithDateLoadingInTransit = dateKey => ({ customerId: req.companyId, status:"Loading in-transit", [dateKey]: { [Op.between]: [previousDate, currentDate] } });
  const whereClauseWithDateReached = dateKey => ({ customerId: req.companyId, status:"Reached", [dateKey]: { [Op.between]: [previousDate, currentDate] } });
  const whereClauseWithDateOffloadingInProgress = dateKey => ({ customerId: req.companyId, status:"Offloading in-progress", [dateKey]: { [Op.between]: [previousDate, currentDate] } });
  const whereClauseWithDateLoadDelivered = dateKey => ({ customerId: req.companyId, status:"Load Delivered", [dateKey]: { [Op.between]: [previousDate, currentDate] } });
  const whereClauseWithDateCompleted = dateKey => ({ customerId: req.companyId, status:"Completed", [dateKey]: { [Op.between]: [previousDate, currentDate] } });
  const whereClauseWithoutDate = {
    customerId: req.companyId, availableQuantity: {
      [Op.ne]: 0
    }
  };
  const whereClauseWithoutDateRide = {
    customerId: req.companyId, status:"Not Assigned"
  };
  const whereClauseWithoutDateCompletedRide = {
    customerId: req.companyId, status:"Completed"
  };

  const inboundStats = {
    total: await InboundStat.aggregate('id', 'count', {
      where: whereClauseWithDate('createdAt')
    }),
    ...(await sequelize.query(`
    select sum(weight*InwardGroups.quantity) as weight,
    sum(dimensionsCBM*InwardGroups.quantity) as dimensionsCBM 
    from InwardGroups 
    join ProductInwards as ProductInwards on inwardId = ProductInwards.id 
    join Products as Products on Products.id = InwardGroups.productId where customerId = ${req.companyId} 
    and (ProductInwards.createdAt BETWEEN '${formattedPreviousDate}' AND '${currentDate}') 
    `, {
      plain: true
    }))
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
  const rideStats = {
    total: await Ride.aggregate('id', 'count', {
      distinct: true,
      where: whereClauseWithDate('updatedAt')
    }),
    notAssigned: await Ride.aggregate('id', 'count', {
      where: whereClauseWithDateNotAssigned('updatedAt')
    }),
    onTheWay: await Ride.aggregate('id', 'count', {
      where: whereClauseWithDateOnTheWay('updatedAt')
    }),
    loadingComplete: await Ride.aggregate('id', 'count', {
      where: whereClauseWithDateLoadingComplete('updatedAt')
    }),
    scheduled: await Ride.aggregate('id', 'count', {
      where: whereClauseWithDateScheduled('updatedAt')
    }),
    arrived: await Ride.aggregate('id', 'count', {
      where: whereClauseWithDateArrived('updatedAt')
    }),
    loadingInProgress: await Ride.aggregate('id', 'count', {
      where: whereClauseWithDateLoadingInProgress('updatedAt')
    }),
    loadingInTransit: await Ride.aggregate('id', 'count', {
      where: whereClauseWithDateLoadingInTransit('updatedAt')
    }),
    reached: await Ride.aggregate('id', 'count', {
      where: whereClauseWithDateReached('updatedAt')
    }),
    offloadingInProgress: await Ride.aggregate('id', 'count', {
      where: whereClauseWithDateOffloadingInProgress('updatedAt')
    }),
    loadDelivered: await Ride.aggregate('id', 'count', {
      where: whereClauseWithDateLoadDelivered('updatedAt')
    }),
    completed: await Ride.aggregate('id', 'count', {
      where: whereClauseWithDateCompleted('updatedAt')
    }),
    cancelled: await Ride.aggregate('id', 'count', {
      where: whereClauseWithDateCancelled('updatedAt')
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
    // rides: await Ride.aggregate('id', 'count', {
    //   distinct: true,
    //   where: whereClauseWithoutDateRide
    // }),
    completedRides: await Ride.aggregate('id', 'count', {
      distinct: true,
      where: whereClauseWithoutDateCompletedRide
    }),
    ...(await sequelize.query(`
      select count(*) as pendingOrders from
      (select dispatchOrderId as id,
        count(id) as totalOutwards,
        dispatchOrderQuantity > sum(productOutwardQuantity) as isPendingOrder
        from OutboundQueryForPending where customerId = ${req.companyId} group by dispatchOrderId)
        as orders where isPendingOrder = 1;
    `, {
      plain: true
    }))
  };

  res.json({
    success: true,
    message: 'respond with a resource',
    inboundStats, generalStats, outboundStats, rideStats
  });
});

module.exports = router;
