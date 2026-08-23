/**
 * NmInput — Reusable text input / textarea
 */

/**
 * @param {object} props
 * @param {string} props.id
 * @param {string} [props.label]
 * @param {string} [props.placeholder]
 * @param {string} [props.value]
 * @param {function} [props.onChange]
 * @param {boolean} [props.multiline]  - Render as textarea
 * @param {number} [props.rows]        - Rows when multiline
 * @param {string} [props.className]
 * @param {boolean} [props.disabled]
 */
const NmInput = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  multiline = false,
  rows = 4,
  className = '',
  disabled = false,
  ...rest
}) => {
  const baseStyle = `
    w-full rounded-[var(--nm-radius-sm)] px-4 py-3
    bg-[var(--nm-bg-surface)] border border-[var(--nm-border-subtle)]
    text-[var(--nm-text-primary)] placeholder-[var(--nm-text-muted)]
    transition-colors duration-200
    focus:outline-none focus:border-[var(--nm-accent)] focus:ring-1 focus:ring-[var(--nm-accent)]
    disabled:opacity-50 disabled:cursor-not-allowed
    text-sm font-mono
  `;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--nm-text-secondary)]">
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={rows}
          disabled={disabled}
          className={`${baseStyle} resize-y`}
          {...rest}
        />
      ) : (
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={baseStyle}
          {...rest}
        />
      )}
    </div>
  );
};

export default NmInput;
