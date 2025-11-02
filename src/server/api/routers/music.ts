// File: src/server/api/routers/music.ts

import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  favorites,
  listeningHistory,
  playlists,
  playlistTracks,
  searchHistory,
} from "@/server/db/schema";
import type { Track } from "@/types";

const trackSchema = z.object({
  id: z.number(),
  readable: z.boolean(),
  title: z.string(),
  title_short: z.string(),
  title_version: z.string(),
  link: z.string(),
  duration: z.number(),
  rank: z.number(),
  explicit_lyrics: z.boolean(),
  explicit_content_lyrics: z.number(),
  explicit_content_cover: z.number(),
  preview: z.string(),
  md5_image: z.string(),
  artist: z.object({
    id: z.number(),
    name: z.string(),
    link: z.string(),
    picture: z.string(),
    picture_small: z.string(),
    picture_medium: z.string(),
    picture_big: z.string(),
    picture_xl: z.string(),
    tracklist: z.string(),
    type: z.literal("artist"),
  }),
  album: z.object({
    id: z.number(),
    title: z.string(),
    cover: z.string(),
    cover_small: z.string(),
    cover_medium: z.string(),
    cover_big: z.string(),
    cover_xl: z.string(),
    md5_image: z.string(),
    tracklist: z.string(),
    type: z.literal("album"),
  }),
  type: z.literal("track"),
});

export const musicRouter = createTRPCRouter({
  // ============================================
  // FAVORITES
  // ============================================

  addFavorite: protectedProcedure
    .input(z.object({ track: trackSchema }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.favorites.findFirst({
        where: and(
          eq(favorites.userId, ctx.session.user.id),
          eq(favorites.trackId, input.track.id),
        ),
      });

      if (existing) {
        return { success: true, alreadyExists: true };
      }

      await ctx.db.insert(favorites).values({
        userId: ctx.session.user.id,
        trackId: input.track.id,
        trackData: input.track as unknown as Record<string, unknown>,
      });

      return { success: true, alreadyExists: false };
    }),

  removeFavorite: protectedProcedure
    .input(z.object({ trackId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, ctx.session.user.id),
            eq(favorites.trackId, input.trackId),
          ),
        );

      return { success: true };
    }),

  getFavorites: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.query.favorites.findMany({
        where: eq(favorites.userId, ctx.session.user.id),
        orderBy: [desc(favorites.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      return items.map((item) => ({
        id: item.id,
        track: item.trackData as Track,
        createdAt: item.createdAt,
      }));
    }),

  isFavorite: protectedProcedure
    .input(z.object({ trackId: z.number() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.query.favorites.findFirst({
        where: and(
          eq(favorites.userId, ctx.session.user.id),
          eq(favorites.trackId, input.trackId),
        ),
      });

      return { isFavorite: !!item };
    }),

  // ============================================
  // PLAYLISTS
  // ============================================

  createPlaylist: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(256),
        description: z.string().optional(),
        isPublic: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [playlist] = await ctx.db
        .insert(playlists)
        .values({
          userId: ctx.session.user.id,
          name: input.name,
          description: input.description,
          isPublic: input.isPublic,
        })
        .returning();

      return playlist;
    }),

  getPlaylists: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.playlists.findMany({
      where: eq(playlists.userId, ctx.session.user.id),
      orderBy: [desc(playlists.createdAt)],
      with: {
        tracks: {
          orderBy: [desc(playlistTracks.position)],
          limit: 4, // Preview tracks
        },
      },
    });
  }),

  getPlaylist: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const playlist = await ctx.db.query.playlists.findFirst({
        where: and(
          eq(playlists.id, input.id),
          eq(playlists.userId, ctx.session.user.id),
        ),
        with: {
          tracks: {
            orderBy: [desc(playlistTracks.position)],
          },
        },
      });

      if (!playlist) {
        throw new Error("Playlist not found");
      }

      return {
        ...playlist,
        tracks: playlist.tracks.map((t) => ({
          id: t.id,
          track: t.trackData as Track,
          position: t.position,
          addedAt: t.addedAt,
        })),
      };
    }),

  addToPlaylist: protectedProcedure
    .input(
      z.object({
        playlistId: z.number(),
        track: trackSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const playlist = await ctx.db.query.playlists.findFirst({
        where: and(
          eq(playlists.id, input.playlistId),
          eq(playlists.userId, ctx.session.user.id),
        ),
      });

      if (!playlist) {
        throw new Error("Playlist not found");
      }

      // Get max position
      const maxPos = await ctx.db
        .select({ max: sql<number>`max(${playlistTracks.position})` })
        .from(playlistTracks)
        .where(eq(playlistTracks.playlistId, input.playlistId));

      const nextPosition = (maxPos[0]?.max ?? -1) + 1;

      await ctx.db.insert(playlistTracks).values({
        playlistId: input.playlistId,
        trackId: input.track.id,
        trackData: input.track as unknown as Record<string, unknown>,
        position: nextPosition,
      });

      return { success: true };
    }),

  removeFromPlaylist: protectedProcedure
    .input(
      z.object({
        playlistId: z.number(),
        trackEntryId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership through the playlist
      const playlist = await ctx.db.query.playlists.findFirst({
        where: and(
          eq(playlists.id, input.playlistId),
          eq(playlists.userId, ctx.session.user.id),
        ),
      });

      if (!playlist) {
        throw new Error("Playlist not found");
      }

      await ctx.db
        .delete(playlistTracks)
        .where(
          and(
            eq(playlistTracks.id, input.trackEntryId),
            eq(playlistTracks.playlistId, input.playlistId),
          ),
        );

      return { success: true };
    }),

  deletePlaylist: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(playlists)
        .where(
          and(
            eq(playlists.id, input.id),
            eq(playlists.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),

  // ============================================
  // LISTENING HISTORY
  // ============================================

  addToHistory: protectedProcedure
    .input(
      z.object({
        track: trackSchema,
        duration: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(listeningHistory).values({
        userId: ctx.session.user.id,
        trackId: input.track.id,
        trackData: input.track as unknown as Record<string, unknown>,
        duration: input.duration,
      });

      return { success: true };
    }),

  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.query.listeningHistory.findMany({
        where: eq(listeningHistory.userId, ctx.session.user.id),
        orderBy: [desc(listeningHistory.playedAt)],
        limit: input.limit,
        offset: input.offset,
      });

      return items.map((item) => ({
        id: item.id,
        track: item.trackData as Track,
        playedAt: item.playedAt,
        duration: item.duration,
      }));
    }),

  // ============================================
  // SEARCH HISTORY
  // ============================================

  addSearchQuery: protectedProcedure
    .input(z.object({ query: z.string().min(1).max(512) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(searchHistory).values({
        userId: ctx.session.user.id,
        query: input.query,
      });

      return { success: true };
    }),

  getRecentSearches: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ ctx, input }) => {
      // Get unique queries with their most recent search time
      const items = await ctx.db
        .selectDistinct({
          query: searchHistory.query,
          searchedAt: sql<Date>`MAX(${searchHistory.searchedAt})`,
        })
        .from(searchHistory)
        .where(eq(searchHistory.userId, ctx.session.user.id))
        .groupBy(searchHistory.query)
        .orderBy(desc(sql`MAX(${searchHistory.searchedAt})`))
        .limit(input.limit);

      return items.map((item) => item.query);
    }),
});