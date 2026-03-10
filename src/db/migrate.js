import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const correrMigraciones = async () => {
  try {
    console.log("Iniciando migración...");

    const rutaSql = path.join(__dirname, "migrations", "user.sql");
    const sqlNativo = fs.readFileSync(rutaSql, "utf8");

    await pool.query(sqlNativo);

    console.log('Migración exitosa: Tabla "users" creada o ya existente.');

    process.exit(0);
  } catch (error) {
    console.error("Error ejecutando la migración:", error.message);
    process.exit(1);
  }
};

correrMigraciones();
