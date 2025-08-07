DROP TRIGGER IF EXISTS set_updated_at_users ON users;
DROP TRIGGER IF EXISTS set_updated_at_vehicles ON vehicles;
DROP TRIGGER IF EXISTS set_updated_at_location_logs ON location_logs;
DROP TRIGGER IF EXISTS set_updated_at_fuel_logs ON fuel_logs;
DROP TRIGGER IF EXISTS set_updated_at_camera_feeds ON camera_feeds;
DROP TRIGGER IF EXISTS set_updated_at_system_logs ON system_logs;
DROP FUNCTION IF EXISTS update_updated_at_column;
