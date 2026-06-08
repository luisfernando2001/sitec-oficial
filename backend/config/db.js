require("dotenv").config();

const mysql = require("mysql2");

const conexion = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bdsitec",

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
});

conexion.getConnection((error, connection) => {
  if (error) {
    console.log("Error BD:", error);
    return;
  }

  console.log("Pool MySQL conectado correctamente");
  connection.release();
});

module.exports = conexion;