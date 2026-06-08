const express = require("express");

const {
  obtenerInformes,
} = require("../../controllers/admin/informes.controller");

const router = express.Router();

router.get("/", obtenerInformes);

module.exports = router;