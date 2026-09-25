import { useState } from "react";

export default function TaskForm() {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("عنوان المهمة مطلوب.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:4000/api/tasks",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "حدث خطأ أثناء إنشاء المهمة."
        );
      }

      setSuccess("تمت إضافة المهمة بنجاح.");
      setTitle("");
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>إضافة مهمة</h2>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="عنوان المهمة"
      />

      <button type="submit">
        إضافة
      </button>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {success && (
        <p style={{ color: "green" }}>
          {success}
        </p>
      )}
    </form>
  );
}