const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const db = require("../config/db");

/* ======================================================
   CONFIGURACIÓN PARA SUBIR PDF
====================================================== */

const carpetaRecursos = path.join(__dirname, "../uploads/recursos");

if (!fs.existsSync(carpetaRecursos)) {
  fs.mkdirSync(carpetaRecursos, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, carpetaRecursos);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const nombreBase = file.originalname
      .replace(extension, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .toLowerCase();

    const nombreArchivo = `${Date.now()}-${nombreBase}${extension}`;

    cb(null, nombreArchivo);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Solo se permite subir archivos PDF"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
    limits: {
    fileSize: 50 * 1024 * 1024,
    },
});

const subirPDF = (req, res, next) => {
  upload.single("archivo_pdf")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        ok: false,
        mensaje: "Error al subir el archivo PDF",
        error: error.message,
      });
    }

    if (error) {
      return res.status(400).json({
        ok: false,
        mensaje: error.message || "Archivo no válido",
      });
    }

    next();
  });
};

const limpiarValor = (valor) => {
  if (valor === undefined || valor === null || valor === "") {
    return null;
  }

  return valor;
};

const limpiarNumero = (valor) => {
  if (valor === undefined || valor === null || valor === "") {
    return null;
  }

  const numero = Number(valor);

  return Number.isNaN(numero) ? null : numero;
};

const eliminarArchivoSiExiste = (archivoRelativo) => {
  if (!archivoRelativo) return;

  const rutaCompleta = path.join(__dirname, "..", archivoRelativo);

  if (fs.existsSync(rutaCompleta)) {
    fs.unlinkSync(rutaCompleta);
  }
};

/* ======================================================
   RUTA DE PRUEBA GENERAL
====================================================== */

router.get("/", (req, res) => {
  return res.json({
    ok: true,
    mensaje: "Rutas de solicitudes funcionando correctamente",
    rutas: {
      listarPorUsuario: "/api/solicitudes/usuario/:id_usuario",
      crearSolicitud: "POST /api/solicitudes",
    },
  });
});

/* ======================================================
   OBTENER SOLICITUDES DE UN USUARIO
====================================================== */

router.get("/usuario/:id_usuario", (req, res) => {
  const { id_usuario } = req.params;

  const sql = `
    SELECT
      s.id_solicitud,
      s.id_usuario,
      s.id_recurso,
      s.fecha,
      s.estado,
      s.observacion,

      r.titulo,
      r.isbn,
      r.anio_publicacion,
      r.formato,
      r.url_acceso,
      r.archivo_digital,
      r.resumen,
      r.estado_aprobacion,
      r.fecha_registro,

      c.nombre_categoria,

      a.nombre_autor,
      a.apellido_autor

    FROM solicitud s
    LEFT JOIN recurso r ON s.id_recurso = r.id_recurso
    LEFT JOIN categoria c ON r.id_categoria = c.id_categoria
    LEFT JOIN autor a ON r.id_autor = a.id_autor

    WHERE s.id_usuario = ?
    ORDER BY s.id_solicitud DESC
  `;

  db.query(sql, [id_usuario], (error, results) => {
    if (error) {
      console.error("Error al obtener solicitudes:", error);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al obtener solicitudes",
        error: error.message,
      });
    }

    return res.json({
      ok: true,
      total: results.length,
      solicitudes: results,
    });
  });
});

/* ======================================================
   CREAR SOLICITUD CON PDF O LINK
====================================================== */

router.post("/", subirPDF, (req, res) => {
  const {
    id_usuario,
    titulo,
    resumen = "",
    formato = "PDF",
    tipo = "Libro digital",
    idioma = "Español",
    id_categoria = null,
    id_editorial = null,
    id_autor = null,
    isbn = null,
    anio_publicacion = null,
    url_acceso = null,
    observacion = null,
  } = req.body;

  const archivo_digital = req.file
    ? `uploads/recursos/${req.file.filename}`
    : null;

  if (!id_usuario) {
    eliminarArchivoSiExiste(archivo_digital);

    return res.status(400).json({
      ok: false,
      mensaje: "Falta el id del usuario",
    });
  }

  if (!titulo || !titulo.trim()) {
    eliminarArchivoSiExiste(archivo_digital);

    return res.status(400).json({
      ok: false,
      mensaje: "El título del recurso es obligatorio",
    });
  }

  if (!archivo_digital && !url_acceso) {
    return res.status(400).json({
      ok: false,
      mensaje: "Debes subir un PDF o colocar un enlace del recurso.",
    });
  }

  db.beginTransaction((errorTransaccion) => {
    if (errorTransaccion) {
      eliminarArchivoSiExiste(archivo_digital);

      return res.status(500).json({
        ok: false,
        mensaje: "Error al iniciar transacción",
        error: errorTransaccion.message,
      });
    }

    const sqlRecurso = `
      INSERT INTO recurso (
        id_categoria,
        id_editorial,
        id_autor,
        id_usuario_subida,
        titulo,
        isbn,
        anio_publicacion,
        formato,
        url_acceso,
        archivo_digital,
        resumen,
        idioma,
        tipo,
        estado,
        estado_aprobacion,
        descarga_habilitada,
        visualizacion_habilitada,
        tipo_visualizacion
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'PENDIENTE', 1, 1, 'INDEFINIDO')
    `;

    const valoresRecurso = [
      limpiarNumero(id_categoria),
      limpiarNumero(id_editorial),
      limpiarNumero(id_autor),
      limpiarNumero(id_usuario),
      titulo.trim(),
      limpiarValor(isbn),
      limpiarNumero(anio_publicacion),
      limpiarValor(formato) || "PDF",
      limpiarValor(url_acceso),
      archivo_digital,
      limpiarValor(resumen) || "",
      limpiarValor(idioma) || "Español",
      limpiarValor(tipo) || "Libro digital",
    ];

    db.query(sqlRecurso, valoresRecurso, (errorRecurso, resultRecurso) => {
      if (errorRecurso) {
        console.error("Error al crear recurso:", errorRecurso);

        return db.rollback(() => {
          eliminarArchivoSiExiste(archivo_digital);

          res.status(500).json({
            ok: false,
            mensaje: "Error al registrar el recurso",
            error: errorRecurso.message,
          });
        });
      }

      const id_recurso = resultRecurso.insertId;

      const sqlSolicitud = `
        INSERT INTO solicitud (
          id_usuario,
          id_recurso,
          fecha,
          estado,
          observacion
        )
        VALUES (?, ?, CURDATE(), 'PENDIENTE', ?)
      `;

      db.query(
        sqlSolicitud,
        [
          limpiarNumero(id_usuario),
          id_recurso,
          limpiarValor(observacion) || limpiarValor(resumen),
        ],
        (errorSolicitud, resultSolicitud) => {
          if (errorSolicitud) {
            console.error("Error al crear solicitud:", errorSolicitud);

            return db.rollback(() => {
              eliminarArchivoSiExiste(archivo_digital);

              res.status(500).json({
                ok: false,
                mensaje: "Error al registrar la solicitud",
                error: errorSolicitud.message,
              });
            });
          }

          db.commit((errorCommit) => {
            if (errorCommit) {
              return db.rollback(() => {
                eliminarArchivoSiExiste(archivo_digital);

                res.status(500).json({
                  ok: false,
                  mensaje: "Error al confirmar la solicitud",
                  error: errorCommit.message,
                });
              });
            }

            const sqlActividad = `
              INSERT INTO actividad_usuario (
                id_usuario,
                id_recurso,
                tipo,
                titulo,
                detalle
              )
              VALUES (?, ?, 'SOLICITUD_RECURSO', 'Solicitud enviada', ?)
            `;

            db.query(
              sqlActividad,
              [
                limpiarNumero(id_usuario),
                id_recurso,
                `Enviaste una solicitud para el recurso: ${titulo.trim()}`,
              ],
              (errorActividad) => {
                if (errorActividad) {
                  console.log(
                    "Actividad no registrada, pero la solicitud sí fue guardada:",
                    errorActividad.message
                  );
                }
              }
            );

            return res.status(201).json({
              ok: true,
              mensaje: "Solicitud registrada correctamente",
              id_recurso,
              id_solicitud: resultSolicitud.insertId,
              archivo_digital,
              url_acceso: limpiarValor(url_acceso),
            });
          });
        }
      );
    });
  });
});

module.exports = router;