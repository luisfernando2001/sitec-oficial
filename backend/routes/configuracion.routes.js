const express = require("express");
const router = express.Router();

const {
  obtenerConfiguracion,
  actualizarConfiguracion,
  cambiarPassword,
} = require("../controllers/configuracion.controller");

router.get("/:idUsuario", obtenerConfiguracion);
router.put("/:idUsuario", actualizarConfiguracion);
router.put("/:idUsuario/password", cambiarPassword);

module.exports = router;