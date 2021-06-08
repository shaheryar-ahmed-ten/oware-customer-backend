const express = require('express');
const router = express.Router();
const { Warehouse, Product, UOM, Inventory, Category, Brand, OutboundStat } = require('../models')
const config = require('../config');
const { Op, Sequelize } = require('sequelize');

/* GET orders listing. */
router.get('/', async (req, res, next) => {
    const limit = req.query.rowsPerPage || config.rowsPerPage;
    const offset = (req.query.page - 1 || 0) * limit;
    let where = {
        customerId: req.companyId
    }
    if (req.query.search) where[Op.or] = ['$Product.name$', '$Product.id$'].map(key => ({
        [key]: { [Op.like]: '%' + req.query.search + '%' }
    }));

    const response = await Inventory.findAndCountAll({
        include: [{ model: Product, attributes: ['name'], include: [{ model: Category, attributes: ['name'] }, { model: Brand, attributes: ['name'] }, { model: UOM, attributes: ['name'] }] }],
        attributes: [
            ['productId', 'id'],
            [Sequelize.fn('sum', Sequelize.col('committedQuantity')), 'committedQuantity'],
            [Sequelize.fn('sum', Sequelize.col('availableQuantity')), 'availableQuantity']
        ],
        where, offset, limit,
        group: ['productId']
    })
    res.json({
        success: true,
        message: 'respond with a resource',
        data: response,
        count: response.count.length,
        pages: Math.ceil(response.count.length / limit)
    });
});

router.get('/relations', async (req, res, next) => {
    const whereClauseWithoutDate = { customerId: req.companyId };
    const relations = {
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
    let where = {
        customerId: req.companyId,
        productId: req.params.id
    };
    const response = await Inventory.findAndCountAll({
        attributes: [
            'availableQuantity', 'committedQuantity'
        ],
        include: [{
            model: Product, attributes: []
        }, {
            model: Warehouse, attributes: [
                'name'
            ]
        }],
        orderBy: [['createdAt', 'DESC']],
        where, limit, offset,
    });
    res.json({
        success: true,
        message: 'respond with a resource',
        data: response.rows,
        pages: Math.ceil(response.count / limit)
    });
});

module.exports = router;
