package entity

import (
	"time"

	"gorm.io/gorm"
)

// User represents user entity in the system
type User struct {
	ID           uint           `json:"id" gorm:"primarykey"`
	Name         string         `json:"name" gorm:"type:varchar(100);not null"`
	Email        string         `json:"email" gorm:"type:varchar(100);uniqueIndex;not null"`
	PasswordHash string         `json:"-" gorm:"column:password_hash;not null"`
	PhoneNumber  *string        `json:"phone_number" gorm:"type:varchar(20)"`
	Role         string         `json:"role" gorm:"type:varchar(50);default:user"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// TableName returns the table name for User entity
func (User) TableName() string {
	return "users"
}

// IsAdmin checks if user has admin role
func (u *User) IsAdmin() bool {
	return u.Role == "admin" || u.Role == "Administrator"
}

// IsUser checks if user has user role
func (u *User) IsUser() bool {
	return u.Role == "user" || u.Role == "User"
}
