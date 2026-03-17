import crypto from "crypto";
import pool from "../db/connection.js";
import { categoryDecorator, categoriesListDecorator } from "../decorators/categories_decorator.js";

// 1. LISTAR TODAS
const index = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query("SELECT * FROM categories WHERE user_id = ?", [userId]);
    res.json(categoriesListDecorator(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. CREAR
const store = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    const [existingCategory] = await pool.query("SELECT id FROM categories WHERE name = ? AND user_id = ?", [
      name,
      userId,
    ]);

    if (existingCategory.length > 0) {
      return res.status(400).json({ error: "Ya tienes una categoría registrada con ese nombre" });
    }

    const categoryId = crypto.randomUUID();
    await pool.query("INSERT INTO categories (id, name, user_id) VALUES (?, ?, ?)", [categoryId, name, userId]);

    const [rows] = await pool.query("SELECT * FROM categories WHERE id = ?", [categoryId]);
    res.status(201).json(categoryDecorator(rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 3. VER UNA SOLA
const get = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [rows] = await pool.query("SELECT * FROM categories WHERE id = ? AND user_id = ?", [id, userId]);

    if (rows.length === 0) return res.status(404).json({ error: "Categoría no encontrada o no tienes permisos" });
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
    const userId = req.user.id;

    if (!name) return res.status(400).json({ error: "El nuevo nombre es obligatorio" });

    const [existingCategory] = await pool.query(
      "SELECT id FROM categories WHERE name = ? AND user_id = ? AND id != ?",
      [name, userId, id],
    );

    if (existingCategory.length > 0) {
      return res.status(400).json({ error: "Ya tienes otra categoría registrada con ese nombre" });
    }

    const [result] = await pool.query("UPDATE categories SET name = ? WHERE id = ? AND user_id = ?", [
      name,
      id,
      userId,
    ]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Categoría no encontrada o no tienes permisos" });

    const [rows] = await pool.query("SELECT * FROM categories WHERE id = ? AND user_id = ?", [id, userId]);
    res.json(categoryDecorator(rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. ELIMINAR
const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [result] = await pool.query("DELETE FROM categories WHERE id = ? AND user_id = ?", [id, userId]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Categoría no encontrada o no tienes permisos" });
    res.json({ message: "Categoría eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { index, store, get, update, destroy };
