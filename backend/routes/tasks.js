const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET /api/tasks
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, created_at AS "createdAt"
       FROM tasks
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("GET /api/tasks error:", error);

    res.status(500).json({
      error: "حدث خطأ أثناء جلب المهام.",
    });
  }
});

// POST /api/tasks
router.post("/", async (req, res) => {
  try {
    const title =
      typeof req.body?.title === "string"
        ? req.body.title.trim()
        : "";

    // Validation
    if (!title) {
      return res.status(400).json({
        error: "عنوان المهمة مطلوب.",
      });
    }

    if (title.length > 180) {
      return res.status(400).json({
        error: "عنوان المهمة طويل جدًا.",
      });
    }

    const result = await pool.query(
      `INSERT INTO tasks (user_id, title)
       VALUES ($1, $2)
       RETURNING id, title, created_at AS "createdAt"`,
      [1, title]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("POST /api/tasks error:", error);

    res.status(500).json({
      error: "حدث خطأ أثناء إنشاء المهمة.",
    });
  }
});

module.exports = router;