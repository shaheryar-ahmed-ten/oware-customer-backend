const express = require('express');
const router = express.Router();
const moment = require('moment')
const { Warehouse, Product, UOM, OutboundStat, DispatchOrder, ProductOutward, Vehicle } = require('../models')
const config = require('../config');
const { Op } = require('sequelize');

/* GET orders listing. */
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
    if (req.query.search) where[Op.or] = ['$Product.name$', '$ProductOutward.referenceId$', '$Warehouse.name$'].map(key => ({
        [key]: { [Op.like]: '%' + req.query.search + '%' }
    }));

    const response = await OutboundStat.findAndCountAll({
        include: [{ model: DispatchOrder, include: [{ model: ProductOutward, include: [{ model: Vehicle }] }] }, { model: Product, include: [{ model: UOM }] }, { model: Warehouse }],
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

module.exports = router;
