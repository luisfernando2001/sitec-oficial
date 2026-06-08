require("dotenv").config();

const mysql = require("mysql2");

const conexion = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bdsitec",
  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
});

conexion.connect((error) => {
  if (error) {
    console.log("Error BD:", error);
    return;
  }

  console.log("Base conectada correctamente");
});

module.exports = conexion;