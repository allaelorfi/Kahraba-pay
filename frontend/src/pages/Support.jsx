import { useEffect, useState } from "react";
import SubHeader from "../components/SubHeader";
import { api } from "../api";
import Icon from "../components/Icon";

export default function Support() {
  const [faq, setFaq] = useState([]);
  const [showTicket, setShowTicket] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { api.getFaq().then(setFaq).catch((err) => setError(err.message)); }, []);

  async function submitTicket() {
    setError("");
    setTicket(null);
    if (!subject.trim() || !message.trim()) return setError("يرجى إدخال عنوان المشكلة وتفاصيلها.");
    try {
      const res = await api.openTicket(subject, message);
      setTicket(res); setSubject(""); setMessage("");
    } catch (err) { setError(err.message); }
  }

  return (
    <>
      <SubHeader title="الدعم والمساعدة" />
      <div className="h1">كيف يمكننا مساعدتك؟</div>
      <div className="sub">تواصل مع الدعم أو راجع الأسئلة الشائعة.</div>

      <div className="list-row"><div className="left"><div className="ic" style={{ background: "var(--blue-soft)", color: "var(--blue)" }}><Icon name="phone" /></div><div className="meta"><b>الاتصال بالدعم</b><small>يوميًا من 8 صباحًا إلى 10 مساءً</small></div></div><div className="amt" style={{ color: "var(--blue)" }}>اتصال</div></div>
      <div className="list-row"><div className="left"><div className="ic" style={{ background: "var(--green-soft)", color: "var(--green)" }}><Icon name="comment" /></div><div className="meta"><b>المراسلة</b><small>للاستفسارات ومتابعة الطلبات</small></div></div><div className="amt" style={{ color: "var(--green)" }}>فتح</div></div>
      <button className="list-row menu-button" onClick={() => { setShowTicket((v) => !v); setError(""); }}><div className="left"><div className="ic" style={{ background: "var(--purple-soft)", color: "var(--purple)" }}><Icon name="headset" /></div><div className="meta"><b>فتح تذكرة دعم</b><small>لمشكلات الدفع أو الحساب</small></div></div><span className="chev">{showTicket ? "⌃" : "‹"}</span></button>

      {showTicket && (
        <div className="ticket-box">
          <div className="input-group"><label htmlFor="subject">عنوان المشكلة</label><input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="مثال: مشكلة في الشحن" /></div>
          <div className="input-group"><label htmlFor="message">تفاصيل المشكلة</label><textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="اشرح المشكلة بإيجاز" rows={5} /></div>
          <button className="btn-primary" onClick={submitTicket}>إرسال التذكرة</button>
          {ticket && <div className="confirm-box"><div className="big"><Icon name="circle-check" /> تم إنشاء التذكرة</div><div className="small">رقم التذكرة {ticket.ticketId} — الحالة: {ticket.status}</div></div>}
        </div>
      )}

      {error && <div className="error-box" role="alert"><Icon name="circle-exclamation" /> {error}</div>}
      <div className="section-title">الأسئلة الشائعة</div>
      {faq.map((item) => <div className="faq-row" key={item.q}><b>{item.q}</b><p>{item.a}</p></div>)}
    </>
  );
}
