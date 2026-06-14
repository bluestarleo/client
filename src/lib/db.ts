import Database from 'better-sqlite3';
import path from 'path';

// Resolve database path relative to client project root
const dbPath = path.resolve(process.cwd(), '../database/travel_app.db');
export const db = new Database(dbPath, { readonly: true });

// Type definitions
export interface CityGroup {
  id: number;
  name: string;
  description: string;
  created_at: string;
  article_count?: number;
}

export interface Article {
  id: number;
  pageid: number;
  group_id: number;
  title: string;
  lat: number;
  lon: number;
  url: string;
  thumbnail: string | null;
  extract: string | null;
}
