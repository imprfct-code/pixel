import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export function AvatarLightbox({
  src,
  name,
  onClose,
}: {
  src: string;
  name: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog?.open) dialog?.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="avatar-lightbox"
      aria-label={`${name} avatar`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button type="button" onClick={onClose} aria-label="Close avatar">
        <X size={19} />
      </button>
      <img src={src} alt={`${name} avatar`} />
    </dialog>
  );
}
