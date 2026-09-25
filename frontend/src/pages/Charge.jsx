import { useEffect, useState } from "react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import Icon from "../components/Icon";

const AMOUNTS = [20, 50, 100];
const METHODS = [
  { id: "card", label: "بطاقة", icon: "credit-card" },
  { id: "wallet", label: "محفظة", icon: "wallet" },
  { id: "other", label: "قناة أخرى", icon: "building-columns" }
];

export default function Charge() {
  const { activeAccountId } = useApp();
  const [amount, setAmount] = useState(50);
  const [method, setMethod] = useState("card");
  const [accounts, setAccounts] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getAccounts().then(setAccounts).catch((err) => setError(err.message));
  }, []);

  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  async function handleConfirm() {
    setError("");
    setResult(null);
    if (!activeAccountId) return setError("لا يوجد حساب نشط للشحن.");
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return setError("يرجى اختيار مبلغ صحيح.");
    setLoading(true);
    try {
      const res = await api.charge(activeAccountId, amount);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="eyebrow">الشحن والدفع</div>
      <div className="h1">شحن رصيدك</div>
      <div className="sub">اختر المبلغ وطريقة الدفع ثم أكد العملية.</div>

      <div className="section-title" style={{ marginTop: 4 }}>اختر المبلغ</div>
      <div className="amount-grid">
        {AMOUNTS.map((a) => <button type="button" key={a} className={"amount-chip" + (amount === a ? " active" : "")} onClick={() => setAmount(a)}>{a} د.ل</button>)}
      </div>

      <div className="field"><div className="k">رقم العداد</div><div className="v">{activeAccount?.meterNumber || "—"}</div></div>
      <div className="section-title" style={{ marginTop: 2 }}>طريقة الدفع</div>
      <div className="method-row">
        {METHODS.map((m) => <button type="button" key={m.id} className={"method" + (method === m.id ? " active" : "")} onClick={() => setMethod(m.id)}><span className="ic"><Icon name={m.icon} /></span>{m.label}</button>)}
      </div>

      <button className="btn-primary" onClick={handleConfirm} disabled={loading || !activeAccountId}><Icon name="bolt" /> {loading ? "جارٍ التنفيذ..." : `تأكيد الشحن بمبلغ ${amount} د.ل`}</button>
      {error && <div className="error-box" role="alert"><Icon name="circle-exclamation" /> {error}</div>}
      {result && <div className="confirm-box" style={{ marginTop: 14 }}><div className="big"><Icon name="circle-check" /> تمت العملية بنجاح</div><div className="small">الرصيد الجديد {Number(result.balance.amount).toFixed(2)} د.ل — رقم الإيصال {result.receiptId}</div></div>}
    </>
  );
}
