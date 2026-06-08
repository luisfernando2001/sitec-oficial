const express = require("express");

const {
  obtenerConfiguracion,
  obtenerFooter,
  actualizarConfiguracion,
  restaurarConfiguracion,
  generarRespaldo,
} = require("../../controllers/admin/configuracionAdmin.controller");

const router = express.Router();

router.get("/", obtenerConfiguracion);
router.get("/footer", obtenerFooter);
router.put("/", actualizarConfiguracion);
router.post("/restaurar", restaurarConfiguracion);
router.post("/respaldo", generarRespaldo);

module.exports = router;