import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { Database as Databaseconn } from 'better-sqlite3'

export interface CookbookEntry {
    id: number;
    meal_id: string;
    name: string;
    image_url: string;
    /** de 1 a 5 */
    rating: number
    note: string | null;
    created_at: string;

}

export type NewCookEntry = Omit<CookbookEntry, "id" | "created_at">;

export interface CookbookPatch {
    rating?: number;
    note?: string | null;
}

const CREATE_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS cookbook (
        id          INTENGER PRIMARY KEY AUTOINCREMENT,
        meal_id     TEXT     NOT NULL UNIQUE,
        name        TEXT     NOT NULL
        image_url   TEXT     NOT NULL
        rating      INTENGER NOT NULL CHECK (rating BETWEEN 1 AND 5)
        note        TEXT              CHECK (note IS NULL OR lenght(note) <= 500)
        created_at  TEXT     NOT NULL
    )
`

const SELECT_COLUMNS =
    "id, meal_id, name, image_url, rating, note, created_at";





