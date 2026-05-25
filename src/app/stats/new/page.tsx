import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MatchForm from "@/components/stats/MatchForm";

export default async function NewMatchPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/stats/new");

  const [withGuide, allLeaders, users] = await Promise.all([
    prisma.leader.findMany({
      where: { guide: { isNot: null } },
      select: { id: true, name: true, imageUrl: true },
      orderBy: { id: "asc" },
    }),
    prisma.leader.findMany({
      select: { id: true, name: true, imageUrl: true },
      orderBy: { id: "asc" },
    }),
    prisma.user.findMany({
      where: { NOT: { id: session.user.id } },
      select: { id: true, username: true },
      orderBy: { username: "asc" },
    }),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="heading-display text-3xl mb-6">Registrar partida</h1>
      <MatchForm myLeaders={withGuide} allLeaders={allLeaders} users={users} />
    </div>
  );
}
