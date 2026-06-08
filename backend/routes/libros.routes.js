const router = require("express").Router();

const {
  obtenerRecursos,
  obtenerRecientes,
  buscarRecursos,
  obtenerRecursoPorId,
  crearRecurso,
  
  obtenerCategorias,
} = require("../controllers/libros.controller");

/*
  RUTAS CORRECTAS SEGÚN TU BASE
  Tabla real: recurso
*/
router.get("/recurso", obtenerRecursos);
router.get("/recurso/recientes", obtenerRecientes);
router.get("/recurso/buscar", buscarRecursos);
router.get("/recurso/:id", obtenerRecursoPorId);
router.post("/recurso", crearRecurso);
router.get(
  "/categorias",
  obtenerCategorias
);
/*
  Alias en plural por comodidad
*/
router.get("/recursos", obtenerRecursos);
router.get("/recursos/recientes", obtenerRecientes);
router.get("/recursos/buscar", buscarRecursos);
router.get("/recursos/:id", obtenerRecursoPorId);
router.post("/recursos", crearRecurso);

/*
  Rutas antiguas para no romper el frontend actual
*/
router.get("/libros", obtenerRecursos);
router.get("/libros/recientes", obtenerRecientes);
router.get("/libros/buscar", buscarRecursos);
router.get("/libros/:id", obtenerRecursoPorId);
router.post("/libros", crearRecurso);
router.get(
  "/libros/buscar",
  buscarRecursos
);
module.exports = router;