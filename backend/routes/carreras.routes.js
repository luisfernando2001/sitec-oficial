const router = require("express").Router();

const db = require("../config/db");

router.get("/carreras", (req, res) => {

  const sql = `
    SELECT *
    FROM carrera
    ORDER BY nombre_carrera ASC
  `;

  db.query(sql, (error, rows) => {

    if (error) {

      return res.status(500).json({
        error: error.message
      });

    }

    res.json(rows);

  });

});

module.exports = router;