const express = require('express');
const router = express.Router();
const { Inventory, ProductInward, User, Customer, Warehouse, Product, UOM } = require('../models')
const config = require('../config');
const { Op,sequelize } = require("sequelize");
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

router.get('/dashboard/',async(req,res)=>{
  const currentDate = new Date()
  const response = await ProductInward.findAndCountAll({
    where: { [Op.and]: [{ "customerId":1 }, { createdAt: { [Op.between]: ["2021-05-19T14:00:32.000Z",currentDate]} }] },
    include: [{ model: Customer }],
    orderBy: [['updatedAt', 'DESC']],
  
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: response
    //pages: Math.ceil(response.count / limit)
  });
  
})

module.exports = router;
