package handler

import (
	"net/http"
	"strconv"

	"github.com/cartrack/backend/internal/http/dto"
	"github.com/cartrack/backend/internal/service"
	"github.com/cartrack/backend/pkg/response"
	"github.com/labstack/echo/v4"
)

// APIKeyHandler defines API key handler interface
type APIKeyHandler interface {
	Create(c echo.Context) error
	GetByID(c echo.Context) error
	GetByUserID(c echo.Context) error
	Update(c echo.Context) error
	Delete(c echo.Context) error
	GetAll(c echo.Context) error
}

// apiKeyHandler implements APIKeyHandler interface
type apiKeyHandler struct {
	apiKeyService service.APIKeyService
}

// NewAPIKeyHandler creates new API key handler instance
func NewAPIKeyHandler(apiKeyService service.APIKeyService) APIKeyHandler {
	return &apiKeyHandler{
		apiKeyService: apiKeyService,
	}
}

// Create creates a new API key
func (h *apiKeyHandler) Create(c echo.Context) error {
	userID := getUserIDFromContext(c)

	var req dto.CreateAPIKeyRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "Invalid request body", nil)
	}

	if err := c.Validate(&req); err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	apiKey, err := h.apiKeyService.Create(userID, &req)
	if err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Created(c, "API key created successfully", apiKey)
}

// GetByID gets API key by ID
func (h *apiKeyHandler) GetByID(c echo.Context) error {
	userID := getUserIDFromContext(c)

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return response.BadRequest(c, "Invalid API key ID", nil)
	}

	apiKey, err := h.apiKeyService.GetByID(userID, uint(id))
	if err != nil {
		return response.NotFound(c, err.Error(), nil)
	}

	return response.Success(c, "API key retrieved successfully", apiKey)
}

// GetByUserID gets API keys by user ID
func (h *apiKeyHandler) GetByUserID(c echo.Context) error {
	userID := getUserIDFromContext(c)

	apiKeys, err := h.apiKeyService.GetByUserID(userID)
	if err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Success(c, "API keys retrieved successfully", apiKeys)
}

// Update updates API key
func (h *apiKeyHandler) Update(c echo.Context) error {
	userID := getUserIDFromContext(c)

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return response.BadRequest(c, "Invalid API key ID", nil)
	}

	var req dto.UpdateAPIKeyRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "Invalid request body", nil)
	}

	if err := c.Validate(&req); err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	apiKey, err := h.apiKeyService.Update(userID, uint(id), &req)
	if err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Success(c, "API key updated successfully", apiKey)
}

// Delete deletes API key
func (h *apiKeyHandler) Delete(c echo.Context) error {
	userID := getUserIDFromContext(c)

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		return response.BadRequest(c, "Invalid API key ID", nil)
	}

	if err := h.apiKeyService.Delete(userID, uint(id)); err != nil {
		return response.BadRequest(c, err.Error(), nil)
	}

	return response.Success(c, "API key deleted successfully", nil)
}

// GetAll gets all API keys
func (h *apiKeyHandler) GetAll(c echo.Context) error {
	userID := getUserIDFromContext(c)

	// Get pagination parameters
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	offset, _ := strconv.Atoi(c.QueryParam("offset"))

	if limit <= 0 || limit > 1000000000000000000 {
		limit = 1000000000000000000
	}
	if offset < 0 {
		offset = 0
	}

	apiKeys, total, err := h.apiKeyService.GetAllWithPagination(userID, limit, offset)
	if err != nil {
		return response.InternalServerError(c, "Failed to get API keys", nil)
	}

	// Calculate pagination info
	page := int64(offset/limit + 1)
	perPage := int64(limit)

	return c.JSON(http.StatusOK, response.SuccessResponseWithPagination("API keys retrieved successfully", apiKeys, page, perPage, total))
}
