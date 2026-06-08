const express = require("express");
const router = express.Router();
const conexion = require("../config/db");
const Fuse = require("fuse.js");

// Palabras vacías que no aportan a la búsqueda
const STOPWORDS = [
  "quiero", "busco", "necesito", "dame", "el", "la", "los", "las",
  "un", "una", "de", "del", "sobre", "libro", "recurso", "pdf",
  "archivo", "material", "algo", "por", "favor", "hay", "tienen",
  "tienes", "me", "puedes", "dar", "conseguir", "ver", "tengo",
  "buscar", "encontrar", "relacionado", "con"
];

function extraerPalabrasClave(mensaje) {
  return mensaje
    .toLowerCase()
    .replace(/[¿?¡!.,;:]/g, "")
    .split(/\s+/)
    .filter(p => p.length > 2 && !STOPWORDS.includes(p))
    .join(" ");
}

router.post("/", (req, res) => {
  try {
    const { mensaje } = req.body;

    if (!mensaje || !mensaje.trim()) {
      return res.json({ respuesta: "Escribe una consulta.", recursos: [] });
    }

    const terminoBusqueda = extraerPalabrasClave(mensaje);

    // Si después de limpiar no queda nada útil
    if (!terminoBusqueda.trim()) {
      return res.json({
        respuesta: "No entendí tu búsqueda. Intenta con el nombre del libro o tema.",
        recursos: [],
      });
    }

    const sql = `
      SELECT
        r.id_recurso,
        r.titulo,
        r.resumen,
        r.archivo_digital,
        c.nombre_categoria
      FROM recurso r
      LEFT JOIN categoria c ON r.id_categoria = c.id_categoria
    `;

    conexion.query(sql, (error, resultados) => {
      if (error) {
        console.error("ERROR SQL:", error);
        return res.status(500).json({ respuesta: "Error en base de datos.", recursos: [] });
      }

      const fuse = new Fuse(resultados, {
        keys: ["titulo", "resumen", "nombre_categoria"],
        threshold: 0.4,
        ignoreLocation: true,     // busca en todo el texto, no solo al inicio
        minMatchCharLength: 3,
      });

      const encontrados = fuse.search(terminoBusqueda);

      if (encontrados.length === 0) {
        return res.json({
          respuesta: `No encontré recursos sobre "${terminoBusqueda}". Intenta con otra palabra.`,
          recursos: [],
        });
      }

      const recursos = encontrados.slice(0, 5).map((r) => {
        const item = r.item;

        // Normalizar la ruta del archivo: backslashes → slashes
        if (item.archivo_digital) {
          item.archivo_digital = item.archivo_digital
            .replace(/\\/g, "/")         // backslash → slash
            .replace(/^\/+/, "");        // quitar slash inicial si lo hay
        }

        return item;
      });

      res.json({
        respuesta: `Encontré ${recursos.length} recurso(s) relacionado(s) con "${terminoBusqueda}".`,
        recursos,
      });
    });

  } catch (error) {
    console.error("ERROR GENERAL:", error);
    res.status(500).json({ respuesta: "Error al buscar recursos.", recursos: [] });
  }
});

module.exports = router;