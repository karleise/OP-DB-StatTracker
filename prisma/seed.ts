import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "node:fs";
import * as path from "node:path";

const prisma = new PrismaClient();

type ScrapedLeader = {
  id: string;
  name: string;
  colors: string[];
  life?: number | null;
  power?: number | null;
  attribute?: string | null;
  tribe?: string | null;
  imageUrl: string;
};

const COLOR_DEFAULTS: { name: string; hex: string }[] = [
  { name: "Red",    hex: "#d83a3a" },
  { name: "Blue",   hex: "#3b6fd6" },
  { name: "Green",  hex: "#3aa760" },
  { name: "Purple", hex: "#8a4fbf" },
  { name: "Black",  hex: "#2d2d2d" },
  { name: "Yellow", hex: "#e6c43a" },
];

const DIFFICULTY_DEFAULTS = [
  { name: "Easy",   order: 1 },
  { name: "Medium", order: 2 },
  { name: "Hard",   order: 3 },
];

const PLAYSTYLE_DEFAULTS = [
  "Aggro",
  "Beatdown",
  "Board Control",
  "Board Flood",
  "Board Spam",
  "Card Cycling",
  "Control",
  "Critical Hit",
  "Double Striker",
  "Fortress",
  "Graveyard",
  "Heavy Control",
  "Life Control",
  "Life Gain",
  "Midrange",
  "Mill",
  "OTK",
  "Ramp",
  "Scaling",
  "Stall",
  "Survivability",
];

async function main() {
  console.log("Seeding catalogs...");
  for (const c of COLOR_DEFAULTS) {
    await prisma.color.upsert({
      where: { name: c.name },
      update: { hex: c.hex },
      create: c,
    });
  }
  for (const d of DIFFICULTY_DEFAULTS) {
    await prisma.difficulty.upsert({
      where: { name: d.name },
      update: { order: d.order },
      create: d,
    });
  }
  for (const ps of PLAYSTYLE_DEFAULTS) {
    await prisma.playStyle.upsert({
      where: { name: ps },
      update: {},
      create: { name: ps },
    });
  }

  console.log("Seeding admin user...");
  const username = process.env.ADMIN_USERNAME?.trim();
  const rawPwd   = process.env.ADMIN_PASSWORD;
  if (!username || !rawPwd) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env to seed the admin user.");
  }
  const adminPwd = await bcrypt.hash(rawPwd, 10);
  await prisma.user.upsert({
    where: { username },
    update: { role: Role.ADMIN, password: adminPwd },
    create: { username, password: adminPwd, role: Role.ADMIN },
  });

  const leadersFile = path.join(process.cwd(), "prisma", "seed-leaders.json");
  if (fs.existsSync(leadersFile)) {
    console.log("Seeding leaders from seed-leaders.json...");
    const raw = fs.readFileSync(leadersFile, "utf-8");
    const leaders: ScrapedLeader[] = JSON.parse(raw);
    const colors = await prisma.color.findMany();
    const colorByName = new Map(colors.map((c) => [c.name.toLowerCase(), c.id]));

    for (const L of leaders) {
      await prisma.leader.upsert({
        where: { id: L.id },
        update: {
          name: L.name,
          life: L.life ?? null,
          power: L.power ?? null,
          attribute: L.attribute ?? null,
          tribe: L.tribe ?? null,
          imageUrl: L.imageUrl,
        },
        create: {
          id: L.id,
          name: L.name,
          life: L.life ?? null,
          power: L.power ?? null,
          attribute: L.attribute ?? null,
          tribe: L.tribe ?? null,
          imageUrl: L.imageUrl,
        },
      });
      await prisma.leaderColor.deleteMany({ where: { leaderId: L.id } });
      for (const colorName of L.colors ?? []) {
        const cid = colorByName.get(colorName.toLowerCase());
        if (cid) {
          await prisma.leaderColor.create({
            data: { leaderId: L.id, colorId: cid },
          });
        }
      }
    }
    console.log(`Seeded ${leaders.length} leaders.`);
  } else {
    console.log("No seed-leaders.json found. Run `npm run scrape:leaders` first.");
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
