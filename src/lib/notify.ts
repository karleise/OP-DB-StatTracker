"use client";

import Swal, { type SweetAlertIcon } from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  customClass: { popup: "swal-toast" },
  didOpen: (el) => {
    el.addEventListener("mouseenter", Swal.stopTimer);
    el.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

function fire(icon: SweetAlertIcon, title: string, timer?: number) {
  return Toast.fire({ icon, title, ...(timer ? { timer } : {}) });
}

export const notifySuccess = (title: string) => fire("success", title);
export const notifyInfo    = (title: string) => fire("info",    title);
export const notifyError   = (title: string) => fire("error",   title, 4000);

export async function confirmDanger({
  title = "¿Estás seguro?",
  text,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
}: { title?: string; text?: string; confirmText?: string; cancelText?: string } = {}) {
  const res = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: "#d83a3a",
    cancelButtonColor: "#5b5045",
    focusCancel: true,
  });
  return res.isConfirmed;
}
