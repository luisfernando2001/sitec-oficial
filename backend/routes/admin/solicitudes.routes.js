const express = require("express");

const {
  listarSolicitudes,
  aprobarSolicitud,
  rechazarSolicitud,
} = require("../../controllers/admin/solicitudes.controller");

const router = express.Router();

router.get("/", listarSolicitudes);
router.put("/:id/aprobar", aprobarSolicitud);
router.put("/:id/rechazar", rechazarSolicitud);

module.exports = router;