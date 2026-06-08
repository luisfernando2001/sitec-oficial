const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const {
  listarLibros,
  crearLibro,
  actualizarLibro,
  eliminarLibro,
} = require("../../controllers/admin/libros.controller");

const carpetaRecursos = path.join(__dirname, "../../uploads/recursos");

if (!fs.existsSync(carpetaRecursos)) {
  fs.mkdirSync(carpetaRecursos, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, carpetaRecursos);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const nombreSeguro = file.originalname
      .replace(extension, "")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "");

    cb(null, `${Date.now()}-${nombreSeguro}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  const tiposPermitidos = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos PDF, DOC o DOCX"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

router.get("/", listarLibros);
router.post("/", upload.single("archivo"), crearLibro);
router.put("/:id", upload.single("archivo"), actualizarLibro);
router.delete("/:id", eliminarLibro);

module.exports = router;