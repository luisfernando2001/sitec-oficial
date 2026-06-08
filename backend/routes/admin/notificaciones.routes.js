const express = require("express");

const {
  listarNotificaciones,
  contarNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
} = require("../../controllers/admin/notificaciones.controller");

const router = express.Router();

router.get("/", listarNotificaciones);
router.get("/conteo", contarNoLeidas);
router.put("/marcar-todas", marcarTodasLeidas);
router.put("/:id/leida", marcarLeida);

module.exports = router;