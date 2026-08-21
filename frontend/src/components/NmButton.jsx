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

  return (
    <Button
      label={label || (typeof children === 'string' ? children : undefined)}
      icon={icon}
      loading={loading}
      disabled={disabled}
      type={type}
      severity={severityMap[variant]}
      onClick={onClick}
      className={`nm-btn nm-btn--${variant} ${className}`}
      {...rest}
    >
      {typeof children !== 'string' ? children : null}
    </Button>
  );
};

export default NmButton;
