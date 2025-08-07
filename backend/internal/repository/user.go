package repository

import (
	"github.com/cartrack/backend/internal/entity"
	"gorm.io/gorm"
)

// UserRepository defines user repository interface
type UserRepository interface {
	Create(user *entity.User) error
	GetByID(id uint) (*entity.User, error)
	GetByEmail(email string) (*entity.User, error)
	Update(user *entity.User) error
	Delete(id uint) error
	GetAll(limit, offset int) ([]entity.User, error)
	GetByRole(role string, limit, offset int) ([]entity.User, error)
	CountByRole(role string) (int64, error)
	Count() (int64, error)
}

// userRepository implements UserRepository interface
type userRepository struct {
	db *gorm.DB
}

// NewUserRepository creates new user repository instance
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

// Create creates a new user
func (r *userRepository) Create(user *entity.User) error {
	return r.db.Create(user).Error
}

// GetByID gets user by ID
func (r *userRepository) GetByID(id uint) (*entity.User, error) {
	var user entity.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetByEmail gets user by email
func (r *userRepository) GetByEmail(email string) (*entity.User, error) {
	var user entity.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Update updates user data
func (r *userRepository) Update(user *entity.User) error {
	return r.db.Save(user).Error
}

// Delete soft deletes user by ID
func (r *userRepository) Delete(id uint) error {
	return r.db.Delete(&entity.User{}, id).Error
}

// GetAll gets all users with pagination
func (r *userRepository) GetAll(limit, offset int) ([]entity.User, error) {
	var users []entity.User
	err := r.db.Limit(limit).Offset(offset).Find(&users).Error
	return users, err
}

// GetByRole gets users by role with pagination
func (r *userRepository) GetByRole(role string, limit, offset int) ([]entity.User, error) {
	var users []entity.User
	err := r.db.Where("role = ?", role).Limit(limit).Offset(offset).Find(&users).Error
	return users, err
}

// CountByRole counts users by role
func (r *userRepository) CountByRole(role string) (int64, error) {
	var count int64
	err := r.db.Model(&entity.User{}).Where("role = ?", role).Count(&count).Error
	return count, err
}

// Count counts all users
func (r *userRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&entity.User{}).Count(&count).Error
	return count, err
}
