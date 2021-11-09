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
  const whereClauseWithoutDate = {
    customerId: req.companyId, availableQuantity: {
      [Op.ne]: 0
    }
  };
  const whereClauseWithoutDateRide = {
    customerId: req.companyId, status:"UNASSIGNED"
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

  const generalStats = {
    products: await Inventory.aggregate('productId', 'count', {
      distinct: true,
      where: whereClauseWithoutDate
    }),
    warehouses: await Inventory.aggregate('warehouseId', 'count', {
      distinct: true,
      where: whereClauseWithoutDate
    }),
    rides: await Ride.aggregate('id', 'count', {
      distinct: true,
      where: whereClauseWithoutDateRide
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
    inboundStats, generalStats, outboundStats
  });
});

// 

router.get("/ride", async (req, res, next) => {
  const limit = 5;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = { customerId: req.user.companyId };
  const response = await Ride.findAndCountAll({
    include: [
      {
        model: Vehicle,
        include: [Driver, { model: Company, as: "Vendor" }],
      },
      {
        model: RideProduct,
        include: [Category],
      },
      {
        model: City,
        as: "pickupCity",
      },
      {
        model: City,
        as: "dropoffCity",
      },
    ],
    distinct: true,
    subQuery: false,
    order: [["createdAt", "DESC"]],
    where,
    limit,
    offset,
  });
  // console.log(response)
  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    // pages: Math.ceil(response.count / limit),
    // count: response.count,
    // currentPage: Math.ceil(response.rows.length / limit),
  });
});

// router.get("/:id", async (req, res, next) => {
//   let where = {};
//   const response = await Ride.findOne({
//     order: [["updatedAt", "DESC"]],
//     where: { id: req.params.id, customerId: req.user.companyId },
//     include: [
//       {
//         model: Vehicle,
//         include: [Driver, { model: Company, as: "Vendor" }],
//       },
//       {
//         model: RideProduct,
//         include: [Category],
//       },
//       {
//         model: City,
//         as: "pickupCity",
//       },
//       {
//         model: City,
//         as: "dropoffCity",
//       },
//     ],
//   });

//   res.json({
//     success: true,
//     message: "respond with a resource",
//     data: response,
//   });
// });
// 

module.exports = router;
