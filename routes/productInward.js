const express = require('express');
const router = express.Router();
const { Inventory, ProductInward, User, Customer, Warehouse, Product, UOM } = require('../models')
const config = require('../config');
const { Op } = require("sequelize");
const authService = require('../services/auth.service');
const { digitizie } = require('../services/common.services');

/* GET productInwards listing. */
router.get('/', async (req, res, next) => {
  let where 
  if (req.query.days) {
    Date.prototype.subtractDays = function (days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() - days);
      return date;
    }
    const currentDate = new Date()
    const previousDate = currentDate.subtractDays(req.query.days)
     where = {
      'customerId': 1,//req.user.companyId
      'createdAt': { [Op.between]: [previousDate, currentDate] }
    };
  } else {
     where = {
      // userId: req.userId
      "customerId": 1,//req.user.companyId
    };
  }
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  if (req.query.search) where[Op.or] = ['$Product.name$', '$ProductInward.referenceId$', '$Warehouse.name$'].map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
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

router.get('/relations', async (req, res, next) => {
  const relations = await Inventory.findAll({
    where: { "customerId": 1 },
    attributes: ['id'],
    include: [{
      model: Product, attributes: [
        'name'
      ]
    }, {
      model: Warehouse, attributes: [
        'name'
      ]
    }]
  });

  res.json({
    success: true,
    message: 'respond with a resource',
    relations
  });
});

module.exports = router;
