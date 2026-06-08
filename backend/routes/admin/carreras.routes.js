const express = require("express");

const {
  listarCarreras,
  crearCarrera,
  actualizarCarrera,
  cambiarEstadoCarrera,
  eliminarCarrera,
} = require("../../controllers/admin/carreras.controller");

const router = express.Router();

router.get("/", listarCarreras);
router.post("/", crearCarrera);
router.put("/:id", actualizarCarrera);
router.put("/:id/estado", cambiarEstadoCarrera);
router.delete("/:id", eliminarCarrera);

module.exports = router;