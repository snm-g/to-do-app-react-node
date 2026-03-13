import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  multipleStatements: true,
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
