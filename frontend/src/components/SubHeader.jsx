import { useNavigate } from "react-router-dom";

export default function SubHeader({ title, backTo = "/profile" }) {
  const navigate = useNavigate();
  return (
    <div className="sub-header">
      <button className="back-btn" onClick={() => navigate(backTo)}>
        →
      </button>
      <div className="st">{title}</div>
    </div>
  );
}
