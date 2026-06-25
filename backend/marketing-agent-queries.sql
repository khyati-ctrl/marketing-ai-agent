ALTER TABLE personas ADD COLUMN master_summary TEXT DEFAULT 'This is a new campaign. No history yet.';
ALTER TABLE content ADD COLUMN is_summarized BOOLEAN DEFAULT FALSE;