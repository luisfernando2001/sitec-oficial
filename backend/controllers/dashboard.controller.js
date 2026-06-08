const db = require("../config/db");

const obtenerDashboard = (req, res) => {

    const query = `
        SELECT
            (SELECT COUNT(*) FROM recurso) as recursos,
            (SELECT COUNT(*) FROM descarga) as descargas,
            (SELECT COUNT(*) FROM solicitud) as solicitudes
    `;

    db.query(query, (error, resultado) => {

        if(error){

            return res.status(500).json({
                error: error.message
            });

        }

        res.json({

            recursos: resultado[0].recursos,
            descargas: resultado[0].descargas,
            solicitudes: resultado[0].solicitudes,
            favoritos: 0

        });

    });

};

module.exports = {

    obtenerDashboard

};