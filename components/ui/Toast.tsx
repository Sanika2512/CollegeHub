"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return <Toaster position="top-right" toastOptions={{ duration: 2500, style: { borderRadius: "8px", fontSize: "14px" } }} />;
}
