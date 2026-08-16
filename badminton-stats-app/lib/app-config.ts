/**
 * Change these values only if your Supabase schema uses different names/types.
 */
export const GAMES_TABLE = "games_database";
export const USERS_TABLE = "users";
export const MATCH_ID_COLUMN = "match_id";

/**
 * "name" = games_database.player_1/player_2 stores e.g. "Niels".
 * "id"   = games_database.player_1/player_2 stores users.id.
 */
export const PLAYER_STORAGE_MODE: "name" | "id" = "id";
