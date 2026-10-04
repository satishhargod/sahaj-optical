// seed.js

const mysql = require("mysql2/promise");

// 🔥 DB CONFIG (apna change karo)
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "your_db_name",
});

// 👉 PASTE YOUR DATA HERE
const lessons = [
  [1, "Saying Hello", "Basic greeting conversation for beginners.", "👋", 6, 10, "easy", "daily life", "Daily Life", "orange"],
  [2, "My Family", "Talk about your family members.", "👨‍👩‍👧", 6, 10, "easy", "family", "Family", "blue"],
  // 👉 baki sab yaha paste karo (all 45)
];

const convs = {
  1: [
    ["Hello! What is your name?", ["My name is Alex.", "I am Alex.", "Alex is my name.", "Hi, I am Alex!", "Call me Alex."], 0],
    ["How old are you?", ["I am 8 years old.", "I am 8.", "Eight years old.", "I turned 8 last month.", "8 years."], 0],
  ],
  // 👉 baki sab paste karo
};

async function seed() {
  const conn = await pool.getConnection();

  try {
    console.log("🚀 Seeding started...");

    await conn.beginTransaction();

    // 🔥 1. INSERT LESSONS
    for (const l of lessons) {
      const [id, title, description, emoji, min_age, max_age, level, category, tag, color] = l;

      await conn.query(
        `INSERT INTO m_a_lessons 
        (id, title, description, emoji, min_age, max_age, level, category, tag, color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, title, description, emoji, min_age, max_age, level, category, tag, color]
      );
    }

    // 🔥 2. INSERT CONVERSATIONS + ANSWERS
    let convId = 1;

    for (const lessonId in convs) {
      const lessonConvs = convs[lessonId];

      for (let i = 0; i < lessonConvs.length; i++) {
        const [question, answers, primaryIndex] = lessonConvs[i];

        // 👉 insert conversation
        const [convResult] = await conn.query(
          `INSERT INTO m_a_lesson_conversations 
          (lesson_id, step_order, question)
          VALUES (?, ?, ?)`,
          [lessonId, i + 1, question]
        );

        const conversationId = convResult.insertId;

        // 👉 insert answers
        for (let j = 0; j < answers.length; j++) {
          await conn.query(
            `INSERT INTO m_a_conversation_answers
            (conversation_id, answer, is_primary)
            VALUES (?, ?, ?)`,
            [
              conversationId,
              answers[j],
              j === primaryIndex ? 1 : 0,
            ]
          );
        }

        convId++;
      }
    }

    await conn.commit();
    console.log("✅ Seeding completed successfully!");

  } catch (err) {
    await conn.rollback();
    console.error("❌ Error:", err);
  } finally {
    conn.release();
    process.exit();
  }
}

seed();