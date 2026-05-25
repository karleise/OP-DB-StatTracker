import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        <aside className="rounded-xl border bg-surface p-3 h-fit sticky top-16">
          <div className="heading-display text-accent mb-2 px-2">Admin</div>
          <nav className="flex flex-col gap-1 text-sm">
            <SideLink href="/admin">Dashboard</SideLink>
            <SideLink href="/admin/guides">Guías</SideLink>
            <SideLink href="/admin/catalogs/colors">Colores</SideLink>
            <SideLink href="/admin/catalogs/difficulties">Dificultades</SideLink>
            <SideLink href="/admin/catalogs/playstyles">Estilos</SideLink>
          </nav>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}

function SideLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="px-3 py-2 rounded-md hover:bg-surface-2 hover:text-accent">
      {children}
    </Link>
  );
}
