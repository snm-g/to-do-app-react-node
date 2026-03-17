import cors from "cors";

import express from "express";
import "./db/connection.js";
import userRoutes from "./routes/users_route.js";
// import categoryRoutes from "./routes/categories_route.js";
// import tagRoutes from "./routes/tags_route.js";
// import taskRoutes from "./routes/tasks_route.js";

import { verifyToken } from "./middlewares/auth_middleware.js";

const app = express();

app.use(cors());

// 2. Permites que Express lea el JSON que envías desde tu frontend
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/users", userRoutes);
// app.use("/api/categories", verifyToken, categoryRoutes);
// app.use("/api/tags", verifyToken, tagRoutes);
// app.use("/api/tasks", verifyToken, taskRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
