import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MatchForm from "@/components/stats/MatchForm";
import { getCurrentGame } from "@/lib/game";

export default async function NewMatchPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/stats/new");
  const game = await getCurrentGame();

  const [withGuide, allLeaders, users] = await Promise.all([
    prisma.leader.findMany({
      where: { game, guide: { isNot: null } },
      select: { id: true, name: true, imageUrl: true },
      orderBy: { id: "asc" },
    }),
    prisma.leader.findMany({
      where: { game },
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <h1 className="heading-display text-2xl sm:text-3xl mb-2">Registrar partida</h1>
      <p className="text-muted text-sm mb-8">Elige tu mazo, el del rival y el resultado.</p>
      <MatchForm myLeaders={withGuide} allLeaders={allLeaders} users={users} />
    </div>
  );
}
