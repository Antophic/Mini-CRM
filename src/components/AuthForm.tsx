import type { FormEvent } from "react";
import { demoClients } from "../demoData";
import type { AuthFormState, AuthMode } from "../hooks/useAuth";
import { formatCurrency, getInitials } from "../utils/formatters";

type AuthFormProps = {
  authError: string;
  authForm: AuthFormState;
  authMode: AuthMode;
  authSubmitting: boolean;
  onFieldChange: (field: keyof AuthFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleMode: () => void;
};

export function AuthForm({
  authError,
  authForm,
  authMode,
  authSubmitting,
  onFieldChange,
  onSubmit,
  onToggleMode,
}: AuthFormProps) {
  return (
    <main className="login-page">
      <section className="login-shell" aria-labelledby="login-title">
        <div className="login-panel">
          <div className="brand-row">
            <span className="brand-mark">M</span>
            <div>
              <p className="eyebrow">Sales Workspace</p>
              <h1 id="login-title">Mini CRM</h1>
            </div>
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            {authMode === "register" ? (
              <label>
                Name
                <input
                  autoComplete="name"
                  name="name"
                  onChange={(event) => onFieldChange("name", event.target.value)}
                  placeholder="Sarah Mitchell"
                  value={authForm.name}
                />
              </label>
            ) : null}

            <label>
              Email
              <input
                autoComplete="email"
                name="email"
                onChange={(event) => onFieldChange("email", event.target.value)}
                type="email"
                value={authForm.email}
              />
            </label>

            <label>
              Password
              <input
                autoComplete={authMode === "register" ? "new-password" : "current-password"}
                name="password"
                onChange={(event) => onFieldChange("password", event.target.value)}
                type="password"
                value={authForm.password}
              />
            </label>

            {authError ? <p className="form-error">{authError}</p> : null}

            <div className="login-actions">
              <button className="button primary" disabled={authSubmitting} type="submit">
                {authSubmitting
                  ? authMode === "register"
                    ? "Creating..."
                    : "Signing in..."
                  : authMode === "register"
                    ? "Create Account"
                    : "Sign In"}
              </button>
              <button
                className="button secondary"
                disabled={authSubmitting}
                onClick={onToggleMode}
                type="button"
              >
                {authMode === "login" ? "Create Account" : "Back to Sign In"}
              </button>
            </div>
          </form>
        </div>

        <aside className="login-preview" aria-label="Pipeline preview">
          <div className="preview-heading">
            <p className="eyebrow">Simple Sales Pipeline</p>
            <strong>{formatCurrency(37650)}</strong>
          </div>
          <div className="preview-bars" aria-hidden="true">
            <span className="bar bar-new" />
            <span className="bar bar-contacted" />
            <span className="bar bar-proposal" />
            <span className="bar bar-won" />
          </div>
          <div className="preview-list">
            {demoClients.map((client) => (
              <div className="preview-row" key={client.email}>
                <span className="client-avatar">{getInitials(client.name)}</span>
                <span>
                  <strong>{client.company}</strong>
                  <small>{client.status}</small>
                </span>
                <b>{formatCurrency(Number(client.value))}</b>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
