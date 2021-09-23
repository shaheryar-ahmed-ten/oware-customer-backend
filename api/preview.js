const express = require('express');
const router = express.Router();
const multer = require('multer')
const multerS3 = require('multer-s3');
const { v4 } = require('uuid');
const path = require('path')
const { File } = require('../models');
const { previewFile } = require('../services/s3.service');

router.get('/:id', async (req, res, next) => {
  const id = req.params.id;
  let file = await File.findOne({ where: { id } });
  let preview = await previewFile(file.bucket, file.key);
  res.redirect(preview);
});

module.exports = router;