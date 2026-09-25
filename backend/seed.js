require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./db");

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const passwordHash = await bcrypt.hash("123456", 12);
    const user = await client.query(
      `INSERT INTO users (name, phone, password_hash, category)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ["الحساب التجريبي", "0910004521", passwordHash, "منزلي"]
    );
    const userId = user.rows[0].id;

    let account = await client.query(
      `SELECT id FROM accounts WHERE user_id = $1 AND meter_number = $2 LIMIT 1`,
      [userId, "205841"]
    );
    if (!account.rowCount) {
      account = await client.query(
        `INSERT INTO accounts (user_id, label, meter_number, region, category, service_type, active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id`,
        [userId, "المنزل الرئيسي", "205841", "طرابلس — المنطقة الوسطى", "منزلي", "prepaid"]
      );
    }
    const m1 = account.rows[0].id;

    let invoiceAccount = await client.query(
      `SELECT id FROM accounts WHERE user_id = $1 AND meter_number = $2 LIMIT 1`,
      [userId, "118820"]
    );
    if (!invoiceAccount.rowCount) {
      invoiceAccount = await client.query(
        `INSERT INTO accounts (user_id, label, meter_number, region, category, service_type, active)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE) RETURNING id`,
        [userId, "المحل التجاري", "118820", "طرابلس — المنطقة الوسطى", "تجاري", "invoice"]
      );
    }
    const m2 = invoiceAccount.rows[0].id;

    await client.query(
      `INSERT INTO balances (account_id, amount, daily_avg, days_left, last_top_up)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (account_id) DO UPDATE SET amount=EXCLUDED.amount, daily_avg=EXCLUDED.daily_avg, days_left=EXCLUDED.days_left, last_top_up=EXCLUDED.last_top_up`,
      [m1, 37.8, 5.8, 6, "قبل 4 أيام"]
    );

    await client.query(
      `INSERT INTO consumption (account_id, last_7_days, daily_avg_ld, month_total, month_change_pct, last_reading, monthly_history)
       VALUES ($1, $2::jsonb, $3, $4, $5, $6::jsonb, $7::jsonb)
       ON CONFLICT (account_id) DO UPDATE SET last_7_days=EXCLUDED.last_7_days, daily_avg_ld=EXCLUDED.daily_avg_ld, month_total=EXCLUDED.month_total, month_change_pct=EXCLUDED.month_change_pct, last_reading=EXCLUDED.last_reading, monthly_history=EXCLUDED.monthly_history`,
      [m1, JSON.stringify([55, 78, 65, 92, 98, 80, 118]), 5.8, 118.7, 15,
       JSON.stringify({ previous: 4820, current: 5058, usageKwh: 238, category: "منزلي" }),
       JSON.stringify([
         { month: "أغسطس 2026", kwh: 238, amount: 118.7 },
         { month: "يوليو 2026", kwh: 206, amount: 103.2 },
         { month: "يونيو 2026", kwh: 190, amount: 95.0 }
       ])]
    );

    await client.query(
      `INSERT INTO invoices (account_id, period, amount, issue_date, due_date, days_until_due, reading, history)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
       ON CONFLICT (account_id) DO UPDATE SET period=EXCLUDED.period, amount=EXCLUDED.amount, issue_date=EXCLUDED.issue_date, due_date=EXCLUDED.due_date, days_until_due=EXCLUDED.days_until_due, reading=EXCLUDED.reading, history=EXCLUDED.history`,
      [m2, "أغسطس 2026", 146.5, "1 أغسطس 2026", "26 أغسطس 2026", 3,
       JSON.stringify({ previous: 12340, current: 12633, usageKwh: 293, category: "تجاري" }),
       JSON.stringify([
         { month: "يوليو 2026", kwh: 261, amount: 131.0, status: "paid" },
         { month: "يونيو 2026", kwh: 240, amount: 120.0, status: "late" },
         { month: "مايو 2026", kwh: 255, amount: 127.5, status: "paid" }
       ])]
    );

    await client.query(
      `INSERT INTO notification_settings (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );


    const txCount = await client.query("SELECT COUNT(*)::int AS count FROM transactions WHERE account_id = $1", [m1]);
    if (txCount.rows[0].count === 0) {
      await client.query(
        `INSERT INTO transactions (account_id, type, label, amount, sign, occurred_at)
         VALUES
         ($1, 'topup', 'شحن رصيد', 50, '+', NOW()),
         ($1, 'invoice', 'دفع فاتورة', 65, '+', NOW() - INTERVAL '2 days'),
         ($1, 'failed', 'محاولة دفع فاشلة', NULL, '', NOW() - INTERVAL '5 days'),
         ($1, 'topup', 'شحن رصيد', 30, '+', NOW() - INTERVAL '7 days')`,
        [m1]
      );
    }

    const notificationCount = await client.query("SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1", [userId]);
    if (notificationCount.rows[0].count === 0) {
      await client.query(
        `INSERT INTO notifications (user_id, icon, title, body, occurred_at)
         VALUES
         ($1, 'low', 'الرصيد منخفض', 'رصيدك أقل من الحد الذي حددته (40 د.ل).', NOW() - INTERVAL '2 hours'),
         ($1, 'soon', 'قرب النفاد', 'الاستهلاك الحالي قد يستنفد الرصيد خلال 6 أيام تقريبًا.', NOW() - INTERVAL '3 hours'),
         ($1, 'usage', 'ارتفاع في الاستهلاك', 'استهلاكك هذا الأسبوع أعلى من المعدل المعتاد وفقًا لآخر البيانات المتاحة.', NOW() - INTERVAL '1 day'),
         ($1, 'success', 'تم الشحن', 'تمت عملية الشحن بنجاح وأصبح الرصيد محدّثًا.', NOW() - INTERVAL '4 days')`,
        [userId]
      );
    }

    await client.query("COMMIT");
    console.log("Demo account ready: 0910004521 / 123456");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
