import type { ChangeEvent, FormEvent, RefObject } from "react";
import type {
  ClientForm as ClientFormState,
  ClientFormErrors,
  LeadStatus,
} from "../types";

type ClientFormProps = {
  availableStatuses: readonly LeadStatus[];
  editingId: string | null;
  errors: ClientFormErrors;
  form: ClientFormState;
  inputRef: RefObject<HTMLInputElement | null>;
  onCancelEdit: () => void;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  savingClient: boolean;
};

export function ClientForm({
  availableStatuses,
  editingId,
  errors,
  form,
  inputRef,
  onCancelEdit,
  onChange,
  onSubmit,
  savingClient,
}: ClientFormProps) {
  return (
    <section className="panel form-panel" aria-labelledby="client-form">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Client Data</p>
          <h2 id="client-form">{editingId ? "Edit Client" : "Add Client"}</h2>
        </div>
        {editingId ? (
          <button
            className="button ghost"
            disabled={savingClient}
            onClick={onCancelEdit}
            type="button"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <form className="client-form" onSubmit={onSubmit}>
        <label>
          Client Name
          <input
            ref={inputRef}
            aria-invalid={Boolean(errors.name)}
            name="name"
            onChange={onChange}
            placeholder="Sarah Mitchell"
            value={form.name}
          />
          {errors.name ? <span className="field-error">{errors.name}</span> : null}
        </label>

        <label>
          Company
          <input
            aria-invalid={Boolean(errors.company)}
            name="company"
            onChange={onChange}
            placeholder="Acme Consulting"
            value={form.company}
          />
          {errors.company ? <span className="field-error">{errors.company}</span> : null}
        </label>

        <label>
          Email
          <input
            aria-invalid={Boolean(errors.email)}
            name="email"
            onChange={onChange}
            placeholder="client@example.test"
            type="email"
            value={form.email}
          />
          {errors.email ? <span className="field-error">{errors.email}</span> : null}
        </label>

        <label>
          Phone
          <input
            aria-invalid={Boolean(errors.phone)}
            name="phone"
            onChange={onChange}
            placeholder="+1 415 555 0184"
            value={form.phone}
          />
          {errors.phone ? <span className="field-error">{errors.phone}</span> : null}
        </label>

        <div className="form-row">
          <label>
            Pipeline Status
            <select
              aria-invalid={Boolean(errors.status)}
              name="status"
              onChange={onChange}
              value={form.status}
            >
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            Deal Value
            <input
              aria-invalid={Boolean(errors.value)}
              min="0"
              name="value"
              onChange={onChange}
              placeholder="0"
              type="number"
              value={form.value}
            />
            {errors.value ? <span className="field-error">{errors.value}</span> : null}
          </label>
        </div>

        <label>
          {editingId ? "New Note" : "Initial Note"}
          <textarea
            name="note"
            onChange={onChange}
            placeholder="Meeting notes, follow-up details, or client needs"
            rows={4}
            value={form.note}
          />
        </label>

        <button className="button primary full-width" disabled={savingClient} type="submit">
          {savingClient
            ? editingId
              ? "Saving..."
              : "Adding..."
            : editingId
              ? "Save Changes"
              : "Add Client"}
        </button>
      </form>
    </section>
  );
}
