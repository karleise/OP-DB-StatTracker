"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notifySuccess, notifyError } from "@/lib/notify";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const username = fd.get("username") as string;
    const password = fd.get("password") as string;
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      setLoading(false);
      const data = await res.json().catch(() => ({}));
      notifyError(data?.error ?? "No se pudo crear la cuenta");
      return;
    }
    const login = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (login?.error) notifyError("Cuenta creada pero no se pudo iniciar sesión");
    else { notifySuccess("Cuenta creada"); router.push("/"); router.refresh(); }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="heading-display text-4xl mb-6">Sign up</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Usuario</label>
          <input name="username" className="input" required minLength={3} maxLength={32} />
        </div>
        <div>
          <label className="label">Contraseña</label>
          <input name="password" type="password" className="input" required minLength={4} />
        </div>
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
      <p className="mt-4 text-sm text-muted">
        ¿Ya tienes cuenta? <Link className="text-accent underline" href="/login">Login</Link>
      </p>
    </div>
  );
}
