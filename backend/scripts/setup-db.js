require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

async function main() {
  const schema = fs.readFileSync(path.join(__dirname, "..", "schema.sql"), "utf8");
  await pool.query(schema);
  console.log("PostgreSQL schema created successfully.");
  await pool.end();
}

main().catch(async (err) => {
  console.error("Database setup failed:", err.message);
  await pool.end();
  process.exit(1);
});
