const mysql = require("mysql2");

const conexion = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "bdsitec"
});

conexion.connect((error) => {

  if(error){
    console.log("Error BD:", error);
    return;
  }

  console.log("Base conectada correctamente");

});

module.exports = conexion;