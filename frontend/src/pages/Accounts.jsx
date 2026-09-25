import { useEffect, useState } from "react";
import SubHeader from "../components/SubHeader";
import { api } from "../api";
import Icon from "../components/Icon";

function onlyDigits(value) {
  return value.replace(/[^0-9٠-٩۰-۹]/g, "");
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [error, setError] = useState("");

  function loadAccounts() {
    api.getAccounts().then(setAccounts).catch((err) => setError(err.message));
  }

  useEffect(loadAccounts, []);

  async function handleAdd() {
    setError("");
    if (!label.trim() || !meterNumber.trim()) return setError("يرجى تعبئة اسم العقار ورقم العداد.");
    if (!/^\d{4,20}$/.test(meterNumber.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))))) {
      return setError("رقم العداد أو نقطة الخدمة يجب أن يحتوي على أرقام فقط.");
    }
    try {
      await api.addAccount({ label, meterNumber });
      setLabel(""); setMeterNumber(""); setAdding(false); loadAccounts();
    } catch (err) { setError(err.message); }
  }

  return (
    <>
      <SubHeader title="العدادات والحسابات" />
      <div className="h1">إدارة عداداتك</div>
      <div className="sub">يمكنك ربط أكثر من عداد أو حساب لعقاراتك.</div>
      {accounts.map((acc) => (
        <div key={acc.id} className={"meter-card" + (acc.active ? " active" : "")}>
          <div className="top"><b>{acc.label}</b><span className={"meter-badge " + (acc.active ? "active" : "idle")}>{acc.active ? "نشط" : "غير نشط"}</span></div>
          <div className="sub2">{acc.serviceType === "invoice" ? "نقطة خدمة" : "عداد"} #{acc.meterNumber} · {acc.serviceType === "invoice" ? "فاتورة شهرية" : "شحن مسبق"} · {acc.category}</div>
        </div>
      ))}
      {!adding && <button className="add-btn" onClick={() => setAdding(true)}><Icon name="plus" /> إضافة عداد أو حساب جديد</button>}
      {adding && (
        <div style={{ marginBottom: 16 }}>
          <div className="input-group"><label htmlFor="accountLabel">اسم العقار</label><input id="accountLabel" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="مثال: شقة الإيجار" /></div>
          <div className="input-group"><label htmlFor="accountMeter">رقم العداد أو نقطة الخدمة</label><input id="accountMeter" value={meterNumber} onChange={(e) => setMeterNumber(onlyDigits(e.target.value).slice(0, 20))} placeholder="مثال: 331290" inputMode="numeric" maxLength={20} /></div>
          {error && <div className="error-box" role="alert"><Icon name="circle-exclamation" /> {error}</div>}
          <button className="btn-primary" onClick={handleAdd}><Icon name="floppy-disk" /> حفظ العداد</button>
          <button className="btn-ghost" onClick={() => { setAdding(false); setError(""); }}>إلغاء</button>
        </div>
      )}
      {!adding && error && <div className="error-box" role="alert"><Icon name="circle-exclamation" /> {error}</div>}
    </>
  );
}
