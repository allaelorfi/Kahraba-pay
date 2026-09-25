require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("JWT_SECRET is missing. Create backend/.env from backend/.env.example.");
  process.exit(1);
}
if (!process.env.DB_PASSWORD) {
  console.warn("DB_PASSWORD is not set. PostgreSQL may reject the connection.");
}

app.use(cors());
app.use(express.json({ limit: "100kb" }));

function normalizeDigits(value = "") {
  return String(value)
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validatePhone(value) {
  const phone = normalizeDigits(text(value));
  return /^09\d{8}$/.test(phone);
}

function validateMeter(value) {
  const meter = normalizeDigits(text(value));
  return /^\d{4,20}$/.test(meter);
}

function validatePassword(value) {
  return typeof value === "string" && value.length >= 6 && value.length <= 72;
}

function validateName(value) {
  const name = text(value);
  return name.length >= 2 && name.length <= 120;
}

function validateId(value) {
  return /^\d+$/.test(String(value));
}

function signToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "7d" });
}

function authRequired(req, res, next) {
  const header = req.get("Authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "انتهت الجلسة أو لم يتم تسجيل الدخول." });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload.sub) throw new Error("Invalid token");
    req.userId = Number(payload.sub);
    next();
  } catch {
    return res.status(401).json({ error: "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى." });
  }
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

async function userOwnsAccount(userId, accountId) {
  if (!validateId(accountId)) return false;
  const result = await pool.query(
    "SELECT 1 FROM accounts WHERE id = $1 AND user_id = $2",
    [Number(accountId), userId]
  );
  return result.rowCount > 0;
}

app.get("/api/health", asyncRoute(async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true, database: "postgresql" });
}));

// ---------- auth ----------
app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const phone = normalizeDigits(text(req.body?.phone));
  const password = req.body?.password;

  if (!phone || !password) {
    return res.status(400).json({ error: "يرجى إدخال رقم الهاتف وكلمة المرور." });
  }
  if (!validatePhone(phone)) {
    return res.status(400).json({ error: "رقم الهاتف يجب أن يتكون من 10 أرقام ويبدأ بـ 09." });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({ error: "كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام." });
  }

  const result = await pool.query(
    "SELECT id, name, phone, category, password_hash FROM users WHERE phone = $1",
    [phone]
  );
  if (!result.rowCount) {
    return res.status(401).json({ error: "الحساب غير موجود. اختر «حساب جديد» لإنشاء حساب." });
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "رقم الهاتف أو كلمة المرور غير صحيحة." });
  }

  res.json({
    token: signToken(user),
    user: { id: user.id, name: user.name, phone: user.phone, category: user.category }
  });
}));

app.post("/api/auth/signup", asyncRoute(async (req, res) => {
  const name = text(req.body?.name);
  const phone = normalizeDigits(text(req.body?.phone));
  const password = req.body?.password;

  if (!name || !phone || !password) {
    return res.status(400).json({ error: "يرجى تعبئة جميع الحقول المطلوبة." });
  }
  if (!validateName(name)) {
    return res.status(400).json({ error: "الاسم يجب أن يتكون من حرفين على الأقل وألا يتجاوز 120 حرفًا." });
  }
  if (!validatePhone(phone)) {
    return res.status(400).json({ error: "رقم الهاتف يجب أن يتكون من 10 أرقام ويبدأ بـ 09." });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({ error: "كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام." });
  }

  const existing = await pool.query("SELECT 1 FROM users WHERE phone = $1", [phone]);
  if (existing.rowCount) {
    return res.status(409).json({ error: "رقم الهاتف مستخدم بالفعل. جرّب تسجيل الدخول." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      `INSERT INTO users (name, phone, password_hash, category)
       VALUES ($1, $2, $3, 'منزلي')
       RETURNING id, name, phone, category`,
      [name, phone, passwordHash]
    );
    const user = userResult.rows[0];
    await client.query(
      `INSERT INTO notification_settings (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    );
    await client.query("COMMIT");

    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      return res.status(409).json({ error: "رقم الهاتف مستخدم بالفعل." });
    }
    throw err;
  } finally {
    client.release();
  }
}));

// ---------- user / accounts ----------
app.get("/api/user", authRequired, asyncRoute(async (req, res) => {
  const result = await pool.query(
    "SELECT id, name, phone, category FROM users WHERE id = $1",
    [req.userId]
  );
  if (!result.rowCount) return res.status(404).json({ error: "المستخدم غير موجود." });
  res.json(result.rows[0]);
}));

app.get("/api/accounts", authRequired, asyncRoute(async (req, res) => {
  const result = await pool.query(
    `SELECT id, label, meter_number AS "meterNumber", region, category,
            service_type AS "serviceType", active
     FROM accounts WHERE user_id = $1 ORDER BY active DESC, id ASC`,
    [req.userId]
  );
  res.json(result.rows);
}));

app.post("/api/accounts", authRequired, asyncRoute(async (req, res) => {
  const label = text(req.body?.label);
  const meterNumber = normalizeDigits(text(req.body?.meterNumber));
  const region = text(req.body?.region) || "غير محدد";
  const category = text(req.body?.category) || "منزلي";
  const serviceType = text(req.body?.serviceType) || "prepaid";

  if (!label || !meterNumber) {
    return res.status(400).json({ error: "اسم العقار ورقم العداد مطلوبان." });
  }
  if (label.length > 120) {
    return res.status(400).json({ error: "اسم العقار طويل جدًا." });
  }
  if (!validateMeter(meterNumber)) {
    return res.status(400).json({ error: "رقم العداد أو نقطة الخدمة يجب أن يكون أرقامًا فقط." });
  }
  if (!["prepaid", "invoice"].includes(serviceType)) {
    return res.status(400).json({ error: "نوع الخدمة غير صالح." });
  }
await pool.query(
  "UPDATE accounts SET active = FALSE WHERE user_id = $1",
  [req.userId]
);
  const result = await pool.query(
    `INSERT INTO accounts (user_id, label, meter_number, region, category, service_type, active)
     VALUES ($1, $2, $3, $4, $5, $6, FALSE)
     RETURNING id, label, meter_number AS "meterNumber", region, category,
               service_type AS "serviceType", active`,
    [req.userId, label, meterNumber, region, category, serviceType]
  );
  const account = result.rows[0];
  await pool.query(
    `INSERT INTO balances (account_id) VALUES ($1) ON CONFLICT (account_id) DO NOTHING;
     INSERT INTO consumption (account_id) VALUES ($1) ON CONFLICT (account_id) DO NOTHING;`,
    [account.id]
  );
  res.status(201).json(account);
}));

// ---------- onboarding ----------
app.post("/api/onboarding/link-account", authRequired, asyncRoute(async (req, res) => {
  const serviceType = text(req.body?.serviceType) || "prepaid";
  const meterNumber = normalizeDigits(text(req.body?.meterNumber));
  const region = text(req.body?.region) || "غير محدد";
  const category = text(req.body?.category) || "منزلي";

  if (!meterNumber) {
    return res.status(400).json({ error: serviceType === "invoice" ? "رقم نقطة الخدمة مطلوب." : "رقم العداد مطلوب." });
  }
  if (!validateMeter(meterNumber)) {
    return res.status(400).json({ error: "رقم العداد أو نقطة الخدمة يجب أن يحتوي على أرقام فقط." });
  }
  if (!["prepaid", "invoice"].includes(serviceType)) {
    return res.status(400).json({ error: "نوع الخدمة غير صالح." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE accounts SET active = FALSE WHERE user_id = $1", [req.userId]);

    const accountResult = await client.query(
      `INSERT INTO accounts (user_id, label, meter_number, region, category, service_type, active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING id, label, meter_number AS "meterNumber", region, category,
                 service_type AS "serviceType", active`,
      [
        req.userId,
        serviceType === "invoice" ? "حساب الفاتورة" : "العداد الرئيسي",
        meterNumber,
        region,
        category,
        serviceType
      ]
    );
    const account = accountResult.rows[0];

    await client.query(
      `INSERT INTO balances (account_id) VALUES ($1) ON CONFLICT (account_id) DO NOTHING`,
      [account.id]
    );
    await client.query(
      `INSERT INTO consumption (account_id) VALUES ($1) ON CONFLICT (account_id) DO NOTHING`,
      [account.id]
    );
    if (serviceType === "invoice") {
      await client.query(
        `INSERT INTO invoices (account_id, period, amount, issue_date, due_date, days_until_due)
         VALUES ($1, 'لا توجد فاتورة بعد', 0, '-', '-', 0)
         ON CONFLICT (account_id) DO NOTHING`,
        [account.id]
      );
    }
    await client.query("COMMIT");
    res.status(201).json({ account });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}));

app.put("/api/onboarding/notification-prefs", authRequired, asyncRoute(async (req, res) => {
  const payload = {
    low_balance: Boolean(req.body?.lowBalance),
    invoice_due: Boolean(req.body?.invoiceDue),
    usage_spike: Boolean(req.body?.usageSpike),
    weekly_summary: Boolean(req.body?.weeklySummary)
  };
  const result = await pool.query(
    `INSERT INTO notification_settings (user_id, low_balance, invoice_due, usage_spike, weekly_summary)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       low_balance=EXCLUDED.low_balance,
       invoice_due=EXCLUDED.invoice_due,
       usage_spike=EXCLUDED.usage_spike,
       weekly_summary=EXCLUDED.weekly_summary
     RETURNING low_balance AS "lowBalance", invoice_due AS "invoiceDue",
               usage_spike AS "usageSpike", weekly_summary AS "weeklySummary"`,
    [req.userId, payload.low_balance, payload.invoice_due, payload.usage_spike, payload.weekly_summary]
  );
  res.json({ settings: result.rows[0] });
}));

// ---------- balance & charge ----------
app.get("/api/balance/:accountId", authRequired, asyncRoute(async (req, res) => {
  if (!(await userOwnsAccount(req.userId, req.params.accountId))) {
    return res.status(404).json({ error: "الحساب غير موجود." });
  }
  const result = await pool.query(
    `SELECT amount::float AS amount, daily_avg::float AS "dailyAvg", days_left AS "daysLeft", last_top_up AS "lastTopUp"
     FROM balances WHERE account_id = $1`,
    [Number(req.params.accountId)]
  );
  if (!result.rowCount) return res.status(404).json({ error: "لا توجد بيانات رصيد لهذا الحساب." });
  res.json(result.rows[0]);
}));

app.post("/api/charge", authRequired, asyncRoute(async (req, res) => {
  const accountId = req.body?.accountId;
  const amount = Number(req.body?.amount);

  if (!(await userOwnsAccount(req.userId, accountId))) {
    return res.status(404).json({ error: "الحساب غير موجود." });
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    return res.status(400).json({ error: "المبلغ يجب أن يكون رقمًا أكبر من صفر." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const balanceResult = await client.query(
      `SELECT amount::float AS amount, daily_avg::float AS "dailyAvg" FROM balances WHERE account_id = $1 FOR UPDATE`,
      [Number(accountId)]
    );
    if (!balanceResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "لا توجد بيانات رصيد لهذا الحساب." });
    }

    const current = balanceResult.rows[0];
    const newAmount = Number((current.amount + amount).toFixed(2));
    const dailyAvg = current.dailyAvg > 0 ? current.dailyAvg : 5.0;
    const daysLeft = Math.round(newAmount / dailyAvg);

    await client.query(
      `UPDATE balances SET amount=$1, daily_avg=$2, days_left=$3, last_top_up='الآن' WHERE account_id=$4`,
      [newAmount, dailyAvg, daysLeft, Number(accountId)]
    );
    const transaction = await client.query(
      `INSERT INTO transactions (account_id, type, label, amount, sign)
       VALUES ($1, 'topup', 'شحن رصيد', $2, '+')
       RETURNING id`,
      [Number(accountId), amount]
    );
    await client.query("COMMIT");

    res.json({
      balance: { amount: newAmount, dailyAvg, daysLeft, lastTopUp: "الآن" },
      receiptId: `R${transaction.rows[0].id}`
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}));

// ---------- consumption ----------
app.get("/api/consumption/:accountId", authRequired, asyncRoute(async (req, res) => {
  if (!(await userOwnsAccount(req.userId, req.params.accountId))) {
    return res.status(404).json({ error: "الحساب غير موجود." });
  }
  const result = await pool.query(
    `SELECT last_7_days AS "last7Days", daily_avg_ld::float AS "dailyAvgLD",
            month_total::float AS "monthTotal", month_change_pct::float AS "monthChangePct",
            last_reading AS "lastReading", monthly_history AS "monthlyHistory"
     FROM consumption WHERE account_id = $1`,
    [Number(req.params.accountId)]
  );
  if (!result.rowCount) return res.status(404).json({ error: "لا توجد بيانات استهلاك لهذا الحساب." });
  res.json(result.rows[0]);
}));

// ---------- transactions / log ----------
app.get("/api/transactions/:accountId", authRequired, asyncRoute(async (req, res) => {
  if (!(await userOwnsAccount(req.userId, req.params.accountId))) {
    return res.status(404).json({ error: "الحساب غير موجود." });
  }
  const result = await pool.query(
    `SELECT id, type, label,
            CASE WHEN occurred_at::date = CURRENT_DATE THEN 'اليوم، ' || TO_CHAR(occurred_at, 'HH12:MI AM') ELSE TO_CHAR(occurred_at, 'DD Mon YYYY') END AS "when",
            amount::float AS amount, sign
     FROM transactions WHERE account_id = $1 ORDER BY occurred_at DESC`,
    [Number(req.params.accountId)]
  );
  res.json(result.rows);
}));

// ---------- notifications ----------
app.get("/api/notifications", authRequired, asyncRoute(async (req, res) => {
  const [list, settings] = await Promise.all([
    pool.query(
      `SELECT id, icon, title, body,
              CASE WHEN occurred_at::date = CURRENT_DATE THEN 'اليوم' ELSE TO_CHAR(occurred_at, 'DD Mon YYYY') END AS "when"
       FROM notifications WHERE user_id = $1 ORDER BY occurred_at DESC LIMIT 50`,
      [req.userId]
    ),
    pool.query(
      `SELECT low_balance AS "lowBalance", invoice_due AS "invoiceDue", usage_spike AS "usageSpike", weekly_summary AS "weeklySummary"
       FROM notification_settings WHERE user_id = $1`,
      [req.userId]
    )
  ]);
  res.json({ list: list.rows, settings: settings.rows[0] || { lowBalance: true, invoiceDue: true, usageSpike: true, weeklySummary: false } });
}));

app.put("/api/notifications/settings", authRequired, asyncRoute(async (req, res) => {
  const result = await pool.query(
    `INSERT INTO notification_settings (user_id, low_balance, invoice_due, usage_spike, weekly_summary)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       low_balance=EXCLUDED.low_balance,
       invoice_due=EXCLUDED.invoice_due,
       usage_spike=EXCLUDED.usage_spike,
       weekly_summary=EXCLUDED.weekly_summary
     RETURNING low_balance AS "lowBalance", invoice_due AS "invoiceDue",
               usage_spike AS "usageSpike", weekly_summary AS "weeklySummary"`,
    [req.userId, Boolean(req.body?.lowBalance), Boolean(req.body?.invoiceDue), Boolean(req.body?.usageSpike), Boolean(req.body?.weeklySummary)]
  );
  res.json(result.rows[0]);
}));

// ---------- invoice ----------
app.get("/api/invoice/:accountId", authRequired, asyncRoute(async (req, res) => {
  if (!(await userOwnsAccount(req.userId, req.params.accountId))) {
    return res.status(404).json({ error: "الحساب غير موجود." });
  }
  const result = await pool.query(
    `SELECT period, amount::float AS amount, issue_date AS "issueDate", due_date AS "dueDate",
            days_until_due AS "daysUntilDue", reading, history
     FROM invoices WHERE account_id = $1`,
    [Number(req.params.accountId)]
  );
  if (!result.rowCount) return res.status(404).json({ error: "لا توجد فاتورة لهذا الحساب." });
  const row = result.rows[0];
  res.json({ ...row, reading: row.reading || {}, history: row.history || [] });
}));

app.post("/api/invoice/:accountId/pay", authRequired, asyncRoute(async (req, res) => {
  const accountId = Number(req.params.accountId);
  if (!(await userOwnsAccount(req.userId, accountId))) {
    return res.status(404).json({ error: "الحساب غير موجود." });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(`SELECT * FROM invoices WHERE account_id = $1 FOR UPDATE`, [accountId]);
    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "لا توجد فاتورة لهذا الحساب." });
    }
    const invoice = result.rows[0];
    const history = Array.isArray(invoice.history) ? invoice.history : [];
    history.unshift({
      month: invoice.period,
      kwh: invoice.reading?.usageKwh || 0,
      amount: Number(invoice.amount),
      status: "paid"
    });
    await client.query(`UPDATE invoices SET history=$1::jsonb, amount=0, days_until_due=0 WHERE account_id=$2`, [JSON.stringify(history), accountId]);
    await client.query(
      `INSERT INTO transactions (account_id, type, label, amount, sign) VALUES ($1, 'invoice', 'دفع فاتورة', $2, '-')`,
      [accountId, Number(invoice.amount)]
    );
    await client.query("COMMIT");
    res.json({ success: true, receiptId: `R${Date.now()}` });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}));

// ---------- support ----------
app.get("/api/support/faq", authRequired, asyncRoute(async (_req, res) => {
  res.json([
    {
      q: "لماذا لم يتحدث رصيدي بعد الشحن؟",
      a: "قد يستغرق تحديث الرصيد بضع دقائق حتى تصل العملية إلى الجهة المعنية. إذا استمر التأخير، افتح تذكرة دعم."
    },
    {
      q: "كيف أغيّر نوع خدمتي من فاتورة إلى شحن مسبق؟",
      a: "من شاشة العدادات والحسابات، اختر العداد ثم حدّث نوع الخدمة، وفق الصلاحيات المتاحة للحساب."
    },
    {
      q: "لماذا استهلاكي المعروض تقديري أحيانًا؟",
      a: "يتم عرض القيم التقديرية عند عدم توفر قراءة حديثة، إلى حين وصول قراءة جديدة من المصدر."
    }
  ]);
}));

app.post("/api/support/ticket", authRequired, asyncRoute(async (req, res) => {
  const subject = text(req.body?.subject);
  const message = text(req.body?.message);
  if (!subject || !message) {
    return res.status(400).json({ error: "يرجى إدخال عنوان المشكلة وتفاصيلها." });
  }
  if (subject.length < 3 || subject.length > 180) {
    return res.status(400).json({ error: "عنوان المشكلة غير صالح." });
  }
  if (message.length < 5 || message.length > 5000) {
    return res.status(400).json({ error: "تفاصيل المشكلة غير صالحة." });
  }
  const result = await pool.query(
    `INSERT INTO support_tickets (user_id, subject, message) VALUES ($1, $2, $3) RETURNING id, status`,
    [req.userId, subject, message]
  );
  res.status(201).json({ ticketId: `TCK-${result.rows[0].id}`, status: result.rows[0].status });
}));

// ---------- 404 + central error handler ----------
app.use((req, res) => {
  res.status(404).json({ error: "المسار المطلوب غير موجود." });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack || err);
  if (err.code === "23503") {
    return res.status(400).json({ error: "البيانات المرتبطة بالحساب غير صالحة." });
  }
  res.status(500).json({ error: "حدث خطأ داخلي في الخادم. حاول مرة أخرى." });
});

const server = app.listen(PORT, () => {
  console.log(`KahrabaPay API listening on http://localhost:${PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal}: shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
