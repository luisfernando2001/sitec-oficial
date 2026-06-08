const express = require("express");

const {
  listarSolicitudesGestor,
  aprobarSolicitudGestor,
  rechazarSolicitudGestor,
} = require("../../controllers/gestor/solicitudesGestor.controller");

const router = express.Router();

router.get("/:idCarrera", listarSolicitudesGestor);
router.put("/:id/aprobar", aprobarSolicitudGestor);
router.put("/:id/rechazar", rechazarSolicitudGestor);

module.exports = router;