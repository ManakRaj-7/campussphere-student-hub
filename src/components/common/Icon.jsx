const Icon = ({ name, fill = 0, className = "" }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{
      fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
      verticalAlign: 'middle',
      display: 'inline-flex',
    }}
  >
    {name}
  </span>
);

export default Icon;
