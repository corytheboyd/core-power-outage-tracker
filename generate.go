package main

import (
	"context"
	"database/sql"
	"os"
	"os/signal"
	"syscall"

	"github.com/duckdb/duckdb-go/v2"
	"go.uber.org/zap"
)

const (
	ColoradoPublicAddressFilePath = "data/Colorado_Public_Address_Composite.csv"
)

func main() {
	config := zap.NewDevelopmentConfig()
	config.Level = zap.NewAtomicLevelAt(zap.DebugLevel)
	logger, _ := config.Build()
	defer func(logger *zap.Logger) {
		err := logger.Sync()
		if err != nil {

		}
	}(logger)
	zap.ReplaceGlobals(logger)

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	connector, err := duckdb.NewConnector("", nil)
	if err != nil {
		zap.L().Fatal("Failed to create in-memory database connector",
			zap.Error(err))
	}
	defer func(c *duckdb.Connector) {
		err := c.Close()
		if err != nil {
			zap.L().Error("Failed to close connector")
		}
	}(connector)

	database := sql.OpenDB(connector)
	defer func(database *sql.DB) {
		err := database.Close()
		if err != nil {
			zap.L().Error("Failed to close database")
		}
	}(database)

	_, err = database.ExecContext(ctx, `
		-- https://duckdb.org/docs/stable/core_extensions/spatial/overview
		INSTALL spatial; LOAD spatial;
	`)
	if err != nil {
		zap.L().Fatal("Failed to install spatial extension",
			zap.Error(err))
	}

	_, err = database.ExecContext(ctx, `
		CREATE OR REPLACE TABLE addresses (
			id INTEGER PRIMARY KEY,
			street TEXT NOT NULL,
			city TEXT NOT NULL,
			zip TEXT NOT NULL,
			location GEOMETRY NOT NULL
		);
		CREATE OR REPLACE TABLE outages (
			id INTEGER PRIMARY KEY,
			location GEOMETRY NOT NULL,
			cause TEXT NOT NULL,
			start DATETIME NOT NULL,
			affected INTEGER NOT NULL
		);
	`)
	if err != nil {
		zap.L().Fatal("Failed to setup database",
			zap.Error(err))
	}

	// Import addresses from CSV using DuckDB's read_csv function
	// Relaxed CSV parsing to handle malformed data
	_, err = database.ExecContext(ctx, `
		INSERT INTO addresses (id, street, city, zip, location)
		SELECT 
			ROW_NUMBER() OVER () as id,
			COALESCE("AddrFull", '') as street,
			COALESCE("PlaceName", '') as city,
			COALESCE("Zipcode", '') as zip,
			ST_Point(
				TRY_CAST("Longitude" AS DOUBLE),
				TRY_CAST("Latitude" AS DOUBLE)
			) as location
		FROM read_csv(?, 
			all_varchar=true,
			header=true, 
			ignore_errors=true,
			strict_mode=false)
		WHERE 
		    "Longitude" IS NOT NULL 
		  AND
		    "Latitude" IS NOT NULL
	`, ColoradoPublicAddressFilePath)
	if err != nil {
		zap.L().Fatal("Failed to import addresses",
			zap.Error(err))
	}

	_, err = database.ExecContext(ctx, `
		COPY addresses TO 'data/addresses.parquet' (FORMAT PARQUET, COMPRESSION SNAPPY);
		COPY outages TO 'data/outages.parquet' (FORMAT PARQUET, COMPRESSION SNAPPY);
	`)
	if err != nil {
		zap.L().Fatal("Failed to export addresses parquet",
			zap.Error(err))
	}
}
