const express = require("express");
const router = express.Router();
const { Warehouse, Product, UOM, Inventory, Category, Brand, InboundStat, sequelize } = require("../models");
const config = require("../config");
const { Op, Sequelize } = require("sequelize");
const moment = require("moment-timezone");
const ExcelJS = require("exceljs");

/* GET orders listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    customerId: req.companyId
  };
  // where.push({ customerId: req.companyId });
  // if (req.query.search)
  //   where.push(
  //     ["$Warehouse.name$"].map(key => ({
  //       [key]: { [Op.like]: "%" + req.query.search + "%" }
  //     }))
  //   );
  if (req.query.search)
  where[Op.or] = ["$Warehouse.name$", "$Product.name$", "$Product.Category.name$"].map((key) => ({
    [key]: { [Op.like]: "%" + req.query.search + "%" },
  }));

  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  } else if (req.query.start&& req.query.end) {
    const startDate = moment(req.query.start);
    const endDate = moment(req.query.end).set({
      hour: 23,
      minute: 53,
      second: 59,
      millisecond: 0,
    });
    where["createdAt"] = { [Op.between]: [startDate, endDate] };
  }

    const response = await Inventory.findAll({
        include: [{ model: Product, attributes: ['name'], include: [{ model: Category, attributes: ['name'] }, { model: Brand, attributes: ['name'] }, { model: UOM, attributes: ['name'] }],required:true },{model: Warehouse, attributes: ['name'],required:true}],
        attributes: [
            ['productId', 'id'],
            [Sequelize.fn('sum', Sequelize.col('committedQuantity')), 'committedQuantity'],
            [Sequelize.fn('sum', Sequelize.col('availableQuantity')), 'availableQuantity'],
            [Sequelize.fn('sum', Sequelize.col('dispatchedQuantity')), 'dispatchedQuantity']
        ],
        where, 
        offset, limit,
        group: ['productId','warehouseId']
    })
    const count = await Inventory.count({
        // distinct: true,
        include: [{ model: Product, attributes: ['name'], include: [{ model: Category, attributes: ['name'] }, { model: Brand, attributes: ['name'] }, { model: UOM, attributes: ['name'] }],required:true },{model: Warehouse, attributes: ['name'],required:true}],
        col: 'productId',
        where
    });
    
    res.json({
        success: true,
        message: 'respond with a resource',
        data: response,
        count,
        pages: Math.ceil(count / limit)
    });
});

router.get("/relations", async (req, res, next) => {
  const whereClauseWithoutDate = {
    customerId: req.companyId,
    availableQuantity: {
      [Op.ne]: 0
    }
  };
  const relations = {
    products: await sequelize.query(
      `select distinct productId as id, product.name as name 
        from Inventories join Products as product on product.id = Inventories.productId 
        where customerId = ${req.companyId} and availableQuantity != 0;`,
      { type: Sequelize.QueryTypes.SELECT }
    )
  };

  res.json({
    success: true,
    message: "respond with a resource",
    relations
  });
});

router.get("/export", async (req, res, next) => {
  let where = {
    customerId: req.companyId,
  };

  let workbook = new ExcelJS.Workbook();

  worksheet = workbook.addWorksheet("Products");

  const getColumnsConfig = (columns) =>
    columns.map((column) => ({ header: column, width: Math.ceil(column.length * 1.5), outlineLevel: 1 }));

  worksheet.columns = getColumnsConfig([
    "PRODUCT NAME",
    "CATEGORY",
    "WAREHOUSE",
    "BRAND",
    "UOM",
    "QUANTITY AVAILABLE",
    "QUANTITY COMMITTED",
    "QUANTITY DISPATCHED",
  ]);
  
  if (req.query.search)
  where[Op.or] = ["$Warehouse.name$", "$Product.name$", "$Product.Category.name$"].map((key) => ({
    [key]: { [Op.like]: "%" + req.query.search + "%" },
  }));
  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  } else if (req.query.start&& req.query.end) {
    const startDate = moment(req.query.start);
    const endDate = moment(req.query.end).set({
      hour: 23,
      minute: 53,
      second: 59,
      millisecond: 0,
    });
    where["createdAt"] = { [Op.between]: [startDate, endDate] };
  }
  const response = await Inventory.findAll({
    include: [{ model: Product, attributes: ['name'], include: [{ model: Category, attributes: ['name'],required:true }, { model: Brand, attributes: ['name'] }, { model: UOM, attributes: ['name'] }],required:true },{model: Warehouse, attributes: ['name'],required:true}],
    where, 
    // offset, limit,
    // group: ['productId','warehouseId']
})

worksheet.addRows(
  response.map((row) => [
    row.Product.name,
    row.Product.Category.name,
    row.Product.Brand.name,
    row.Product.UOM.name,
    row.committedQuantity,
    row.availableQuantity,
    row.dispatchedQuantity,
  ])
);

res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
res.setHeader("Content-Disposition", "attachment; filename=" + "Inventory.xlsx");

await workbook.xlsx.write(res).then(() => res.end());

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
            'availableQuantity', 'committedQuantity','dispatchedQuantity'
        ],
        include: [{
            model: Product, attributes: []
        }, {
            model: Warehouse, attributes: [
                'name'
            ]
        }],
        order: [['createdAt', 'DESC']],
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
