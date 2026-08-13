import type { FormEvent } from "react";
import type { ClientRecord } from "../types";
import { formatDate, getStatusClass } from "../utils/formatters";

type ClientDetailsProps = {
  noteDraft: string;
  noteSubmitting: boolean;
  onAddNote: (event: FormEvent<HTMLFormElement>) => void;
  onNoteDraftChange: (value: string) => void;
  selectedClient: ClientRecord | null;
};

export function ClientDetails({
  noteDraft,
  noteSubmitting,
  onAddNote,
  onNoteDraftChange,
  selectedClient,
}: ClientDetailsProps) {
  return (
    <aside className="panel notes-panel" aria-labelledby="notes-title">
      {selectedClient ? (
        <>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Activity</p>
              <h2 id="notes-title">{selectedClient.name}</h2>
            </div>
            <span className={`status-pill ${getStatusClass(selectedClient.status)}`}>
              {selectedClient.status}
            </span>
          </div>

          <dl className="client-detail">
            <div>
              <dt>Company</dt>
              <dd>{selectedClient.company}</dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>{selectedClient.email || selectedClient.phone || "-"}</dd>
            </div>
            <div>
              <dt>Last Updated</dt>
              <dd>{formatDate(selectedClient.updatedAt)}</dd>
            </div>
          </dl>

          <form className="note-form" onSubmit={onAddNote}>
            <label>
              Add Note
              <textarea
                onChange={(event) => onNoteDraftChange(event.target.value)}
                placeholder="Write a follow-up update"
                rows={3}
                value={noteDraft}
              />
            </label>
            <button
              className="button secondary full-width"
              disabled={noteSubmitting || !noteDraft.trim()}
              type="submit"
            >
              {noteSubmitting ? "Adding..." : "Add Note"}
            </button>
          </form>

          <div className="notes-list">
            {selectedClient.notes.length > 0 ? (
              selectedClient.notes.map((note) => (
                <article className="note-item" key={note.id}>
                  <p>{note.body}</p>
                  <time dateTime={note.createdAt}>{formatDate(note.createdAt)}</time>
                </article>
              ))
            ) : (
              <p className="muted">No notes yet.</p>
            )}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <h3>Select a client</h3>
          <p>Client details and activity will appear here.</p>
        </div>
      )}
    </aside>
  );
}
