const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  obtenerPerfilAdmin,
  actualizarPerfilAdmin,
} = require("../../controllers/admin/perfilAdmin.controller");

const router = express.Router();

const carpetaPerfiles = path.join(__dirname, "../../uploads/perfiles");

if (!fs.existsSync(carpetaPerfiles)) {
  fs.mkdirSync(carpetaPerfiles, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, carpetaPerfiles);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const nombreArchivo = `perfil-${Date.now()}${extension}`;
    cb(null, nombreArchivo);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const permitidos = ["image/jpeg", "image/png", "image/webp"];

    if (!permitidos.includes(file.mimetype)) {
      return cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP"));
    }

    cb(null, true);
  },
});

router.get("/:id", obtenerPerfilAdmin);
router.put("/:id", upload.single("foto_perfil"), actualizarPerfilAdmin);

module.exports = router;