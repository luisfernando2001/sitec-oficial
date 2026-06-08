require("dotenv").config();

const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bdsitec",

  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 60000,

  charset: "utf8mb4",

  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
});

function esErrorDeConexion(error) {
  return (
    error &&
    (
      error.code === "ECONNRESET" ||
      error.code === "PROTOCOL_CONNECTION_LOST" ||
      error.code === "ETIMEDOUT" ||
      error.code === "EPIPE" ||
      error.fatal === true
    )
  );
}

const queryOriginal = pool.query.bind(pool);

pool.query = function (sql, valores, callback) {
  if (typeof valores === "function") {
    callback = valores;
    valores = [];
  }

  if (typeof callback !== "function") {
    return queryOriginal(sql, valores);
  }

  const ejecutarConsulta = (intento = 1) => {
    queryOriginal(sql, valores, (error, resultados, campos) => {
      if (error && esErrorDeConexion(error) && intento === 1) {
        console.log("Conexión MySQL reiniciada por Aiven. Reintentando consulta...");
        setTimeout(() => ejecutarConsulta(2), 500);
        return;
      }

      callback(error, resultados, campos);
    });
  };

  ejecutarConsulta();
};

pool.getConnection((error, connection) => {
  if (error) {
    console.log("Error BD:", error);
    return;
  }

  console.log("Pool MySQL conectado correctamente");
  connection.release();
});

module.exports = pool;