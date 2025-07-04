CREATE TABLE IF NOT EXISTS order_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_number TEXT NOT NULL,
    notes TEXT,
    timestamp TEXT NOT NULL
);

ALTER TABLE orders ADD COLUMN group_id INTEGER REFERENCES order_groups(id);
