const router = require("express").Router();

const db = require("../config/db");

router.get("/categorias", (req, res) => {

  const sql = `
    SELECT *
    FROM categoria
    ORDER BY nombre_categoria ASC
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