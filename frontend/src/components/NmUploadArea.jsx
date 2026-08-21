/**
 * NmUploadArea — Drag-and-drop wireframe upload area
 */
import { useRef, useState } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg';

/**
 * @param {object} props
 * @param {function} props.onFileSelect  - Called with a File object when user selects/drops an image
 * @param {File|null} [props.file]       - Currently selected file (controlled)
 * @param {string} [props.className]
 * @param {boolean} [props.disabled]
 */
const NmUploadArea = ({ onFileSelect, file = null, className = '', disabled = false }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files[0];
    if (dropped && ACCEPTED_TYPES.includes(dropped.type)) {
      onFileSelect(dropped);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleInputChange = (e) => {
    const selected = e.target.files[0];
    if (selected) onFileSelect(selected);
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const preview = file ? URL.createObjectURL(file) : null;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Wireframe upload area"
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative flex flex-col items-center justify-center gap-3
        rounded-[var(--nm-radius)] border-2 border-dashed
        min-h-[180px] cursor-pointer select-none
        transition-all duration-200
        ${dragging
          ? 'border-[var(--nm-accent)] bg-[var(--nm-accent-glow)] scale-[1.01]'
          : 'border-[var(--nm-border)] bg-[var(--nm-bg-surface)] hover:border-[var(--nm-accent)] hover:bg-[rgba(108,99,255,0.05)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
      />

      {preview ? (
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img
            src={preview}
            alt="Wireframe preview"
            className="max-h-[140px] max-w-full object-contain rounded-[var(--nm-radius-sm)]"
          />
          <div className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-xs text-[var(--nm-text-secondary)] bg-black/60 px-2 py-1 rounded">
              Click to change
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-[var(--nm-bg-card)] border border-[var(--nm-border)] flex items-center justify-center">
            <i className="pi pi-image text-[var(--nm-accent)] text-xl" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--nm-text-primary)]">
              Drop wireframe here
            </p>
            <p className="text-xs text-[var(--nm-text-muted)] mt-0.5">
              or click to browse — JPG, PNG, SVG, GIF, WEBP up to 10 MB
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default NmUploadArea;
