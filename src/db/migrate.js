import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const correrMigraciones = async () => {
  try {
    console.log("Iniciando sistema de migraciones...");
    const archivosSql = ["users.sql", "categories.sql"];

    for (const archivo of archivosSql) {
      const rutaSql = path.join(__dirname, "migrations", archivo);

      if (fs.existsSync(rutaSql)) {
        console.log(`Ejecutando ${archivo}...`);
        const sqlNativo = fs.readFileSync(rutaSql, "utf8");

        await pool.query(sqlNativo);
        console.log(`Tabla de ${archivo} lista.`);
      } else {
        console.log(`Archivo ${archivo} no encontrado. Saltando...`);
      }
    }

    console.log("¡Todas las migraciones terminaron con éxito!");
    process.exit(0);
  } catch (error) {
    console.error("Error fatal ejecutando las migraciones:", error.message);
    process.exit(1);
  }
};

correrMigraciones();
