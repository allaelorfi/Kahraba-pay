import { NavLink } from "react-router-dom";

const tabs = [
  {
    to: "/",
    icon: "fa-solid fa-house",
    label: "الرئيسية",
    end: true
  },
  {
    to: "/usage",
    icon: "fa-solid fa-chart-line",
    label: "الاستهلاك"
  },
  {
    to: "/charge",
    icon: "fa-solid fa-bolt",
    label: "الشحن"
  },
  {
    to: "/notifications",
    icon: "fa-solid fa-bell",
    label: "التنبيهات"
  },
  {
    to: "/log",
    icon: "fa-solid fa-receipt",
    label: "السجل"
  }
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `nav-btn ${isActive ? "active" : ""}`
          }
        >
          <i className={`${tab.icon} ic`}></i>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}