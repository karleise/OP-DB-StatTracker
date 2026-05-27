import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="relative">
      <section className="md:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
          <AdminSidebar />
          {children}
        </div>
      </section>
    </div>
  );
}
