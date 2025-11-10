// frontend/src/components/ui/toaster.jsx
import { useToast } from "./use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-gray-900 text-white px-4 py-2 rounded shadow-lg"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
