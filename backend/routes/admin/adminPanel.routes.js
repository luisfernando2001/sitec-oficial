const express = require("express");

const {
  obtenerPanel,
} = require("../../controllers/admin/adminPanel.controller");

const router = express.Router();

router.get("/panel", obtenerPanel);

module.exports = router;