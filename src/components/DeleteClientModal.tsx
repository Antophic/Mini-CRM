import { useEffect } from "react";
import type { ClientRecord } from "../types";

type DeleteClientModalProps = {
  deletingClient: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  target: ClientRecord | null;
};

export function DeleteClientModal({
  deletingClient,
  onCancel,
  onConfirm,
  target,
}: DeleteClientModalProps) {
  useEffect(() => {
    if (!target) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onCancel, target]);

  if (!target) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="delete-title"
        aria-modal="true"
        className="confirm-modal"
        role="dialog"
      >
        <h2 id="delete-title">Delete {target.name}?</h2>
        <p>This action cannot be undone.</p>
        <div className="modal-actions">
          <button
            className="button secondary"
            disabled={deletingClient}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="button danger"
            disabled={deletingClient}
            onClick={onConfirm}
            type="button"
          >
            {deletingClient ? "Deleting..." : "Delete Client"}
          </button>
        </div>
      </section>
    </div>
  );
}
