// File: src/server/api/routers/preferences.ts

import { eq } from "drizzle-orm";
import { z } from "zod";

import { DEFAULT_EQUALIZER } from "@/config/audioDefaults";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { userPreferences } from "@/server/db/schema";
import { type EqualizerSettings } from "@/types";

const SAFE_DEFAULTS: EqualizerSettings = DEFAULT_EQUALIZER;

export const preferencesRouter = createTRPCRouter({
  updateEqualizer: protectedProcedure
    .input(
      z.object({
        preset: z.string().min(1).default(SAFE_DEFAULTS.preset),
        bands: z
          .array(z.number().min(-12).max(12))
          .length(10)
          .default(SAFE_DEFAULTS.bands),
        enabled: z.boolean().default(SAFE_DEFAULTS.enabled),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userPreferences)
        .values({
          userId: ctx.session.user.id,
          equalizerPreset: input.preset,
          equalizerBands: input.bands,
          equalizerEnabled: input.enabled,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: {
            equalizerPreset: input.preset,
            equalizerBands: input.bands,
            equalizerEnabled: input.enabled,
            updatedAt: new Date(),
          },
        });

      return input;
    }),

  getEqualizer: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await ctx.db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, ctx.session.user.id),
    });

    return prefs
      ? {
          preset: prefs.equalizerPreset,
          bands: prefs.equalizerBands,
          enabled: prefs.equalizerEnabled,
        }
      : SAFE_DEFAULTS;
  }),
});
