import { index, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { uuid } from 'drizzle-orm/pg-core/columns/uuid';
import { sql } from 'drizzle-orm';
import { date } from 'drizzle-orm/pg-core/columns/date';
import { integer } from 'drizzle-orm/pg-core/columns/integer';
import { text } from 'drizzle-orm/pg-core/columns/text';

export const usersTable = pgTable('users', {
  id: uuid().unique().primaryKey().default(sql`uuid_generate_v4
    ()`),
  name: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 100 }).notNull().unique(),
  password: varchar({ length: 255 }).default(sql`NULL`),
  profilePicture: varchar({ length: 255 }).default(sql`NULL`),
  emailVerified: timestamp().default(sql`NULL`),
  loginAt: timestamp().default(sql`NULL`),
  createdAt: date().default(sql`now
    ()`),
  updatedAt: date().default(sql`now
    ()`),
});

export const foldersTable = pgTable(
  'folders',
  {
    id: uuid().primaryKey().default(sql`uuid_generate_v4
      ()`),
    name: varchar({ length: 255 }).notNull(),
    ownerId: uuid()
      .references(() => usersTable.id)
      .notNull(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
    parentId: uuid().references(() => foldersTable.id),
    deletedAt: timestamp(),
    createdAt: timestamp().default(sql`now
      ()`),
  },
  (table) => [index('idx_folder_owner').on(table.ownerId)],
);

export const filesTable = pgTable(
  'files',
  {
    id: uuid().primaryKey().default(sql`uuid_generate_v4
      ()`),
    name: varchar({ length: 255 }).notNull(),
    mimeType: varchar({ length: 100 }).notNull(),
    size: integer().notNull(),
    path: text().notNull(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
    folderId: uuid().references(() => foldersTable.id),
    ownerId: uuid()
      .references(() => usersTable.id)
      .notNull(),
    deletedAt: timestamp(),
    createdAt: timestamp().default(sql`now
      ()`),
  },
  (table) => [
    index('idx_file_owner').on(table.ownerId),
    index('idx_file_folder').on(table.folderId),
  ],
);

export const sharesTable = pgTable(
  'shares',
  {
    id: uuid().primaryKey().default(sql`uuid_generate_v4
      ()`),
    token: varchar({ length: 64 }).unique().notNull(),
    fileId: uuid().references(() => filesTable.id),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
    folderId: uuid().references(() => foldersTable.id),
    createdBy: uuid()
      .references(() => usersTable.id)
      .notNull(),
    password: varchar({ length: 100 }),
    expiresAt: timestamp(),
    downloadCount: integer().default(0),
    createdAt: timestamp().default(sql`now
      ()`),
  },
  (table) => [
    index('idx_share_file').on(table.fileId),
    index('idx_share_folder').on(table.folderId),
    index('idx_share_created_by').on(table.createdBy),
  ],
);

export type User = typeof usersTable.$inferSelect;
export type Folder = typeof foldersTable.$inferSelect;
