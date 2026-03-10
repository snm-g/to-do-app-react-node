import "./db/connection.js";
import express from "express";
import userRoutes from "./routes/user_routes.js";

console.log("Iniciando prueba de base de datos...");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/user", userRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
