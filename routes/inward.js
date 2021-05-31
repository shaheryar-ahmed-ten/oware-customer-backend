const express = require('express');
const router = express.Router();
const moment = require('moment')
const { ProductInward, Warehouse, Product, UOM } = require('../models')
const config = require('../config');
const { Op } = require('sequelize');

/* GET productInwards listing. */
router.get('/', async (req, res, next) => {
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
