package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"go.uber.org/zap"
)

const (
	CustomerDataURL = "https://cache.sienatech.com/apex/siena_ords/webmaps/data/CORE/CUSTOMER"
)

// CustomerData represents the response from /data/CORE/CUSTOMER endpoint
type CustomerData struct {
	OutageData OutageData `json:"outageData"`
}

type OutageData struct {
	Outages []Outage `json:"outages"`
}

type Outage struct {
	ID                int64   `json:"id"`
	Latitude          float64 `json:"latitude"`
	Longitude         float64 `json:"longitude"`
	CustomersAffected int     `json:"customersAffected"`
	OutageCause       string  `json:"outageCause"`
	OutageStart       string  `json:"outageStart"`
	County            string  `json:"county"`
	Zip               string  `json:"zip"`
}

// OutageClient handles requests to the CORE outage API
type OutageClient struct {
	httpClient *http.Client
}

// NewOutageClient creates a new outage API client
func NewOutageClient() *OutageClient {
	return &OutageClient{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// FetchCustomerData retrieves the customer and outage data
func (c *OutageClient) FetchCustomerData(ctx context.Context) (*CustomerData, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, CustomerDataURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add headers to match browser request
	req.Header.Set("Accept", "application/json, text/javascript, */*; q=0.01")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("Client", "core")
	req.Header.Set("Origin", "https://oms.core.coop")
	req.Header.Set("Referer", "https://oms.core.coop/")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36")

	zap.L().Debug("Fetching customer data",
		zap.String("url", CustomerDataURL))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch customer data: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var customerData CustomerData
	if err := json.NewDecoder(resp.Body).Decode(&customerData); err != nil {
		return nil, fmt.Errorf("failed to decode customer data: %w", err)
	}

	zap.L().Debug("Fetched customer data",
		zap.Int("outage_count", len(customerData.OutageData.Outages)))

	return &customerData, nil
}
