import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/, "letters, digits, _.- only"),
  password: z.string().min(4).max(72),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const guideSchema = z.object({
  leaderId: z.string().min(1),
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  colorId: z.coerce.number().int().positive(),
  difficultyId: z.coerce.number().int().positive(),
  playStyleId: z.coerce.number().int().positive(),
  goodMatchups: z.array(z.string()).max(3),
  badMatchups: z.array(z.string()).max(3),
});
export type GuideInput = z.infer<typeof guideSchema>;

export const catalogItemSchema = z.object({
  name: z.string().min(1).max(64),
  hex: z.string().optional().nullable(),
  order: z.coerce.number().int().optional(),
});
export type CatalogItemInput = z.infer<typeof catalogItemSchema>;

export const matchSchema = z.object({
  playerLeaderId: z.string().min(1),
  rivalId: z.string().optional().nullable(),
  rivalName: z.string().optional().nullable(),
  rivalLeaderId: z.string().min(1),
  result: z.enum(["WIN", "LOSS"]),
  notes: z.string().max(2000).optional().nullable(),
});
export type MatchInput = z.infer<typeof matchSchema>;

export const randomizerSchema = z.object({
  considerMatchups: z.boolean().default(true),
  useAllAvailable: z.boolean().default(false),
});
export type RandomizerInput = z.infer<typeof randomizerSchema>;
