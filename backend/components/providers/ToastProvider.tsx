"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3500}
      closeOnClick
      pauseOnHover
      draggable
      newestOnTop
      limit={4}
      hideProgressBar={false}
      theme="colored"
      stacked
      toastClassName="!rounded-xl !shadow-xl !backdrop-blur-md !text-sm !font-medium"
    />
  );
}
