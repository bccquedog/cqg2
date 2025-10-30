"use client";

import { ToastContainer, cssTransition } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@/styles/toast.css";

const CQGSlide = cssTransition({
  enter: "cqg-toast-enter",
  exit: "cqg-toast-exit",
  collapse: true,
  collapseDuration: 400,
});

export default function ToastProvider() {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={3500}
      hideProgressBar={true}
      newestOnTop={true}
      closeOnClick
      pauseOnHover
      draggable
      transition={CQGSlide}
      theme="dark"
      toastClassName="cqg-toast"
      bodyClassName="cqg-toast-body"
    />
  );
}


