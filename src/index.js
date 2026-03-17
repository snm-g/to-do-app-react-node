import express from "express";
import "./db/connection.js";
// import userRoutes from './routes/users_routes.js';
import categoryRoutes from "./routes/categories_route.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// app.use('/api/users', userRoutes);
app.use("/api/categories", categoryRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
