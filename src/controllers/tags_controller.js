import crypto from "crypto";
import pool from "../db/connection.js";
import { tagDecorator, tagsListDecorator } from "../decorators/tags_decorator.js";

// 1. LISTAR TODAS (Solo las del usuario logueado)
const index = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query("SELECT * FROM tags WHERE user_id = ?", [userId]);
    res.json(tagsListDecorator(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. CREAR
const store = async (req, res) => {
  try {
    const userId = req.user.id;
    let { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "El nombre es obligatorio y no puede estar vacío" });
    }
    name = name.trim();

    const [existingTag] = await pool.query("SELECT id FROM tags WHERE name = ? AND user_id = ?", [name, userId]);

    if (existingTag.length > 0) {
      return res.status(400).json({ error: "Ya tienes una etiqueta registrada con ese nombre" });
    }

    const tagId = crypto.randomUUID();
    await pool.query("INSERT INTO tags (id, name, user_id) VALUES (?, ?, ?)", [tagId, name, userId]);

    const [rows] = await pool.query("SELECT * FROM tags WHERE id = ?", [tagId]);
    res.status(201).json(tagDecorator(rows[0]));
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

    const [rows] = await pool.query("SELECT * FROM tags WHERE id = ? AND user_id = ?", [id, userId]);

    if (rows.length === 0) return res.status(404).json({ error: "Etiqueta no encontrada o no tienes permisos" });
    res.json(tagDecorator(rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. ACTUALIZAR
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    let { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "El nuevo nombre es obligatorio y no puede estar vacío" });
    }
    name = name.trim();

    const [existingTag] = await pool.query("SELECT id FROM tags WHERE name = ? AND user_id = ? AND id != ?", [
      name,
      userId,
      id,
    ]);

    if (existingTag.length > 0) {
      return res.status(400).json({ error: "Ya tienes otra etiqueta registrada con ese nombre" });
    }

    const [result] = await pool.query("UPDATE tags SET name = ? WHERE id = ? AND user_id = ?", [name, id, userId]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Etiqueta no encontrada o no tienes permisos" });

    const [rows] = await pool.query("SELECT * FROM tags WHERE id = ? AND user_id = ?", [id, userId]);
    res.json(tagDecorator(rows[0]));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. ELIMINAR
const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [result] = await pool.query("DELETE FROM tags WHERE id = ? AND user_id = ?", [id, userId]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Etiqueta no encontrada o no tienes permisos" });
    res.json({ message: "Etiqueta eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { index, store, get, update, destroy };
