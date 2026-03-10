import bcrypt from "bcrypt";
import pool from "../db/connection.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = "INSERT INTO user (name, email, password) VALUES (?, ?, ?)";

    const [result] = await pool.query(query, [name, email, hashedPassword]);

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Error en el registro:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    res.status(500).json({ error: "Error interno del servidor" });
  }
};
