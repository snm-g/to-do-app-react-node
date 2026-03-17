import bcrypt from "bcrypt";
import crypto from "crypto";
import pool from "../db/connection.js";

// CREAR USUARIO
const store = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userId = crypto.randomUUID();

    const query = "INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)";
    await pool.query(query, [userId, name, email, hashedPassword]);

    res.status(201).json({
      message: "Usuario creado exitosamente",
      user: {
        id: userId,
        name: name,
        email: email,
      },
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export { store };
