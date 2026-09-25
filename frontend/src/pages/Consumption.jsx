import { useEffect, useState } from "react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import Icon from "../components/Icon";

const DAYS = ["س", "ج", "ح", "خ", "ج", "س", "أ"];

export default function Consumption() {
  const { activeAccountId } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!activeAccountId) return;
    let mounted = true;
    api.getConsumption(activeAccountId)
      .then((d) => mounted && setData(d))
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [activeAccountId]);

  if (loading) return <div className="center-loading">جارٍ تحميل بيانات الاستهلاك...</div>;
  if (error) return <div className="error-box" role="alert"><Icon name="circle-exclamation" /> {error}</div>;
  if (!data) return null;

  const maxBar = Math.max(...data.last7Days, 1);

  return (
    <>
      <div className="eyebrow">الاستهلاك</div>
      <div className="h1">استهلاكك حسب بيانات الشركة</div>
      <div className="sub">تعرض هذه الصفحة آخر البيانات المتاحة لحسابك.</div>

      <div className="chart-card">
        <div className="chart-title">استهلاك آخر 7 أيام (كيلوواط/ساعة)</div>
        <div className="bars">
          {data.last7Days.map((v, i) => (
            <div className="bar-wrap" key={i}>
              <div className={"bar" + (i === data.last7Days.length - 1 ? " today" : "")} style={{ height: `${(v / maxBar) * 118}px` }} />
              <div className="day">{DAYS[i]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-box"><div className="lbl">معدل الاستهلاك</div><div className="val">{data.dailyAvgLD} د.ل / يوم</div></div>
        <div className="stat-box"><div className="lbl">هذا الشهر</div><div className="val">{data.monthTotal} د.ل</div><div className="tag">↑ {data.monthChangePct}% عن الشهر الماضي</div></div>
      </div>

      <div className="section-title">قراءة العداد الأخيرة</div>
      <div className="reading-card">
        <div className="top"><div className="ic"><Icon name="building" /></div><b>آخر قراءة مسجلة</b></div>
        <div className="reading-grid">
          <div className="cell"><div className="k">القراءة السابقة</div><div className="v">{data.lastReading.previous.toLocaleString()} ك.و.س</div></div>
          <div className="cell"><div className="k">القراءة الحالية</div><div className="v">{data.lastReading.current.toLocaleString()} ك.و.س</div></div>
          <div className="cell"><div className="k">الاستهلاك</div><div className="v">{data.lastReading.usageKwh} ك.و.س</div></div>
          <div className="cell"><div className="k">الفئة والتعريفة</div><div className="v">{data.lastReading.category}</div></div>
        </div>
      </div>

      <div className="note-box"><b>ملاحظة</b> — قد تكون القيم اليومية تقديرية عند عدم توفر قراءة حديثة، إلى حين وصول قراءة جديدة.</div>

      <div className="section-title">سجل القراءات الشهرية</div>
      {data.monthlyHistory.length === 0 && <div className="note-box">لا يوجد سجل قراءات بعد.</div>}
      {data.monthlyHistory.map((m) => (
        <div className="list-row" key={m.month}>
          <div className="left"><div className="ic" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}><Icon name="calendar-days" /></div><div className="meta"><b>{m.month}</b><small>{m.kwh} ك.و.س</small></div></div>
          <div className="amt neg">{Number(m.amount).toFixed(2)} د.ل</div>
        </div>
      ))}
    </>
  );
}
