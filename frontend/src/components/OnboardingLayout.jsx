import { useNavigate } from "react-router-dom";

const TOTAL_STEPS = 5;

export default function OnboardingLayout({
  step,
  children,
  onNext,
  nextLabel = "متابعة",
  backTo,
  nextDisabled = false
}) {
  const navigate = useNavigate();

  return (
    <div className="app-shell" style={{ padding: "16px 20px 0" }}>
      <div className="content" style={{ padding: "0 0 16px", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
      <div className="ob-footer">
        <div className="ob-dots">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span key={i} className={i === step ? "on" : ""} />
          ))}
        </div>
        <button
          className="btn-primary"
          disabled={nextDisabled}
          style={nextDisabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
          onClick={onNext}
        >
          {nextLabel}
        </button>
        {backTo && (
          <button className="btn-ghost" onClick={() => navigate(backTo)}>
            رجوع
          </button>
        )}
      </div>
    </div>
  );
}
