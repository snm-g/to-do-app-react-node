import crypto from "crypto";
import pool from "../db/connection.js";
import { taskDecorator, tasksListDecorator } from "../decorators/tasks_decorator.js";

// 1. LISTAR TODAS (Solo las del usuario logueado)
const index = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query("SELECT * FROM tasks WHERE user_id = ?", [userId]);
    res.json(tasksListDecorator(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. CREAR
const store = async (req, res) => {
  try {
    const userId = req.user.id;
    let { title, description, is_completed, category_id, tags } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "El título es obligatorio y no puede estar vacío" });
    }
    title = title.trim();

    if (title.length > 255) {
      return res.status(400).json({ error: "El título no puede superar los 255 caracteres" });
    }

    if (tags && !Array.isArray(tags)) {
      return res.status(400).json({ error: "El campo tags debe ser un arreglo de IDs" });
    }

    const taskId = crypto.randomUUID();

    await pool.query(
      "INSERT INTO tasks (id, title, description, is_completed, user_id, category_id) VALUES (?, ?, ?, ?, ?, ?)",
      [taskId, title, description || null, is_completed || false, userId, category_id || null],
    );

    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        await pool.query("INSERT INTO tags_tasks (task_id, tag_id) VALUES (?, ?)", [taskId, tagId]);
      }
    }

    const [rows] = await pool.query("SELECT * FROM tasks WHERE id = ?", [taskId]);
    res.status(201).json(taskDecorator(rows[0]));
  } catch (error) {
    console.error(error);
    if (error.errno === 1452) {
      return res.status(400).json({ error: "La categoría o la etiqueta especificada no existen" });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 3. VER UNA SOLA (Validando propiedad)
const get = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [rows] = await pool.query("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [id, userId]);

    if (rows.length === 0) return res.status(404).json({ error: "Tarea no encontrada o no tienes permisos" });

    const task = rows[0];

    const [tagRows] = await pool.query(
      "SELECT tags.id, tags.name FROM tags INNER JOIN tags_tasks ON tags.id = tags_tasks.tag_id WHERE tags_tasks.task_id = ?",
      [id],
    );

    const formattedTask = taskDecorator(task);
    formattedTask.tags = tagRows;

    res.json(formattedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. ACTUALIZAR (Validando propiedad y sanitizando)
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    let { title, description, is_completed, category_id, tags } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "El título es obligatorio y no puede estar vacío" });
    }
    title = title.trim();

    if (title.length > 255) {
      return res.status(400).json({ error: "El título no puede superar los 255 caracteres" });
    }

    if (tags && !Array.isArray(tags)) {
      return res.status(400).json({ error: "El campo tags debe ser un arreglo válido" });
    }

    const [result] = await pool.query(
      "UPDATE tasks SET title = ?, description = ?, is_completed = ?, category_id = ? WHERE id = ? AND user_id = ?",
      [title, description || null, is_completed || false, category_id || null, id, userId],
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Tarea no encontrada o no tienes permisos" });

    if (tags && Array.isArray(tags)) {
      await pool.query("DELETE FROM tags_tasks WHERE task_id = ?", [id]);

      if (tags.length > 0) {
        for (const tagId of tags) {
          await pool.query("INSERT INTO tags_tasks (task_id, tag_id) VALUES (?, ?)", [id, tagId]);
        }
      }
    }

    const [rows] = await pool.query("SELECT * FROM tasks WHERE id = ?", [id]);
    res.json(taskDecorator(rows[0]));
  } catch (error) {
    if (error.errno === 1452) {
      return res.status(400).json({ error: "La categoría o etiqueta especificada no existe" });
    }
    res.status(500).json({ error: error.message });
  }
};

// 5. ELIMINAR (Validando propiedad)
const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [result] = await pool.query("DELETE FROM tasks WHERE id = ? AND user_id = ?", [id, userId]);

    if (result.affectedRows === 0) return res.status(404).json({ error: "Tarea no encontrada o no tienes permisos" });
    res.json({ message: "Tarea eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { index, store, get, update, destroy };
