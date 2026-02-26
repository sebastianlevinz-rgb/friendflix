import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  status: text('status', {
    enum: ['draft', 'generating_script', 'generating_scenes', 'assembling', 'complete', 'failed'],
  }).notNull().default('draft'),
  genre: text('genre').notNull(),
  language: text('language').notNull().default('es'),
  customPrompt: text('custom_prompt'),
  scriptJson: text('script_json'),
  outputVideoUrl: text('output_video_url'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
});

export const characters = sqliteTable('characters', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  originalPhotos: text('original_photos').notNull().default('[]'),
  processedPhotos: text('processed_photos').notNull().default('[]'),
  voiceId: text('voice_id'),
  orderIndex: integer('order_index').notNull().default(0),
});

export const scenes = sqliteTable('scenes', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull(),
  prompt: text('prompt').notNull(),
  falRequestId: text('fal_request_id'),
  status: text('status', {
    enum: ['pending', 'generating', 'complete', 'failed'],
  }).notNull().default('pending'),
  videoUrl: text('video_url'),
  duration: integer('duration').notNull().default(8),
  retryCount: integer('retry_count').notNull().default(0),
});

export type Project = typeof projects.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type Scene = typeof scenes.$inferSelect;
