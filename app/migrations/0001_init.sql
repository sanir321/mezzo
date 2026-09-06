-- Mezzo D1 schema (SQLite)
-- 1. Better Auth core tables
CREATE TABLE IF NOT EXISTS user (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	emailVerified INTEGER NOT NULL DEFAULT 0,
	image TEXT,
	createdAt INTEGER NOT NULL,
	updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS session (
	id TEXT PRIMARY KEY,
	expiresAt INTEGER NOT NULL,
	token TEXT NOT NULL UNIQUE,
	createdAt INTEGER NOT NULL,
	updatedAt INTEGER NOT NULL,
	ipAddress TEXT,
	userAgent TEXT,
	userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
	id TEXT PRIMARY KEY,
	accountId TEXT NOT NULL,
	providerId TEXT NOT NULL,
	userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
	issuer TEXT,
	accessToken TEXT,
	refreshToken TEXT,
	idToken TEXT,
	accessTokenExpiresAt INTEGER,
	refreshTokenExpiresAt INTEGER,
	scope TEXT,
	password TEXT,
	createdAt INTEGER NOT NULL,
	updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verification (
	id TEXT PRIMARY KEY,
	identifier TEXT NOT NULL,
	value TEXT NOT NULL,
	expiresAt INTEGER NOT NULL,
	createdAt INTEGER,
	updatedAt INTEGER
);

-- 2. Application tables
CREATE TABLE IF NOT EXISTS artists (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	createdAt INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS albums (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	artist_id TEXT REFERENCES artists(id) ON DELETE SET NULL,
	year INTEGER,
	cover_key TEXT,
	createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
	UNIQUE (name, artist_id)
);

CREATE TABLE IF NOT EXISTS tracks (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
	title TEXT NOT NULL,
	artist TEXT,
	artist_id TEXT REFERENCES artists(id) ON DELETE SET NULL,
	album TEXT,
	album_id TEXT REFERENCES albums(id) ON DELETE SET NULL,
	genre TEXT,
	year INTEGER,
	track_number INTEGER,
	duration REAL,
	format TEXT NOT NULL,
	size INTEGER NOT NULL,
	object_key TEXT NOT NULL,
	cover_key TEXT,
	date_added INTEGER NOT NULL DEFAULT (unixepoch()),
	play_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tracks_user ON tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist_id);

CREATE TABLE IF NOT EXISTS playlists (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	description TEXT,
	cover_key TEXT,
	createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
	updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);

CREATE TABLE IF NOT EXISTS playlist_tracks (
	playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
	track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
	position INTEGER NOT NULL,
	PRIMARY KEY (playlist_id, track_id)
);

CREATE TABLE IF NOT EXISTS liked_tracks (
	user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
	track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
	createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
	PRIMARY KEY (user_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_liked_tracks_user ON liked_tracks(user_id);

-- FTS5 for search (titles + artists)
CREATE VIRTUAL TABLE IF NOT EXISTS tracks_fts USING fts5(
	title,
	artist,
	album,
	content='tracks',
	content_rowid='rowid',
	tokenize='porter'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS tracks_ai AFTER INSERT ON tracks BEGIN
	INSERT INTO tracks_fts(rowid, title, artist, album)
	VALUES (new.rowid, new.title, new.artist, new.album);
END;
CREATE TRIGGER IF NOT EXISTS tracks_ad AFTER DELETE ON tracks BEGIN
	INSERT INTO tracks_fts(tracks_fts, rowid, title, artist, album)
	VALUES ('delete', old.rowid, old.title, old.artist, old.album);
END;
CREATE TRIGGER IF NOT EXISTS tracks_au AFTER UPDATE ON tracks BEGIN
	INSERT INTO tracks_fts(tracks_fts, rowid, title, artist, album)
	VALUES ('delete', old.rowid, old.title, old.artist, old.album);
	INSERT INTO tracks_fts(rowid, title, artist, album)
	VALUES (new.rowid, new.title, new.artist, new.album);
END;
