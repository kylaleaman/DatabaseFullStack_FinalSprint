CREATE TABLE search_history (
    search_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    search_query TEXT NOT NULL,
    search_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
