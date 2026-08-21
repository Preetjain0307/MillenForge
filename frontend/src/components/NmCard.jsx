/**
 * NmCard — Reusable card/container component
 */

/**
 * @param {object} props
 * @param {string} [props.title]
 * @param {string} [props.subtitle]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
const NmCard = ({ title, subtitle, className = '', children }) => {
  return (
    <div className={`nm-card p-6 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-[var(--nm-text-primary)] mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-[var(--nm-text-secondary)]">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default NmCard;
