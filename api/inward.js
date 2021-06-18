const express = require('express');
const router = express.Router();
const moment = require('moment')
const { ProductInward, Warehouse, Product, UOM, InboundStat } = require('../models')
const config = require('../config');
const { Op, Sequelize } = require('sequelize');

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
    if ('warehouse' in req.query) {
        where['warehouseId'] = req.query.warehouse;
    }
    if ('product' in req.query) {
        where['productId'] = req.query.product;
    }
    if ('referenceId' in req.query) {
        where['referenceId'] = req.query.referenceId;
    }

    const response = await ProductInward.findAndCountAll({
        include: [{ model: Product, include: [{ model: UOM }] }, { model: Warehouse }],
        order: [['createdAt', 'DESC']],
        where, limit, offset
    });
    res.json({
        success: true,
        message: 'respond with a resource',
        data: response.rows,
        count: response.count,
        pages: Math.ceil(response.count / limit)
    });
});

router.get('/relations', async (req, res, next) => {
    const whereClauseWithoutDate = { customerId: req.companyId };
    const relations = {
        warehouses: await InboundStat.findAll({
            group: ['warehouseId'],
            plain: false,
            where: whereClauseWithoutDate,
            attributes: [
                ['warehouseId', 'id'],
                [Sequelize.col('warehouse'), 'name']
            ]
        }),
        products: await InboundStat.findAll({
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

module.exports = router;
