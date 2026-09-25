import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import Icon from "../components/Icon";

export default function Home() {
  const navigate = useNavigate();
  const { activeAccountId, user } = useApp();
  const [accounts, setAccounts] = useState([]);
  const [balance, setBalance] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!activeAccountId) return;
    let mounted = true;
    setLoading(true);
    setBalance(null);
    setInvoice(null);

    api
      .getAccounts()
      .then((accs) => {
        if (!mounted) return null;
        setAccounts(accs);
        const acc = accs.find((a) => a.id === activeAccountId);
        // نوع الخدمة يحدد أي بيانات نطلبها: فاتورة شهرية أم رصيد شحن مسبق.
        const detail =
          acc?.serviceType === "invoice"
            ? api.getInvoice(activeAccountId).then((inv) => ({ invoice: inv, balance: null }))
            : api.getBalance(activeAccountId).then((bal) => ({ invoice: null, balance: bal }));
        return Promise.all([detail, api.getTransactions(activeAccountId)]);
      })
      .then((result) => {
        if (!mounted || !result) return;
        const [detail, tx] = result;
        setBalance(detail.balance);
        setInvoice(detail.invoice);
        setTransactions(tx);
        setError("");
      })
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [activeAccountId]);

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const isInvoice = activeAccount?.serviceType === "invoice";

  if (!activeAccountId || loading) return <div className="center-loading">جارٍ تحميل بياناتك...</div>;
  if (error) return <div className="error-box" role="alert"><Icon name="circle-exclamation" /> {error}</div>;

  return (
    <>
      <div className="eyebrow">مرحبًا {user?.name || "بك"}</div>
      <div className="h1">ملخص حسابك</div>
      <div className="sub">
        {isInvoice ? "فاتورتك الشهرية وعملياتك في شاشة واحدة." : "الرصيد والاستهلاك والعمليات في شاشة واحدة."}
      </div>

      <div className="gecol-strip">
        <div className="ic"><Icon name="building" /></div>
        <div className="t"><b>الحساب المرتبط بالخدمة</b>نقطة الخدمة #{activeAccount?.meterNumber || "—"} · {activeAccount?.category || "—"}</div>
        <div className="tag"><Icon name="circle-check" /> متصل</div>
      </div>

      {/* حساب فاتورة شهرية: نعرض المبلغ المستحق وموعد الاستحقاق بدل بطاقة رصيد الشحن المسبق. */}
      {isInvoice && invoice && (
        <div className="balance-card">
          <div className="balance-label">المبلغ المستحق</div>
          <div className="balance-amount">{Number(invoice.amount).toFixed(2)}<span>د.ل</span></div>
          {Number(invoice.amount) > 0 && (
            <div className="balance-pill" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}>
              <Icon name="clock" /> الاستحقاق خلال {invoice.daysUntilDue} أيام
            </div>
          )}
          <div className="balance-meta">
            <div>فترة الفاتورة<b>{invoice.period}</b></div>
            <div>تاريخ الاستحقاق<b>{invoice.dueDate}</b></div>
          </div>
          <button className="btn-primary" onClick={() => navigate("/profile/invoice")}>
            <Icon name="file-invoice" /> {Number(invoice.amount) > 0 ? "عرض الفاتورة ودفعها" : "عرض تفاصيل الفاتورة"}
          </button>
        </div>
      )}

      {!isInvoice && balance && (
        <div className="balance-card">
          <div className="balance-label">رصيد الكهرباء</div>
          <div className="balance-amount">{balance.amount.toFixed(2)}<span>د.ل</span></div>
          <div className="balance-pill"><Icon name="circle-check" /> يكفي تقريبًا {balance.daysLeft} أيام</div>
          <div className="balance-meta">
            <div>الاستهلاك اليومي<b>{balance.dailyAvg} د.ل</b></div>
            <div>آخر شحنة<b>{balance.lastTopUp}</b></div>
          </div>
          <button className="btn-primary" onClick={() => navigate("/charge")}><Icon name="bolt" /> اشحن الآن</button>
        </div>
      )}

      {!isInvoice && balance && balance.daysLeft <= 7 && (
        <div className="alert-banner">
          <div className="dot"><Icon name="clock" /></div>
          <div className="txt"><b>قرب نفاد الرصيد</b>الاستهلاك الحالي قد يستنفد الرصيد خلال أيام قليلة.</div>
        </div>
      )}

      {isInvoice && invoice && Number(invoice.amount) > 0 && invoice.daysUntilDue <= 3 && (
        <div className="alert-banner">
          <div className="dot"><Icon name="clock" /></div>
          <div className="txt"><b>اقتراب موعد استحقاق الفاتورة</b>يستحق سداد الفاتورة خلال أيام قليلة.</div>
        </div>
      )}

      <div className="quick-grid">
        {isInvoice ? (
          <>
            <div className="quick-card"><span className="ic"><Icon name="chart-column" /></span><div className="lbl">استهلاك الفترة</div><div className="val">{invoice?.reading?.usageKwh || 0} ك.و.س</div></div>
            <div className="quick-card amber"><span className="ic"><Icon name="file-invoice" /></span><div className="lbl">موعد الاستحقاق</div><div className="val">{invoice?.dueDate || "—"}</div></div>
          </>
        ) : (
          <>
            <div className="quick-card"><span className="ic"><Icon name="chart-column" /></span><div className="lbl">استهلاك اليوم</div><div className="val">{balance?.dailyAvg} د.ل</div></div>
            <div className="quick-card amber"><span className="ic"><Icon name="file-invoice" /></span><div className="lbl">هذا الشهر</div><div className="val">متابعة الرصيد</div></div>
          </>
        )}
      </div>

      <div className="section-title">آخر العمليات <span onClick={() => navigate("/log")}>عرض الكل ‹</span></div>
      {transactions.length === 0 && <div className="note-box">لا توجد عمليات مسجلة بعد.</div>}
      {transactions.slice(0, 2).map((tx) => (
        <div className="list-row" key={tx.id}>
          <div className="left">
            <div className="ic" style={{ background: tx.type === "topup" ? "var(--green-soft)" : "var(--blue-soft)", color: tx.type === "topup" ? "var(--green)" : "var(--blue)" }}>
              <Icon name={tx.type === "topup" ? "bolt" : "plug"} />
            </div>
            <div className="meta"><b>{tx.label}</b><small>{tx.when}</small></div>
          </div>
          <div className={"amt " + (tx.sign === "+" ? "pos" : "neg")}>{tx.sign}{tx.amount != null ? Number(tx.amount).toFixed(2) : "—"} د.ل</div>
        </div>
      ))}
    </>
  );
}

