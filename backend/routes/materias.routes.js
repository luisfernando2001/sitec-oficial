const router = require("express").Router();

const db = require("../config/db");

router.get("/materias", (req, res) => {

  const sql = `
    SELECT *
    FROM materia
    ORDER BY nombre_materia ASC
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