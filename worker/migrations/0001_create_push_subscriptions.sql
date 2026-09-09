CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  client_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/Rome',
  morning_enabled INTEGER NOT NULL DEFAULT 0 CHECK (morning_enabled IN (0, 1)),
  morning_hour INTEGER NOT NULL DEFAULT 9 CHECK (morning_hour BETWEEN 0 AND 23),
  evening_enabled INTEGER NOT NULL DEFAULT 0 CHECK (evening_enabled IN (0, 1)),
  evening_hour INTEGER NOT NULL DEFAULT 21 CHECK (evening_hour BETWEEN 0 AND 23),
  last_checkin_date TEXT,
  last_evening_note_date TEXT,
  sent_morning_date TEXT,
  sent_evening_date TEXT,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_enabled
  ON push_subscriptions (morning_enabled, evening_enabled);
