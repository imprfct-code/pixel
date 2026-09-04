import { Check, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Entry } from "../../shared/pixel";

export function UploadNotice({
  entry,
  entryId,
  onClose,
}: {
  entry?: Entry;
  entryId: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  async function copyLink() {
    await navigator.clipboard.writeText(
      new URL(`/entries/${entryId}`, window.location.origin).href,
    );
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 1800);
  }

  const canShare = Boolean(entry && entry.visibility !== "private");

  return (
    <aside className="upload-notice" role="status" data-share={canShare || undefined}>
      <div className="upload-notice-preview">{entry && <img src={entry.imageUrl} alt="" />}</div>
      <strong>uploaded</strong>
      {canShare && (
        <button
          className="upload-notice-share"
          type="button"
          data-copied={copied || undefined}
          onClick={() => void copyLink()}
        >
          {copied ? <Check size={13} /> : <Share2 size={13} />}
          {copied ? "copied" : "share"}
        </button>
      )}
      <button className="upload-notice-close" type="button" onClick={onClose} aria-label="Close">
        <X size={14} />
      </button>
    </aside>
  );
}
