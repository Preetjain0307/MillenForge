/**
 * NmUploadArea — Drag-and-drop wireframe upload area (Task 2 complete)
 *
 * Supports:
 *  - Drag-and-drop or click-to-browse
 *  - Clipboard paste (Ctrl+V) from anywhere in the window
 *  - File type validation (JPG, JPEG, PNG, WEBP)
 *  - Remove (x) and clear
 *  - Shows local thumbnail immediately while uploading
 *  - Server-uploaded preview confirmation
 */

import { useRef, useState, useEffect, useCallback } from 'react';

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp';
const ACCEPTED_LABEL = 'JPG, JPEG, PNG, WEBP — up to 10 MB';

/**
 * @param {object}   props
 * @param {function} props.onFileSelect   - Called with a File when user picks or pastes a valid image
 * @param {function} props.onRemove       - Called when user clicks the remove (x) button
 * @param {File|null} [props.file]        - Currently selected File (controlled)
 * @param {'idle'|'uploading'|'success'|'error'} [props.uploadStatus]
 * @param {string}   [props.uploadError]  - Error message to display
 * @param {string}   [props.className]
 */
const NmUploadArea = ({
  onFileSelect,
  onRemove,
  file,
  uploadStatus = 'idle',
  uploadError,
  className = '',
}) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [typeError, setTypeError]   = useState(null);
  const [localPreview, setLocalPreview] = useState(null);

  // Generate object URL for local thumbnail preview
  useEffect(() => {
    if (!file) {
      setLocalPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const validateAndSelect = useCallback((incoming) => {
    setTypeError(null);
    if (!incoming) return;

    if (!ACCEPTED_MIME_TYPES.includes(incoming.type.toLowerCase())) {
      setTypeError(`Unsupported format "${incoming.type || 'unknown'}". Please use ${ACCEPTED_LABEL}.`);
      return;
    }

    onFileSelect(incoming);
  }, [onFileSelect]);

  // ── Clipboard Paste Handler ────────────────────────────────────────────────
  const extractImageFromClipboard = useCallback((clipboardData) => {
    if (!clipboardData) return null;

    if (clipboardData.items) {
      for (const item of Array.from(clipboardData.items)) {
        if (item.type && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) return file;
        }
      }
    }

    if (clipboardData.files && clipboardData.files.length > 0) {
      for (const f of Array.from(clipboardData.files)) {
        if (f.type && f.type.startsWith('image/')) {
          return f;
        }
      }
    }

    return null;
  }, []);

  useEffect(() => {
    const handlePaste = (e) => {
      const activeEl = document.activeElement;
      const isTypingInField =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
         activeEl.tagName === 'TEXTAREA' ||
         activeEl.isContentEditable);

      if (isTypingInField && activeEl.type !== 'file') {
        const fileFromPaste = extractImageFromClipboard(e.clipboardData);
        if (fileFromPaste) {
          e.preventDefault();
          validateAndSelect(fileFromPaste);
        }
        return;
      }

      const fileFromPaste = extractImageFromClipboard(e.clipboardData);
      if (fileFromPaste) {
        e.preventDefault();
        validateAndSelect(fileFromPaste);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [validateAndSelect, extractImageFromClipboard]);

  // ── Drag & Drop Handlers ───────────────────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      validateAndSelect(dropped);
    }
  };

  const handleFileInput = (e) => {
    const picked = e.target.files?.[0];
    if (picked) {
      validateAndSelect(picked);
    }
  };

  const handleClick = () => {
    setTypeError(null);
    inputRef.current?.click();
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setTypeError(null);
    if (inputRef.current) inputRef.current.value = '';
    onRemove();
  };

  const isUploading = uploadStatus === 'uploading';
  const isSuccess   = uploadStatus === 'success';

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* ── Drop zone ─────────────────────────────────────────────────────── */}
      <div
        id="wireframe-upload-zone"
        role="button"
        tabIndex={0}
        aria-label="Upload wireframe: click or drag and drop an image"
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center p-5 rounded-[var(--nm-radius)]
          border-2 border-dashed cursor-pointer transition-all duration-200 select-none
          ${isDragging
            ? 'border-[var(--nm-accent)] bg-[var(--nm-accent-glow)] scale-[1.01]'
            : isSuccess
              ? 'border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.04)]'
              : 'border-[var(--nm-border-subtle)] hover:border-[var(--nm-border)] bg-[var(--nm-bg-surface)]'
          }
        `}
      >
        <input
          ref={inputRef}
          id="wireframe-file-input"
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileInput}
          className="hidden"
          aria-hidden="true"
        />

        {/* ── Remove button (shown when file is selected) ── */}
        {file && !isUploading && (
          <button
            id="wireframe-remove-btn"
            type="button"
            aria-label="Remove uploaded wireframe"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--nm-bg-card)]
                       border border-[var(--nm-border-subtle)] hover:border-[var(--nm-error)]
                       text-[var(--nm-text-muted)] hover:text-[var(--nm-error)]
                       flex items-center justify-center text-xs transition-colors z-10"
          >
            <i className="pi pi-times" />
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
          <div className="relative w-full flex flex-col items-center gap-2 p-2">
            {localPreview && (
              <img
                src={localPreview}
                alt="Uploaded wireframe preview"
                className="max-h-[150px] max-w-full object-contain rounded-[var(--nm-radius-sm)] shadow-md border border-[var(--nm-border-subtle)]"
              />
            )}
            <div className="flex items-center gap-1.5 text-xs text-[var(--nm-success)] font-medium">
              <i className="pi pi-check-circle" />
              <span>Wireframe ready — click to replace or paste another</span>
            </div>
          </div>
        ) : file ? (
          /* File selected, not yet submitted */
          <div className="flex flex-col items-center gap-2">
            <img
              src={localPreview}
              alt="Selected wireframe"
              className="max-h-[150px] max-w-full object-contain rounded-[var(--nm-radius-sm)] shadow-sm"
            />
            <p className="text-xs text-[var(--nm-text-muted)]">
              Click to replace · ✕ to remove · Paste new with Ctrl+V
            </p>
          </div>
        ) : (
          /* Idle / Empty state */
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--nm-accent-glow)] flex items-center justify-center mb-1">
              <i className="pi pi-cloud-upload text-[var(--nm-accent-light)] text-xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--nm-text-primary)] mb-0.5">
                Drop your wireframe image here, or{' '}
                <span className="text-[var(--nm-accent-light)] underline">browse</span>
              </p>
              <p className="text-[11px] text-[var(--nm-text-muted)]">
                {ACCEPTED_LABEL} · or press <kbd className="px-1 py-0.5 rounded bg-[var(--nm-bg-card)] border border-[var(--nm-border-subtle)] text-[10px] font-mono">Ctrl+V</kbd> to paste
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Validation error (client-side type check) ── */}
      {typeError && (
        <p id="wireframe-type-error" role="alert" className="text-xs text-[var(--nm-error)] flex items-center gap-1">
          <i className="pi pi-exclamation-circle" />
          <span>{typeError}</span>
        </p>
      )}

      {/* ── Upload error (from server) ── */}
      {uploadStatus === 'error' && uploadError && (
        <p id="wireframe-upload-error" role="alert" className="text-xs text-[var(--nm-error)] flex items-center gap-1">
          <i className="pi pi-exclamation-triangle" />
          <span>{uploadError}</span>
        </p>
      )}
    </div>
  );
};

export default NmUploadArea;
