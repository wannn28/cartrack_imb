package entity

type Dashboard struct {
	TotalVehicles     int `json:"total_vehicles"`
	TotalAPIKeys      int `json:"total_api_keys"`
	TotalFuelLogs     int `json:"total_fuel_logs"`
	TotalLocationLogs int `json:"total_location_logs"`
	TotalUsers        int `json:"total_users"`
	TotalAdmins       int `json:"total_admins"`
	TotalCustomers    int `json:"total_customers"`
}