import crypto from "crypto";
import pool from "../db/connection.js";
import { categoryDecorator, categoriesListDecorator } from "../decorators/category-decorator.js";

// 1. LISTAR TODAS
const index = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM categories"); // plural
    res.json(categoriesListDecorator(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. CREAR
const store = async (req, res) => {
  try {
    const { name, user_id } = req.body;
    if (!name || !user_id) {
      return res.status(400).json({ error: "El nombre y el user_id son obligatorios" });
    }

    const categoryId = crypto.randomUUID();
    await pool.query("INSERT INTO categories (id, name, user_id) VALUES (?, ?, ?)", [categoryId, name, user_id]);
    const [rows] = await pool.query("SELECT * FROM categories WHERE id = ?", [categoryId]);

    res.status(201).json(categoryDecorator(rows[0]));
  } catch (error) {
    console.error(error);
    if (error.errno === 1452) {
      return res.status(400).json({ error: "El usuario especificado no existe" });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 3. VER UNA SOLA
const get = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM categories WHERE id = ?", [id]);

    if (rows.length === 0) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json(categoryDecorator(rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. ACTUALIZAR
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: "El nuevo nombre es obligatorio" });

    const [result] = await pool.query("UPDATE categories SET name = ? WHERE id = ?", [name, id]);

    if (result.affectedRows === 0) return res.status(404).json({ error: "Categoría no encontrada" });

    const [rows] = await pool.query("SELECT * FROM categories WHERE id = ?", [id]);
    res.json(categoryDecorator(rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. ELIMINAR
const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [id]);

    if (result.affectedRows === 0) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json({ message: "Categoría eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { index, store, get, update, destroy };
