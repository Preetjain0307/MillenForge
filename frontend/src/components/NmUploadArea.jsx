/**
 * NmUploadArea — Drag-and-drop wireframe upload area
 *
 * Supports:
 *  - Drag-and-drop or click-to-browse
 *  - PNG / JPG / JPEG / WEBP
 *  - Local image preview & metadata display
 *  - Remove / replace file
 *  - Uploading / success / error visual states (driven by props)
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
    e.target.value = '';
  };

  const handleAreaClick = () => {
    if (!isUploading) inputRef.current?.click();
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setTypeError(null);
    onRemove();
  };

  // Determine styling state
  const areaStyle = (() => {
    if (isSuccess) return 'border-[#34D399] bg-[#34D399]/5';
    if (uploadStatus === 'error') return 'border-[#FB7185] bg-[#FB7185]/5';
    if (dragging) return 'border-[#8B5CF6] bg-[#8B5CF6]/15 scale-[1.01] shadow-[0_0_20px_rgba(139,92,246,0.2)]';
    return 'border-[#2A2A30] bg-[#18181B] hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/5';
  })();

  const localPreview = file ? URL.createObjectURL(file) : null;
  const fileSizeMb = file ? (file.size / (1024 * 1024)).toFixed(2) : null;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
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
          rounded-xl border-2 border-dashed
          min-h-[190px] transition-all duration-200
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

        {/* Remove button */}
        {file && !isUploading && (
          <button
            id="wireframe-remove-btn"
            type="button"
            onClick={handleRemove}
            aria-label="Remove wireframe"
            className="
              absolute top-3 right-3 z-10
              w-7 h-7 rounded-full
              bg-[#09090B] border border-[#2A2A30]
              flex items-center justify-center
              text-[#CBD5E1] hover:text-[#FB7185]
              hover:border-[#FB7185]
              transition-colors duration-150 shadow-md
            "
          >
            <i className="pi pi-times text-xs" />
          </button>
        )}

        {/* Content area */}
        {isUploading ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-10 h-10 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-[#A78BFA]">Analyzing & uploading wireframe…</p>
          </div>
        ) : isSuccess ? (
          <div className="relative w-full flex flex-col items-center gap-2 p-4">
            {localPreview && (
              <img
                src={localPreview}
                alt="Wireframe preview"
                className="max-h-[140px] max-w-full object-contain rounded-lg border border-[#2A2A30] shadow-md"
              />
            )}
            <div className="flex items-center gap-2 text-xs font-mono text-[#34D399]">
              <i className="pi pi-check-circle" />
              <span>Wireframe Ready ({fileSizeMb} MB) — Click to replace</span>
            </div>
          </div>
        ) : file ? (
          <div className="relative w-full flex flex-col items-center gap-2 p-4">
            {localPreview && (
              <img
                src={localPreview}
                alt="Wireframe preview"
                className="max-h-[140px] max-w-full object-contain rounded-lg border border-[#2A2A30] shadow-md"
              />
            )}
            <div className="flex items-center gap-2 text-xs text-[#CBD5E1]">
              <span className="font-mono text-[#A78BFA] font-medium">{file.name}</span>
              <span className="text-[#94A3B8]">({fileSizeMb} MB)</span>
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Click to replace · ✕ button to remove
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5 p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#202024] border border-[#2A2A30] flex items-center justify-center shadow-inner">
              <i className="pi pi-[#8B5CF6] pi-image text-[#8B5CF6] text-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#F8FAFC]">
                Drop your wireframe image here
              </p>
              <p className="text-xs text-[#94A3B8] mt-1 font-mono">
                {ACCEPTED_LABEL}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Validation error */}
      {typeError && (
        <p id="wireframe-type-error" role="alert" className="text-xs text-[#FB7185] flex items-center gap-1.5 px-1 mt-1">
          <i className="pi pi-exclamation-circle text-xs" />
          <span>{typeError}</span>
        </p>
      )}

      {/* Upload error */}
      {uploadStatus === 'error' && uploadError && (
        <p id="wireframe-upload-error" role="alert" className="text-xs text-[#FB7185] flex items-center gap-1.5 px-1 mt-1">
          <i className="pi pi-exclamation-triangle text-xs" />
          <span>{uploadError}</span>
        </p>
      )}
    </div>
  );
};

export default NmUploadArea;
