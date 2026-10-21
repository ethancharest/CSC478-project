CREATE TABLE IF NOT EXISTS entries (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO entries (content) VALUES (
    'This is a persistent log. Add entries using the form below - they are stored in PostgreSQL and survive container restarts.'
);
