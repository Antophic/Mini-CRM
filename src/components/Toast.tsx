export type ToastMessage = {
  message: string;
  tone: "success" | "error";
};

type ToastProps = {
  toast: ToastMessage | null;
};

export function Toast({ toast }: ToastProps) {
  if (!toast) {
    return null;
  }

  return (
    <div className={`toast toast-${toast.tone}`} role="status">
      {toast.message}
    </div>
  );
}
