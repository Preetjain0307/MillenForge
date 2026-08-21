/**
 * NmUploadArea — Drag-and-drop wireframe upload area (Task 2 complete)
 *
 * Supports:
 *  - Drag-and-drop or click-to-browse
 *  - PNG / JPG / JPEG / WEBP only
 *  - Local image preview
 *  - Remove / replace file
 *  - Uploading / success / error visual states (driven by props)
 *  - Prevents unsupported types (client-side guard, server also validates)
 *  - Single file only
 */
import { useRef, useState } from 'react';

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp';
const ACCEPTED_LABEL = 'JPG, JPEG, PNG, WEBP — up to 10 MB';

/**
 * @param {object}   props
 * @param {function} props.onFileSelect   - Called with a File when user picks a valid image
 * @param {function} props.onRemove       - Called when user clicks the remove (×) button
 * @param {File|null} [props.file]        - Currently selected File (controlled)
 * @param {'idle'|'uploading'|'success'|'error'} [props.uploadStatus]
 * @param {string}   [props.uploadError]  - Error message to display
 * @param {string}   [props.className]
 */
const NmUploadArea = ({
  onFileSelect,
  onRemove,
  file = null,
  uploadStatus = 'idle',
  uploadError = null,
  className = '',
}) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [typeError, setTypeError] = useState(null);

  const isUploading = uploadStatus === 'uploading';
  const isSuccess   = uploadStatus === 'success';

  const validateAndSelect = (incoming) => {
    if (!incoming) return;
    setTypeError(null);
    if (!ACCEPTED_MIME_TYPES.includes(incoming.type)) {
      setTypeError(`"${incoming.name}" is not supported. Please use JPG, JPEG, PNG, or WEBP.`);
      return;
    }
    onFileSelect(incoming);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (isUploading) return;
    validateAndSelect(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isUploading) setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleInputChange = (e) => {
    validateAndSelect(e.target.files[0]);
    // Reset so the same file can be re-selected after removal
    e.target.value = '';
  };

  const handleAreaClick = () => {
    if (!isUploading) inputRef.current?.click();
  };

  const handleRemove = (e) => {
    e.stopPropagation(); // don't re-open file picker
    setTypeError(null);
    onRemove();
  };

  // Determine border / background colour from state
  const areaStyle = (() => {
    if (isSuccess) return 'border-[var(--nm-success)] bg-[rgba(34,197,94,0.05)]';
    if (uploadStatus === 'error') return 'border-[var(--nm-error)] bg-[rgba(239,68,68,0.05)]';
    if (dragging) return 'border-[var(--nm-accent)] bg-[var(--nm-accent-glow)] scale-[1.01]';
    return 'border-[var(--nm-border)] bg-[var(--nm-bg-surface)] hover:border-[var(--nm-accent)] hover:bg-[rgba(108,99,255,0.05)]';
  })();

  const localPreview = file ? URL.createObjectURL(file) : null;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* ── Drop zone ─────────────────────────────────────────────────────── */}
      <div
        id="wireframe-upload-zone"
        role="button"
        tabIndex={isUploading ? -1 : 0}
        aria-label="Wireframe upload area"
        onClick={handleAreaClick}
        onKeyDown={(e) => e.key === 'Enter' && handleAreaClick()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative flex flex-col items-center justify-center gap-3
          rounded-[var(--nm-radius)] border-2 border-dashed
          min-h-[200px] transition-all duration-200
          ${isUploading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer select-none'}
          ${areaStyle}
        `}
      >
        <input
          ref={inputRef}
          id="wireframe-file-input"
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
          aria-hidden="true"
        />

        {/* ── Remove button (shown when file is selected) ── */}
        {file && !isUploading && (
          <button
            id="wireframe-remove-btn"
            type="button"
            onClick={handleRemove}
            aria-label="Remove wireframe"
            className="
              absolute top-2 right-2 z-10
              w-7 h-7 rounded-full
              bg-[var(--nm-bg-primary)] border border-[var(--nm-border)]
              flex items-center justify-center
              text-[var(--nm-text-secondary)] hover:text-[var(--nm-error)]
              hover:border-[var(--nm-error)]
              transition-colors duration-150
            "
          >
            <i className="pi pi-times text-xs" />
          </button>
        )}

        {/* ── Content area ── */}
        {isUploading ? (
          /* Uploading state */
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-10 h-10 border-2 border-[var(--nm-accent)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--nm-text-secondary)]">Uploading wireframe…</p>
          </div>
        ) : isSuccess ? (
          /* Success state — show server-confirmed preview */
          <div className="relative w-full flex flex-col items-center gap-2 p-4">
            {localPreview && (
              <img
                src={localPreview}
                alt="Wireframe preview"
                className="max-h-[150px] max-w-full object-contain rounded-[var(--nm-radius-sm)]"
              />
            )}
            <div className="flex items-center gap-1.5 text-xs text-[var(--nm-success)]">
              <i className="pi pi-check-circle" />
              <span>Uploaded successfully — click to replace</span>
            </div>
          </div>
        ) : file ? (
          /* File selected but not yet uploaded */
          <div className="relative w-full flex flex-col items-center gap-2 p-4">
            <img
              src={localPreview}
              alt="Wireframe preview"
              className="max-h-[150px] max-w-full object-contain rounded-[var(--nm-radius-sm)]"
            />
            <p className="text-xs text-[var(--nm-text-muted)]">
              Click elsewhere to replace · ✕ to remove
            </p>
          </div>
        ) : (
          /* Empty / idle state */
          <>
            <div className="w-12 h-12 rounded-full bg-[var(--nm-bg-card)] border border-[var(--nm-border)] flex items-center justify-center">
              <i className="pi pi-image text-[var(--nm-accent)] text-xl" />
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-medium text-[var(--nm-text-primary)]">
                Drop wireframe here
              </p>
              <p className="text-xs text-[var(--nm-text-muted)] mt-0.5">
                or click to browse — {ACCEPTED_LABEL}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Validation error (client-side type check) ── */}
      {typeError && (
        <p id="wireframe-type-error" role="alert" className="text-xs text-[var(--nm-error)] flex items-center gap-1">
          <i className="pi pi-exclamation-circle" />
          {typeError}
        </p>
      )}

      {/* ── Upload error (from server) ── */}
      {uploadStatus === 'error' && uploadError && (
        <p id="wireframe-upload-error" role="alert" className="text-xs text-[var(--nm-error)] flex items-center gap-1">
          <i className="pi pi-exclamation-triangle" />
          {uploadError}
        </p>
      )}
    </div>
  );
};

export default NmUploadArea;
