import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "to-do-list",
  port: 3307,
});

const probarConexion = async () => {
  try {
    const [rows] = await pool.query("SELECT 1 AS resultado");
    console.log("Conexión exitosa a MySQL, resultado:", rows[0].resultado);
  } catch (error) {
    console.error("Error fatal al conectar:", error.message);
  }
};

probarConexion();

export default pool;
