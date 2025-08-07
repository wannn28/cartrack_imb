CREATE TABLE system_logs (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(id),
    log_type VARCHAR(10) CHECK (log_type IN ('INFO', 'WARNING', 'ERROR')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
