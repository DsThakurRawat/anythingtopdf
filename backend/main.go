package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"

	"anythingtopdf/handlers"
)

func main() {
	app := fiber.New(fiber.Config{
		BodyLimit: 100 * 1024 * 1024, // Allow up to 100MB file uploads
	})

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // allow all origins for dev
		AllowHeaders: "Origin, Content-Type, Accept",
	}))

	// Setup directories
	os.MkdirAll("./temp_uploads", os.ModePerm)
	os.MkdirAll("./temp_outputs", os.ModePerm)

	// Routes
	api := app.Group("/api")
	api.Post("/convert", handlers.ConvertHandler)

	log.Println("Starting server on :8000")
	log.Fatal(app.Listen(":8000"))
}
