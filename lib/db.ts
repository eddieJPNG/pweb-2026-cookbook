import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { Database as Databaseconn } from "better-sqlite3";

/** TYPES E INTERFACES DOS DADOS */

export interface CookbookEntry {
  id: number;
  meal_id: string;
  name: string;
  image_url: string;
  /** de 1 a 5 */
  rating: number;
  note: string | null;
  created_at: string;
}

export type NewCookbookEntry = Omit<CookbookEntry, "id" | "created_at">;

export interface CookbookPatch {
  rating?: number;
  note?: string | null;
}

type NewCookbookEntryRow = NewCookbookEntry & { created_at: string };

/** CONSTS DO SQL */

const CREATE_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS cookbook (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        meal_id     TEXT     NOT NULL UNIQUE,
        name        TEXT     NOT NULL,
        image_url   TEXT     NOT NULL,
        rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        note        TEXT              CHECK (note IS NULL OR length(note) <= 500),
        created_at  TEXT     NOT NULL
    )
`;

const SELECT_COLUMNS = "id, meal_id, name, image_url, rating, note, created_at";

const LIST_SQL = `SELECT ${SELECT_COLUMNS} FROM cookbook
                   ORDER BY created_at DESC, id DESC`;

const FIND_BY_ID_SQL = `SELECT ${SELECT_COLUMNS} FROM cookbook WHERE id = ?`;
const FIND_BY_MEAL_ID_SQL = `SELECT ${SELECT_COLUMNS} FROM cookbook WHERE meal_id = ?`;

const INSERT_SQL = `
    INSERT INTO cookbook (meal_id, name, image_url, rating, note, created_at)
    VALUES (@meal_id, @name, @image_url, @rating, @note, @created_at)
    RETURNING *
`;

const UPDATE_SQL = `
  UPDATE cookbook SET rating = ?, note = ?
  WHERE id = ?
  RETURNING *
`;
const DELETE_SQL = "DELETE FROM cookbook WHERE id = ?";

/** SEED DE DADOS DO LIVRO */

const SEED_ENTRIES: NewCookbookEntry[] = [
  {
    meal_id: "52977",
    name: "Corba",
    image_url:
      "https://www.themealdb.com/images/media/meals/58oia61564916529.jpg",
    rating: 5,
    note: "Sopa de lentilhas turca — tentar com mais limão na próxima.",
  },
  {
    meal_id: "52772",
    name: "Teriyaki Chicken Casserole",
    image_url:
      "https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg",
    rating: 4,
    note: null,
  },
  {
    meal_id: "53013",
    name: "Big Mac",
    image_url:
      "https://www.themealdb.com/images/media/meals/urzj1d1587670726.jpg",
    rating: 2,
    note: "Dá para replicar o molho; o resto é muito pesado.",
  },
  {
    meal_id: "52785",
    name: "Dal fry",
    image_url:
      "https://www.themealdb.com/images/media/meals/wuxrtu1483564410.jpg",
    rating: 5,
    note: null,
  },
  {
    meal_id: "52855",
    name: "Banana Pancakes",
    image_url:
      "https://www.themealdb.com/images/media/meals/sywswr1511383814.jpg",
    rating: 3,
    note: "Café da manhã rápido; usar banana bem madura.",
  },
];

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "app.db");

const globalStore = globalThis as unknown as { cookbookDb?: Databaseconn };

function seed(db: Databaseconn): void {
  const stmt = db.prepare<NewCookbookEntryRow>(INSERT_SQL);
  const created_at = new Date().toISOString();

  const insertAll = db.transaction((rows: NewCookbookEntry[]) => {
    for (const row of rows) {
      stmt.run({ ...row, created_at });
    }
  });

  insertAll(SEED_ENTRIES);
}

function shouldSeed(db: Databaseconn): boolean {
  const row = db.prepare("SELECT COUNT(*) AS n FROM cookbook").get() as {
    n: number;
  };

  return row.n === 0;
}

function createConnection(): Databaseconn {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(CREATE_TABLE_SQL);

  if (shouldSeed(db)) seed(db);

  return db;
}

function getDb(): Databaseconn {
  if (!globalStore.cookbookDb) {
    globalStore.cookbookDb = createConnection();
  }
  return globalStore.cookbookDb;
}
