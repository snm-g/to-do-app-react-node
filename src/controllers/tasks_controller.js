import crypto from "crypto";
import pool from "../db/connection.js";
import { taskDecorator, tasksListDecorator } from "../decorators/tasks_decorator.js";

// 1. LISTAR TODAS
const index = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tasks");
    res.json(tasksListDecorator(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. CREAR
const store = async (req, res) => {
  try {
    const { title, description, is_completed, user_id, category_id, tags } = req.body;

    if (!title || !user_id) {
      return res.status(400).json({ error: "El título y el user_id son obligatorios" });
    }

    const taskId = crypto.randomUUID();

    await pool.query(
      "INSERT INTO tasks (id, title, description, is_completed, user_id, category_id) VALUES (?, ?, ?, ?, ?, ?)",
      [taskId, title, description || null, is_completed || false, user_id, category_id || null],
    );

    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagId of tags) {
        await pool.query("INSERT INTO tags_tasks (task_id, tag_id) VALUES (?, ?)", [taskId, tagId]);
      }
    }

    const [rows] = await pool.query("SELECT * FROM tasks WHERE id = ?", [taskId]);
    res.status(201).json(taskDecorator(rows[0]));
  } catch (error) {
    console.error(error);
    if (error.errno === 1452) {
      return res.status(400).json({ error: "El usuario, la categoría o la etiqueta no existen" });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 3. VER UNA SOLA
const get = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query("SELECT * FROM tasks WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Tarea no encontrada" });

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

// 4. ACTUALIZAR
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, is_completed, category_id, tags } = req.body;

    if (!title) return res.status(400).json({ error: "El título es obligatorio" });

    const [result] = await pool.query(
      "UPDATE tasks SET title = ?, description = ?, is_completed = ?, category_id = ? WHERE id = ?",
      [title, description || null, is_completed || false, category_id || null, id],
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Tarea no encontrada" });

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

// 5. ELIMINAR
const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM tasks WHERE id = ?", [id]);

    if (result.affectedRows === 0) return res.status(404).json({ error: "Tarea no encontrada" });
    res.json({ message: "Tarea eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { index, store, get, update, destroy };
