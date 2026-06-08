const express = require("express");

const {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  cambiarEstadoCategoria,
  eliminarCategoria,
} = require("../../controllers/admin/categorias.controller");

const router = express.Router();

router.get("/", listarCategorias);
router.post("/", crearCategoria);
router.put("/:id", actualizarCategoria);
router.put("/:id/estado", cambiarEstadoCategoria);
router.delete("/:id", eliminarCategoria);

module.exports = router;