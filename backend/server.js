const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

require("./config/db");

const app = express();

/* MIDDLEWARES */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ARCHIVOS ESTÁTICOS */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/debug-reset-admin-sitec-2026", async (req, res) => {
  try {
    const mysql = require("mysql2/promise");
    const bcrypt = require("bcryptjs");

    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT || 3306),
      ssl: { rejectUnauthorized: false },
    });

    const [[rolAdmin]] = await conn.query(`
      SELECT id_rol
      FROM rol
      WHERE nombre_rol = 'Administrador'
      LIMIT 1
    `);

    if (!rolAdmin) {
      await conn.end();
      return res.status(500).json({
        ok: false,
        mensaje: "No existe el rol Administrador",
      });
    }

    const passwordHash = await bcrypt.hash("Admin12", 10);

    const [usuarios] = await conn.query(`
      SELECT id_usuario
      FROM usuario
      WHERE correo = 'adminsitec@umsa.bo'
         OR correo = 'adminsitec@fatec.edu.bo'
         OR correo LIKE '%adminsitec%'
      LIMIT 1
    `);

    if (usuarios.length > 0) {
      await conn.query(
        `
        UPDATE usuario
        SET
          id_rol = ?,
          correo = 'adminsitec@umsa.bo',
          contrasena = ?,
          estado = 1,
          debe_cambiar_password = 0
        WHERE id_usuario = ?
        `,
        [rolAdmin.id_rol, passwordHash, usuarios[0].id_usuario]
      );

      await conn.end();

      return res.json({
        ok: true,
        mensaje: "Admin actualizado correctamente",
        usuario: "adminsitec",
        password: "Admin12",
      });
    }

    await conn.query(
      `
      INSERT INTO usuario (
        id_rol,
        id_carrera,
        nombre,
        apellido,
        carnet,
        registro_universitario,
        correo,
        contrasena,
        debe_cambiar_password,
        estado,
        fecha_registro
      )
      VALUES (?, NULL, 'Administrador', 'SITEC', '999999', 'ADMIN001', 'adminsitec@umsa.bo', ?, 0, 1, NOW())
      `,
      [rolAdmin.id_rol, passwordHash]
    );

    await conn.end();

    return res.json({
      ok: true,
      mensaje: "Admin creado correctamente",
      usuario: "adminsitec",
      password: "Admin12",
    });
  } catch (error) {
    console.error("Error debug reset admin:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error al resetear admin",
      error: error.message,
    });
  }
});
/* RUTA BASE */
app.get("/", (req, res) => {
  res.json({
    ok: true,
    mensaje: "Backend SITEC funcionando correctamente",
    puerto: 3000,
    base: "bdsitec",
  });
});

/* RUTAS DE AUTENTICACIÓN */
app.use("/api/auth", require("./routes/auth.routes"));

/* RUTAS ESTUDIANTE / DOCENTE */
app.use("/api", require("./routes/dashboard.routes"));
app.use("/api", require("./routes/libros.routes"));
app.use("/api", require("./routes/carreras.routes"));
app.use("/api", require("./routes/materias.routes"));
app.use("/api", require("./routes/categorias.routes"));

/* RUTAS USUARIO */
app.use("/api/perfil", require("./routes/perfil.routes"));
app.use("/api/favoritos", require("./routes/favoritos.routes"));
app.use("/api/configuracion", require("./routes/configuracion.routes"));
app.use("/api/solicitudes", require("./routes/solicitudes.routes"));
app.use("/api/actividad", require("./routes/actividad.routes"));

/* RUTAS ADMINISTRADOR */
app.use("/api/admin", require("./routes/admin/adminPanel.routes"));
app.use("/api/admin/carreras", require("./routes/admin/carreras.routes"));
app.use("/api/admin/categorias", require("./routes/admin/categorias.routes"));
app.use("/api/admin/materias", require("./routes/admin/materias.routes"));
app.use("/api/admin/solicitudes", require("./routes/admin/solicitudes.routes"));
app.use("/api/admin/usuarios", require("./routes/admin/usuarios.routes"));
app.use("/api/admin/informes", require("./routes/admin/informes.routes"));
app.use("/api/admin/configuracion", require("./routes/admin/configuracionAdmin.routes"));
app.use("/api/admin/perfil", require("./routes/admin/perfilAdmin.routes"));
app.use("/api/admin/libros", require("./routes/admin/libros.routes"));

/* ASISTENTE */
app.use("/api/asistente", require("./routes/asistente"));

/* PROXY PARA PDF */
app.get("/pdf-proxy", (req, res) => {
  const archivo = req.query.archivo || "";

  if (!archivo || archivo.includes("..")) {
    return res.status(400).send("Ruta inválida");
  }

  const rutaPDF = path.join(__dirname, archivo);

  if (!fs.existsSync(rutaPDF)) {
    return res.status(404).send("Archivo no encontrado: " + rutaPDF);
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", fs.statSync(rutaPDF).size);

  fs.createReadStream(rutaPDF).pipe(res);
});

app.use(
  "/api/gestor",
  require("./routes/gestor/panelGestor.routes")
);

app.use("/api/gestor/libros", require("./routes/gestor/librosGestor.routes"));
app.use(
  "/api/gestor/solicitudes",
  require("./routes/gestor/solicitudesGestor.routes")
);

/* RUTA NO ENCONTRADA */
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    mensaje: "Ruta no encontrada",
    ruta: req.originalUrl,
  });
});


const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor activo puerto ${PORT}`);
});