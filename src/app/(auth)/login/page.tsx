"use client";

import { Suspense, useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { notifySuccess, notifyError } from "@/lib/notify";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-16">Cargando...</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const res = await signIn("credentials", {
      username: fd.get("username") as string,
      password: fd.get("password") as string,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) notifyError("Usuario o contraseña inválidos");
    else { notifySuccess("Sesión iniciada"); router.push(callbackUrl); router.refresh(); }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="heading-display text-4xl mb-6">Login</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Usuario</label>
          <input name="username" className="input" autoComplete="username" required />
        </div>
        <div>
          <label className="label">Contraseña</label>
          <input name="password" type="password" className="input" autoComplete="current-password" required />
        </div>
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="mt-4 text-sm text-muted">
        ¿No tienes cuenta? <Link className="text-accent underline" href="/register">Regístrate</Link>
      </p>
    </div>
  );
}
