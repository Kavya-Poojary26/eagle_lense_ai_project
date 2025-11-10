import { useState } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  function toast(message) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }

  return { toasts, toast };
}
