const express = require("express");
const router = express.Router();

const {
  obtenerPanelGestor,
} = require("../../controllers/gestor/panelGestor.controller");

router.get("/panel/:idCarrera", obtenerPanelGestor);

module.exports = router;