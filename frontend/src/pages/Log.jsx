import { useEffect, useState } from "react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import Icon from "../components/Icon";

const ICONS = {
  topup: { bg: "var(--green-soft)", color: "var(--green)", icon: "bolt" },
  invoice: { bg: "var(--blue-soft)", color: "var(--blue)", icon: "file-invoice" },
  failed: { bg: "var(--red-soft)", color: "var(--red)", icon: "triangle-exclamation" }
};

export default function Log() {
  const { activeAccountId } = useApp();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!activeAccountId) return;
    let mounted = true;
    api.getTransactions(activeAccountId)
      .then((tx) => mounted && setTransactions(tx))
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [activeAccountId]);

  return (
    <>
      <div className="eyebrow">السجل</div>
      <div className="h1">جميع عملياتك في مكان واحد</div>
      <div className="sub">الشحنات والفواتير والمدفوعات المرتبطة بحسابك.</div>
      {loading && <div className="center-loading">جارٍ التحميل...</div>}
      {error && <div className="error-box" role="alert"><Icon name="circle-exclamation" /> {error}</div>}
      {!loading && !error && transactions.length === 0 && <div className="note-box">لا توجد عمليات مسجلة بعد.</div>}
      {transactions.map((tx) => {
        const style = ICONS[tx.type] || ICONS.topup;
        return <div className="list-row" key={tx.id}><div className="left"><div className="ic" style={{ background: style.bg, color: style.color }}><Icon name={style.icon} /></div><div className="meta"><b>{tx.label}</b><small>{tx.when}</small></div></div><div className={"amt " + (tx.sign === "+" ? "pos" : "neg")}>{tx.sign}{tx.amount != null ? Number(tx.amount).toFixed(2) + " د.ل" : "—"}</div></div>;
      })}
      <div className="section-title">الإيصالات</div>
      <div className="list-row"><div className="left"><div className="ic" style={{ background: "var(--surface-2)", color: "var(--text-dim)" }}><Icon name="file-lines" /></div><div className="meta"><b>الإيصالات</b><small>ستظهر هنا العمليات التي تنشئ إيصالًا.</small></div></div><div className="amt" style={{ color: "var(--blue)" }}>متاح</div></div>
    </>
  );
}
