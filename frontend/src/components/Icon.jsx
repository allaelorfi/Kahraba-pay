export default function Icon({ name, className = "" }) {
  return <i aria-hidden="true" className={`fa-solid fa-${name} ${className}`.trim()} />;
}
