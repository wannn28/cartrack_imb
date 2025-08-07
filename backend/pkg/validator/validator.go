package validator

import (
	"net/http"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

// CustomValidator wraps the go-playground validator
type CustomValidator struct {
	validator *validator.Validate
}

// NewValidator creates a new custom validator
func NewValidator() *CustomValidator {
	v := validator.New()

	// Register custom field name function to use JSON tags
	v.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		return name
	})

	return &CustomValidator{validator: v}
}

// Validate validates the struct
func (cv *CustomValidator) Validate(i interface{}) error {
	if err := cv.validator.Struct(i); err != nil {
		// Return validation error with custom format
		return &ValidationError{
			Errors: cv.formatValidationErrors(err.(validator.ValidationErrors)),
		}
	}
	return nil
}

// ValidationError represents validation error
type ValidationError struct {
	Errors map[string]string `json:"errors"`
}

// Error implements error interface
func (ve *ValidationError) Error() string {
	var messages []string
	for field, message := range ve.Errors {
		messages = append(messages, field+": "+message)
	}
	return strings.Join(messages, ", ")
}

// formatValidationErrors formats validation errors into readable messages
func (cv *CustomValidator) formatValidationErrors(errs validator.ValidationErrors) map[string]string {
	errors := make(map[string]string)

	for _, err := range errs {
		field := err.Field()

		switch err.Tag() {
		case "required":
			errors[field] = field + " is required"
		case "email":
			errors[field] = field + " must be a valid email address"
		case "min":
			errors[field] = field + " must be at least " + err.Param() + " characters long"
		case "max":
			errors[field] = field + " must be at most " + err.Param() + " characters long"
		case "len":
			errors[field] = field + " must be exactly " + err.Param() + " characters long"
		case "numeric":
			errors[field] = field + " must be numeric"
		case "alpha":
			errors[field] = field + " must contain only letters"
		case "alphanum":
			errors[field] = field + " must contain only letters and numbers"
		case "url":
			errors[field] = field + " must be a valid URL"
		case "gte":
			errors[field] = field + " must be greater than or equal to " + err.Param()
		case "lte":
			errors[field] = field + " must be less than or equal to " + err.Param()
		case "gt":
			errors[field] = field + " must be greater than " + err.Param()
		case "lt":
			errors[field] = field + " must be less than " + err.Param()
		case "oneof":
			errors[field] = field + " must be one of: " + err.Param()
		default:
			errors[field] = field + " is invalid"
		}
	}

	return errors
}

// ErrorHandler handles validation errors and returns proper HTTP response
func ErrorHandler(err error, c echo.Context) {
	if ve, ok := err.(*ValidationError); ok {
		c.JSON(http.StatusBadRequest, map[string]interface{}{
			"meta": map[string]interface{}{
				"code":    http.StatusBadRequest,
				"message": "Validation failed",
			},
			"data": ve.Errors,
		})
		return
	}

	// Default error handling
	c.JSON(http.StatusInternalServerError, map[string]interface{}{
		"meta": map[string]interface{}{
			"code":    http.StatusInternalServerError,
			"message": "Internal server error",
		},
		"data": nil,
	})
}
