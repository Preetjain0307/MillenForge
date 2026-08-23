/**
 * NmButton — Primary reusable button
 * Uses PrimeReact's Button as the CTA variant; plain styled button otherwise.
 */
import { Button } from 'primereact/button';

/**
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'} [props.variant='primary']
 * @param {string} [props.label]
 * @param {string} [props.icon]        - PrimeIcons class e.g. "pi pi-sparkles"
 * @param {boolean} [props.loading]
 * @param {boolean} [props.disabled]
 * @param {'button'|'submit'|'reset'} [props.type='button']
 * @param {function} [props.onClick]
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.children]
 */
const NmButton = ({
  variant = 'primary',
  label,
  icon,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  children,
  ...rest
}) => {
  // Map variants to PrimeReact severity / custom styles
  const severityMap = {
    primary: undefined,       // PrimeReact default (accent color)
    secondary: 'secondary',
    ghost: 'text',
    danger: 'danger',
  };

  // Determine dynamic custom button color overrides (red, gold, blue, green, etc.)
  let customColorClass = '';
  const btnColor = (rest.buttonColor || rest.color || '').toString().toLowerCase();

  if (btnColor === 'red') {
    customColorClass = '!bg-red-600 hover:!bg-red-700 !text-white !border-red-600 shadow-red-500/30';
  } else if (btnColor === 'gold') {
    customColorClass = '!bg-amber-400 hover:!bg-amber-500 !text-slate-950 font-bold !border-amber-400 shadow-amber-500/30';
  } else if (btnColor === 'blue') {
    customColorClass = '!bg-blue-600 hover:!bg-blue-700 !text-white !border-blue-600 shadow-blue-500/30';
  } else if (btnColor === 'green') {
    customColorClass = '!bg-emerald-600 hover:!bg-emerald-700 !text-white !border-emerald-600 shadow-emerald-500/30';
  } else if (btnColor === 'black') {
    customColorClass = '!bg-slate-950 hover:!bg-slate-900 !text-white !border-slate-800 shadow-slate-900/30';
  } else if (btnColor === 'white') {
    customColorClass = '!bg-white hover:!bg-slate-100 !text-slate-900 !border-slate-300 shadow-slate-300/30';
  }

  // Compute inline style tokens for primary buttons
  const dynamicBtnStyle = variant === 'primary' ? {
    backgroundColor: 'var(--primary)',
    color: 'var(--primary-text)',
    borderColor: 'var(--border)',
    ...(rest.style || {}),
  } : (rest.style || {});

  return (
    <Button
      label={label || (typeof children === 'string' ? children : undefined)}
      icon={icon}
      loading={loading}
      disabled={disabled}
      type={type}
      severity={severityMap[variant]}
      onClick={onClick}
      style={dynamicBtnStyle}
      className={`nm-btn nm-btn--${variant} ${customColorClass} ${className}`}
      {...rest}
    >
      {typeof children !== 'string' ? children : null}
    </Button>
  );
};

export default NmButton;
