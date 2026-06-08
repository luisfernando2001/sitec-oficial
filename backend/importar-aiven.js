require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

function limpiarSQL(sql) {
  return sql
    .replace(/^\uFEFF/, "")
    .replace(/\/\*![\s\S]*?\*\/;?/g, "")
    .replace(/^--.*$/gm, "")
    .replace(/^\s*USE\s+[`"]?\w+[`"]?\s*;\s*$/gim, "")
    .replace(/^\s*SET\s+SQL_MODE\s*=.*?;\s*$/gim, "")
    .replace(/^\s*START\s+TRANSACTION\s*;\s*$/gim, "")
    .replace(/^\s*SET\s+time_zone\s*=.*?;\s*$/gim, "")
    .replace(/^\s*COMMIT\s*;\s*$/gim, "")
    .trim();
}

function dividirSentencias(sql) {
  const sentencias = [];
  const lineas = sql.split(/\r?\n/);

  let delimitador = ";";
  let buffer = "";

  for (const linea of lineas) {
    const texto = linea.trim();

    if (!texto) {
      continue;
    }

    if (/^DELIMITER\s+/i.test(texto)) {
      delimitador = texto.split(/\s+/)[1];
      continue;
    }

    buffer += linea + "\n";

    if (delimitador === ";") {
      if (texto.endsWith(";")) {
        const sentencia = buffer.trim().replace(/;$/, "").trim();

        if (sentencia) {
          sentencias.push(sentencia);
        }

        buffer = "";
      }
    } else {
      if (texto.endsWith(delimitador)) {
        const escapado = delimitador.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const sentencia = buffer
          .trim()
          .replace(new RegExp(escapado + "\\s*$"), "")
          .trim();

        if (sentencia) {
          sentencias.push(sentencia);
        }

        buffer = "";
      }
    }
  }

  const resto = buffer.trim();

  if (resto) {
    sentencias.push(resto);
  }

  return sentencias;
}

async function importar() {
  const archivoSQL = process.argv[2];

  if (!archivoSQL) {
    console.error("Debes indicar la ruta del archivo SQL.");
    console.error('Ejemplo: node importar-aiven.js "C:\\Users\\TU_USUARIO\\Downloads\\bdsitec.sql"');
    process.exit(1);
  }

  const rutaSQL = path.resolve(archivoSQL);

  if (!fs.existsSync(rutaSQL)) {
    console.error("No se encontró el archivo:", rutaSQL);
    process.exit(1);
  }

  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl:
      process.env.DB_SSL === "true"
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
  });

console.log("Conectado a Aiven MySQL.");

  const [tablas] = await conexion.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
  );

  for (const fila of tablas) {
    const nombreTabla = fila.TABLE_NAME || fila.table_name;
    await conexion.query(`DROP TABLE IF EXISTS \`${nombreTabla}\``);
    console.log("Tabla eliminada:", nombreTabla);
  }

  const contenido = fs.readFileSync(rutaSQL, "utf8");
  const sqlLimpio = limpiarSQL(contenido);
  const sentencias = dividirSentencias(sqlLimpio);

  console.log("Sentencias encontradas:", sentencias.length);

  for (let i = 0; i < sentencias.length; i++) {
    const sentencia = sentencias[i];

    try {
      await conexion.query(sentencia);
      console.log(`OK ${i + 1}/${sentencias.length}`);
    } catch (error) {
      console.error(`Error en sentencia ${i + 1}/${sentencias.length}`);
      console.error(error.message);
      console.error(sentencia.substring(0, 800));
      await conexion.end();
      process.exit(1);
    }
  }

  await conexion.query("SET FOREIGN_KEY_CHECKS=1");

  const [resumen] = await conexion.query(`
    SELECT 
      (SELECT COUNT(*) FROM usuario) AS usuarios,
      (SELECT COUNT(*) FROM recurso) AS recursos,
      (SELECT COUNT(*) FROM carrera) AS carreras,
      (SELECT COUNT(*) FROM materia) AS materias
  `);

  console.log("Importación completada.");
  console.table(resumen);

  await conexion.end();
}

importar().catch((error) => {
  console.error("Error general:", error);
  process.exit(1);
});