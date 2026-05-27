PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS flashcard_sets (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL DEFAULT 'Untitled',
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user_id ON flashcard_sets(user_id);

CREATE TABLE IF NOT EXISTS flashcards (
  id       TEXT PRIMARY KEY,
  set_id   TEXT NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  front    TEXT NOT NULL DEFAULT '',
  back     TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON flashcards(set_id);

CREATE TABLE IF NOT EXISTS analytics (                                                                                                 
  id           TEXT PRIMARY KEY,                                                                                                       
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,                                                                   
  card_id      TEXT NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,                                                              
  set_id       TEXT NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  correct      INTEGER NOT NULL,
  time_spent   INTEGER NOT NULL,
  reviewed_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);