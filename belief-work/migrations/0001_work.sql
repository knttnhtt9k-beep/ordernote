CREATE TABLE participants (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  registered_at INTEGER NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE submissions (
  participant_id TEXT NOT NULL REFERENCES participants(id),
  day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 14),
  answers_json TEXT NOT NULL CHECK (json_valid(answers_json) AND json_type(answers_json) = 'array'),
  submitted_at INTEGER NOT NULL,
  PRIMARY KEY (participant_id, day)
);

CREATE TABLE sheet_sync_outbox (
  participant_id TEXT NOT NULL,
  day INTEGER NOT NULL,
  queued_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  synced_at INTEGER,
  PRIMARY KEY (participant_id, day),
  FOREIGN KEY (participant_id, day) REFERENCES submissions(participant_id, day)
);

CREATE INDEX sheet_sync_pending ON sheet_sync_outbox(queued_at) WHERE synced_at IS NULL;

CREATE TRIGGER enqueue_sheet_sync AFTER INSERT ON submissions
BEGIN
  INSERT INTO sheet_sync_outbox(participant_id, day, queued_at)
  VALUES (NEW.participant_id, NEW.day, NEW.submitted_at);
END;
