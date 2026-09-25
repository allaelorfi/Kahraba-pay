import { useEffect, useState } from "react";
import SubHeader from "../components/SubHeader";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import Icon from "../components/Icon";

export default function Invoice() {
  const { activeAccountId } = useApp();
  const [accounts, setAccounts] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getAccounts().then(setAccounts).catch((err) => setError(err.message));
  }, []);

  const invoiceAccount = accounts.find((a) => a.id === activeAccountId && a.serviceType === "invoice")
    || accounts.find((a) => a.serviceType === "invoice");

  useEffect(() => {
    if (!invoiceAccount) return;
    setError("");
    api.getInvoice(invoiceAccount.id).then(setInvoice).catch((err) => setError(err.message));
  }, [invoiceAccount?.id]);

  async function handlePay() {
    setPaying(true);
    setError("");
    try {
      await api.payInvoice(invoiceAccount.id);
      const updated = await api.getInvoice(invoiceAccount.id);
      setInvoice(updated);
      setPaid(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  }

  if (error && !invoice) return <><SubHeader title="الفاتورة الشهرية" /><div className="error-box" role="alert"><Icon name="circle-exclamation" /> {error}</div></>;
  if (!invoiceAccount && !error) return <><SubHeader title="الفاتورة الشهرية" /><div className="note-box">لا يوجد حساب بخدمة الفاتورة الشهرية.</div></>;
  if (!invoice) return <div className="center-loading">جارٍ تحميل الفاتورة...</div>;

  return (
    <>
      <SubHeader title="الفاتورة الشهرية" />
      <div className="h1">فاتورة {invoice.period}</div>
      <div className="sub">نقطة الخدمة #{invoiceAccount.meterNumber} — {invoiceAccount.label}.</div>

      <div className="balance-card">
        <div className="balance-label">المبلغ المستحق</div>
        <div className="balance-amount">{Number(invoice.amount).toFixed(2)}<span>د.ل</span></div>
        {Number(invoice.amount) > 0 && <div className="balance-pill" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}><Icon name="clock" /> الاستحقاق خلال {invoice.daysUntilDue} أيام</div>}
        <div className="balance-meta">
          <div>تاريخ الإصدار<b>{invoice.issueDate}</b></div>
          <div>تاريخ الاستحقاق<b>{invoice.dueDate}</b></div>
        </div>
        <button className="btn-primary" onClick={handlePay} disabled={paying || paid || Number(invoice.amount) <= 0}>
          {paid || Number(invoice.amount) <= 0 ? <><Icon name="circle-check" /> تم الدفع</> : paying ? "جارٍ الدفع..." : "دفع الفاتورة الآن"}
        </button>
      </div>

      <div className="section-title">تفاصيل القراءة</div>
      <div className="reading-card">
        <div className="top"><div className="ic"><Icon name="building" /></div><b>آخر قراءة مسجلة</b></div>
        <div className="reading-grid">
          <div className="cell"><div className="k">القراءة السابقة</div><div className="v">{Number(invoice.reading.previous || 0).toLocaleString()} ك.و.س</div></div>
          <div className="cell"><div className="k">القراءة الحالية</div><div className="v">{Number(invoice.reading.current || 0).toLocaleString()} ك.و.س</div></div>
          <div className="cell"><div className="k">الاستهلاك</div><div className="v">{invoice.reading.usageKwh || 0} ك.و.س</div></div>
          <div className="cell"><div className="k">الفئة</div><div className="v">{invoice.reading.category || invoiceAccount.category}</div></div>
        </div>
      </div>

      <div className="section-title">فواتير سابقة</div>
      {invoice.history.length === 0 && <div className="note-box">لا توجد فواتير سابقة.</div>}
      {invoice.history.map((h, i) => (
        <div className="list-row" key={i}>
          <div className="left"><div className="ic" style={{ background: h.status === "paid" ? "var(--green-soft)" : "var(--red-soft)", color: h.status === "paid" ? "var(--green)" : "var(--red)" }}><Icon name="file-invoice" /></div><div className="meta"><b>{h.month}</b><small>{h.kwh} ك.و.س</small></div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div className="amt">{Number(h.amount).toFixed(2)} د.ل</div><span className={"status-chip " + (h.status === "paid" ? "paid" : "late")}>{h.status === "paid" ? "مدفوعة" : "متأخرة"}</span></div>
        </div>
      ))}
      {error && invoice && <div className="error-box" role="alert"><Icon name="circle-exclamation" /> {error}</div>}
    </>
  );
}
