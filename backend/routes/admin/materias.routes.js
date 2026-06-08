const express = require("express");

const {
  listarMaterias,
  crearMateria,
  actualizarMateria,
  cambiarEstadoMateria,
  eliminarMateria,
} = require("../../controllers/admin/materias.controller");

const router = express.Router();

router.get("/", listarMaterias);
router.post("/", crearMateria);
router.put("/:id", actualizarMateria);
router.put("/:id/estado", cambiarEstadoMateria);
router.delete("/:id", eliminarMateria);

module.exports = router;