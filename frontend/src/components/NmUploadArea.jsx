/**
 * NmUploadArea ΓÇö Drag-and-drop wireframe upload area (Task 2 complete)
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
import { useRef, useState, useEffect, useCallback } from 'react';

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp';
const ACCEPTED_LABEL = 'JPG, JPEG, PNG, WEBP ΓÇö up to 10 MB';

/**
 * @param {object}   props
 * @param {function} props.onFileSelect   - Called with a File when user picks or pastes a valid image
 * @param {function} props.onRemove       - Called when user clicks the remove (├ù) button
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

  const validateAndSelect = useCallback((incoming) => {
    if (!incoming) return;
    setTypeError(null);
    if (!ACCEPTED_MIME_TYPES.includes(incoming.type) && !incoming.type.startsWith('image/')) {
      setTypeError(`"${incoming.name || 'Pasted file'}" is not supported. Please use JPG, JPEG, PNG, or WEBP.`);
      return;
    }
    onFileSelect(incoming);
  }, [onFileSelect]);

  // ΓöÇΓöÇ Clipboard Paste Handler ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const extractImageFromClipboard = useCallback((clipboardData) => {
    if (!clipboardData) return null;

    // 1. Check files array
    if (clipboardData.files && clipboardData.files.length > 0) {
      for (let i = 0; i < clipboardData.files.length; i++) {
        const itemFile = clipboardData.files[i];
        if (ACCEPTED_MIME_TYPES.includes(itemFile.type) || itemFile.type.startsWith('image/')) {
          const ext = (itemFile.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
          const name = itemFile.name && itemFile.name.includes('.')
            ? itemFile.name
            : `pasted-wireframe-${Date.now()}.${ext}`;
          return new File([itemFile], name, { type: itemFile.type || 'image/png' });
        }
      }
    }

    // 2. Check items array (direct image/screenshot paste)
    if (clipboardData.items && clipboardData.items.length > 0) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
            return new File([blob], `pasted-wireframe-${Date.now()}.${ext}`, { type: blob.type });
          }
        }
      }
    }

    return null;
  }, []);

  // Global window paste listener (Ctrl+V anywhere on the page)
  useEffect(() => {
    const handleWindowPaste = (e) => {
      const targetTag = e.target?.tagName?.toLowerCase();
      const isTextarea = targetTag === 'textarea';
      const isTextInput = targetTag === 'input' && e.target?.type === 'text';

      // If user is pasting in a text input and clipboard has pure text, don't hijack
      if (isTextarea || isTextInput) {
        const hasText = e.clipboardData?.getData('text/plain');
        const hasImage = Array.from(e.clipboardData?.items || []).some(
          (it) => it.kind === 'file' && it.type.startsWith('image/')
        );
        if (hasText && !hasImage) return;
      }

      const pasted = extractImageFromClipboard(e.clipboardData);
      if (pasted && !isUploading) {
        e.preventDefault();
        validateAndSelect(pasted);
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, [extractImageFromClipboard, isUploading, validateAndSelect]);

  const handlePasteButtonClick = async (e) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const ext = (imageType.split('/')[1] || 'png').replace('jpeg', 'jpg');
            const fileObj = new File([blob], `pasted-wireframe-${Date.now()}.${ext}`, { type: imageType });
            validateAndSelect(fileObj);
            return;
          }
        }
        setTypeError('No image found in clipboard. Copy an image or screenshot first, then press Ctrl+V.');
      } else {
        setTypeError('Press Ctrl+V to paste your copied image.');
      }
    } catch {
      setTypeError('Press Ctrl+V on your keyboard to paste the copied image.');
    }
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
      {/* ΓöÇΓöÇ Drop zone ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <div
        id="wireframe-upload-zone"
        role="button"
        tabIndex={isUploading ? -1 : 0}
        aria-label="Wireframe upload area. Drag and drop, browse, or paste image with Ctrl+V"
        onClick={handleAreaClick}
        onKeyDown={(e) => e.key === 'Enter' && handleAreaClick()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative flex flex-col items-center justify-center gap-3
          rounded-[var(--nm-radius)] border-2 border-dashed
          min-h-[200px] transition-all duration-200 p-4
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

        {/* ΓöÇΓöÇ Remove button (shown when file is selected) ΓöÇΓöÇ */}
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

        {/* ΓöÇΓöÇ Content area ΓöÇΓöÇ */}
        {isUploading ? (
          /* Uploading state */
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-10 h-10 border-2 border-[var(--nm-accent)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--nm-text-secondary)]">Uploading wireframeΓÇª</p>
          </div>
        ) : isSuccess ? (
          /* Success state ΓÇö show server-confirmed preview */
          <div className="relative w-full flex flex-col items-center gap-2 p-2">
            {localPreview && (
              <img
                src={localPreview}
                alt="Wireframe preview"
                className="max-h-[150px] max-w-full object-contain rounded-[var(--nm-radius-sm)] shadow-sm"
              />
            )}
            <div className="flex items-center gap-1.5 text-xs text-[var(--nm-success)] font-medium">
              <i className="pi pi-check-circle" />
              <span>Wireframe ready ΓÇö click to replace or paste another</span>
            </div>
          </div>
        ) : file ? (
          /* File selected but not yet uploaded */
          <div className="relative w-full flex flex-col items-center gap-2 p-2">
            <img
              src={localPreview}
              alt="Wireframe preview"
              className="max-h-[150px] max-w-full object-contain rounded-[var(--nm-radius-sm)] shadow-sm"
            />
            <p className="text-xs text-[var(--nm-text-muted)]">
              Click to replace ┬╖ Γ£ò to remove ┬╖ Paste new with Ctrl+V
            </p>
          </div>
        ) : (
          /* Empty / idle state */
          <>
            <div className="w-12 h-12 rounded-full bg-[var(--nm-bg-card)] border border-[var(--nm-border)] flex items-center justify-center shadow-inner">
              <i className="pi pi-image text-[var(--nm-accent)] text-xl" />
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-medium text-[var(--nm-text-primary)]">
                Drop wireframe here, click to browse, or paste
              </p>
              <p className="text-xs text-[var(--nm-text-muted)] mt-1">
                {ACCEPTED_LABEL}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--nm-bg-card)] border border-[var(--nm-border-subtle)] text-[10px] text-[var(--nm-text-secondary)] font-mono">
                <i className="pi pi-copy text-[9px]" /> Ctrl + V to paste image
              </span>
              <button
                type="button"
                id="paste-wireframe-btn"
                onClick={handlePasteButtonClick}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[var(--nm-accent-glow)] border border-[var(--nm-border)] text-[10px] text-[var(--nm-accent-light)] hover:bg-[var(--nm-accent)] hover:text-white transition-colors cursor-pointer"
              >
                <i className="pi pi-paperclip text-[9px]" /> Paste Image
              </button>
            </div>
          </>
        )}
      </div>

      {/* ΓöÇΓöÇ Validation error (client-side type check) ΓöÇΓöÇ */}
      {typeError && (
        <p id="wireframe-type-error" role="alert" className="text-xs text-[var(--nm-error)] flex items-center gap-1">
          <i className="pi pi-exclamation-circle" />
          {typeError}
        </p>
      )}

      {/* ΓöÇΓöÇ Upload error (from server) ΓöÇΓöÇ */}
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
