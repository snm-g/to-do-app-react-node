import crypto from "crypto";
import pool from "../db/connection.js";
import { taskDecorator, tasksListDecorator } from "../decorators/tasks_decorator.js";

// ==========================================
// EL SQL MAESTRO (Para traer la tarea vestida)
// ==========================================
const getTaskWithRelationsSQL = `
  SELECT 
    tasks.*,
    IF(categories.id IS NOT NULL, JSON_OBJECT('id', categories.id, 'name', categories.name), NULL) as category,
    COALESCE(
      (
        SELECT JSON_ARRAYAGG(JSON_OBJECT('id', tags.id, 'name', tags.name))
        FROM tags 
        JOIN tags_tasks ON tags.id = tags_tasks.tag_id 
        WHERE tags_tasks.task_id = tasks.id
      ), 
      JSON_ARRAY()
    ) as tags
  FROM tasks
  LEFT JOIN categories ON tasks.category_id = categories.id
  WHERE tasks.id = ? AND tasks.user_id = ?
`;

// 1. LISTAR TODAS (Con Paginación para React)
const index = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Contamos el total para que React sepa cuántas páginas hay
    const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM tasks WHERE user_id = ?", [userId]);

    // Ojo: Aquí podrías usar el SQL Maestro modificado si quieres que el index también traiga relaciones completas,
    // pero si tu taskDecorator ya hace el trabajo, lo dejamos así para no saturar.
    const [rows] = await pool.query("SELECT * FROM tasks WHERE user_id = ? LIMIT ? OFFSET ?", [userId, limit, offset]);

    res.json({
      data: tasksListDecorator(rows),
      last_page: Math.ceil(total / limit), // Esto es lo que React lee como 'totalPaginas'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. CREAR (Con Transacciones y SQL Maestro)
const store = async (req, res) => {
  let connection;
  try {
    const userId = req.user.id;
    let { title, description, is_completed, category_id, tags } = req.body;

    // Validaciones
    if (!title || title.trim() === "")
      return res.status(400).json({ error: "El título es obligatorio y no puede estar vacío" });
    title = title.trim();
    if (title.length > 255) return res.status(400).json({ error: "El título no puede superar los 255 caracteres" });
    if (tags && !Array.isArray(tags))
      return res.status(400).json({ error: "El campo tags debe ser un arreglo de IDs" });

    // ESCUDO ANTI-ERROR 400: Convertir textos vacíos a null
    const finalCategoryId = category_id === "" ? null : category_id;
    const taskId = crypto.randomUUID();

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insertar tarea
    await connection.query(
      "INSERT INTO tasks (id, title, description, is_completed, user_id, category_id) VALUES (?, ?, ?, ?, ?, ?)",
      [taskId, title, description || null, is_completed || false, userId, finalCategoryId],
    );

    // Insertar etiquetas
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        await connection.query("INSERT INTO tags_tasks (task_id, tag_id) VALUES (?, ?)", [taskId, tagId]);
      }
    }

    await connection.commit();

    // Devolvemos la tarea "vestida"
    const [rows] = await pool.query(getTaskWithRelationsSQL, [taskId, userId]);
    res.status(201).json(rows[0]); // Ya no necesita decorador porque el SQL hizo el JSON
  } catch (error) {
    if (connection) await connection.rollback();
    console.error(error);
    if (error.errno === 1452)
      return res.status(400).json({ error: "La categoría o la etiqueta especificada no existen" });
    res.status(500).json({ error: "Error interno del servidor al crear" });
  } finally {
    if (connection) connection.release();
  }
};

// 3. VER UNA SOLA (Refactorizada con SQL Maestro)
const get = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [rows] = await pool.query(getTaskWithRelationsSQL, [id, userId]);

    if (rows.length === 0) return res.status(404).json({ error: "Tarea no encontrada o no tienes permisos" });

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. ACTUALIZAR (Con Transacciones y SQL Maestro)
const update = async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const userId = req.user.id;
    let { title, description, is_completed, category_id, tags } = req.body;

    if (!title || title.trim() === "") return res.status(400).json({ error: "El título es obligatorio" });
    title = title.trim();
    if (title.length > 255) return res.status(400).json({ error: "El título no puede superar los 255 caracteres" });
    if (tags && !Array.isArray(tags))
      return res.status(400).json({ error: "El campo tags debe ser un arreglo válido" });

    const finalCategoryId = category_id === "" ? null : category_id;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.query(
      "UPDATE tasks SET title = ?, description = ?, is_completed = ?, category_id = ? WHERE id = ? AND user_id = ?",
      [title, description || null, is_completed || false, finalCategoryId, id, userId],
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Tarea no encontrada o no tienes permisos" });
    }

    if (tags && Array.isArray(tags)) {
      await connection.query("DELETE FROM tags_tasks WHERE task_id = ?", [id]);
      if (tags.length > 0) {
        for (const tagId of tags) {
          await connection.query("INSERT INTO tags_tasks (task_id, tag_id) VALUES (?, ?)", [id, tagId]);
        }
      }
    }

    await connection.commit();

    const [rows] = await pool.query(getTaskWithRelationsSQL, [id, userId]);
    res.json(rows[0]);
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.errno === 1452) return res.status(400).json({ error: "La categoría o etiqueta especificada no existe" });
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// 5. ELIMINAR
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
