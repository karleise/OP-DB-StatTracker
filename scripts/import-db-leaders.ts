/**
 * Imports leader cards from the external `decks_app` MySQL database into our
 * `Leader` table, tagging them with game=DB. Idempotent: re-running upserts.
 *
 * Source: decks_app.cards WHERE card_type='LEADER'
 * Mapping:
 *   card_id   -> Leader.id        (no collisions with OP IDs; OP uses EB/OP/PRB/ST, DB uses FB/FP/FS/SB)
 *   name      -> Leader.name
 *   image_url -> Leader.imageUrl  (kept verbatim, e.g. "/uploads/cards/FB01-001.webp")
 *   color     -> Color.name via LeaderColor join (single color per DB card; "ALL" is skipped)
 */
import mysql from "mysql2/promise";
import { PrismaClient } from "@prisma/client";

const SOURCE_DSN = "mysql://root:root@localhost:3306/decks_app";

const prisma = new PrismaClient();

type CardRow = {
  card_id: string;
  name: string;
  color: string | null;
  image_url: string | null;
};

async function main() {
  const src = await mysql.createConnection(SOURCE_DSN);
  const [rows] = await src.query<mysql.RowDataPacket[]>(
    "SELECT card_id, name, color, image_url FROM cards WHERE card_type = 'LEADER'",
  );
  await src.end();

  const leaders = rows as unknown as CardRow[];
  console.log(`Read ${leaders.length} DB leaders from decks_app`);

  const colorsByName = new Map<string, number>();
  for (const c of await prisma.color.findMany()) colorsByName.set(c.name, c.id);

  let created = 0, updated = 0, colorsAttached = 0, missingImages = 0, skippedColor = 0;

  for (const row of leaders) {
    if (!row.image_url) missingImages++;

    const existing = await prisma.leader.findUnique({ where: { id: row.card_id } });
    await prisma.leader.upsert({
      where: { id: row.card_id },
      create: {
        id: row.card_id,
        name: row.name,
        imageUrl: row.image_url ?? "",
        game: "DB",
      },
      update: {
        name: row.name,
        imageUrl: row.image_url ?? "",
        game: "DB",
      },
    });
    if (existing) updated++; else created++;

    if (row.color && row.color !== "ALL") {
      const colorId = colorsByName.get(row.color);
      if (colorId == null) {
        console.warn(`  ! Unknown color "${row.color}" for ${row.card_id}; skipping color`);
        skippedColor++;
      } else {
        await prisma.leaderColor.upsert({
          where: { leaderId_colorId: { leaderId: row.card_id, colorId } },
          create: { leaderId: row.card_id, colorId },
          update: {},
        });
        colorsAttached++;
      }
    } else if (row.color === "ALL") {
      skippedColor++;
    }
  }

  console.log("---");
  console.log(`Created : ${created}`);
  console.log(`Updated : ${updated}`);
  console.log(`Colors  : ${colorsAttached} attached, ${skippedColor} skipped`);
  console.log(`Image-less rows: ${missingImages}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
