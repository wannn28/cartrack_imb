package response

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type Response struct {
	Meta       Meta        `json:"meta"`
	Data       interface{} `json:"data"`
	Pagination *Pagination `json:"pagination,omitempty"`
}

type Meta struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

type Pagination struct {
	Page       int64 `json:"page"`
	PerPage    int64 `json:"per_page"`
	TotalItems int64 `json:"total_items"`
	TotalPages int64 `json:"total_pages"`
}

func SuccessResponse(message string, data interface{}) Response {
	return Response{
		Meta: Meta{Code: http.StatusOK, Message: message},
		Data: data,
	}
}

func SuccessResponseWithPagination(message string, data interface{}, page, perPage, totalItems int64) Response {
	if perPage == 0 {
		perPage = 10
	}

	if page == 0 {
		page = 1
	}

	totalPages := calculateTotalPages(totalItems, perPage)
	return Response{
		Meta: Meta{Code: http.StatusOK, Message: message},
		Data: data,
		Pagination: &Pagination{
			Page:       page,
			PerPage:    perPage,
			TotalItems: totalItems,
			TotalPages: totalPages,
		},
	}
}

func calculateTotalPages(totalItems, perPage int64) int64 {
	if perPage <= 0 {
		return 0
	}
	totalPages := totalItems / perPage
	if totalItems%perPage > 0 {
		totalPages++
	}
	return totalPages
}

func ErrorResponse(code int, message string) Response {
	return Response{
		Meta: Meta{Code: code, Message: message},
		Data: nil,
	}
}

// Helper functions for Echo framework

// Success returns a successful response
func Success(c echo.Context, message string, data interface{}) error {
	return c.JSON(http.StatusOK, SuccessResponse(message, data))
}

// BadRequest returns a bad request response
func BadRequest(c echo.Context, message string, data interface{}) error {
	return c.JSON(http.StatusBadRequest, Response{
		Meta: Meta{Code: http.StatusBadRequest, Message: message},
		Data: data,
	})
}

// Unauthorized returns an unauthorized response
func Unauthorized(c echo.Context, message string, data interface{}) error {
	return c.JSON(http.StatusUnauthorized, Response{
		Meta: Meta{Code: http.StatusUnauthorized, Message: message},
		Data: data,
	})
}

// NotFound returns a not found response
func NotFound(c echo.Context, message string, data interface{}) error {
	return c.JSON(http.StatusNotFound, Response{
		Meta: Meta{Code: http.StatusNotFound, Message: message},
		Data: data,
	})
}

// InternalServerError returns an internal server error response
func InternalServerError(c echo.Context, message string, data interface{}) error {
	return c.JSON(http.StatusInternalServerError, Response{
		Meta: Meta{Code: http.StatusInternalServerError, Message: message},
		Data: data,
	})
}

// Created returns a created response
func Created(c echo.Context, message string, data interface{}) error {
	return c.JSON(http.StatusCreated, Response{
		Meta: Meta{Code: http.StatusCreated, Message: message},
		Data: data,
	})
}
