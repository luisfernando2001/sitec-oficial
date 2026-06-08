const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  eliminarUsuario,
  matriculacionMasiva,
} = require("../../controllers/admin/usuarios.controller");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const extensionesPermitidas = [".xlsx", ".xls", ".csv"];

    if (extensionesPermitidas.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos Excel o CSV"));
    }
  },
});

router.get("/", listarUsuarios);
router.post("/", crearUsuario);

router.post(
  "/matriculacion-masiva",
  upload.single("archivo"),
  matriculacionMasiva
);

router.put("/:id", actualizarUsuario);
router.put("/:id/estado", cambiarEstadoUsuario);
router.delete("/:id", eliminarUsuario);

module.exports = router;