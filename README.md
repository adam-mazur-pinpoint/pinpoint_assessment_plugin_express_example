# Example Pinpoint Node Assessments Plugin

A Node.js Express server that integrates with Pinpoint via the plugin framework. This service provides API endpoints for creating assessments, processing webhooks, and viewing reports.

## Overview

This service acts as a middleware integration for an assessment platform. It allows external systems to:

- Create candidate assessments
- Receive webhook notifications when assessments are completed
- View assessment reports
- Configure API keys and base URLs

## Installation

```bash
npm install
```

## Running the Service

### Standard Mode

```bash
npm start
```

### Development Mode (with auto-reload)

```bash
npm run dev
```

The server runs on port 3000 by default (configurable via `PORT` environment variable).

## API Endpoints

### Health Check

- **GET** `/healthcheck`
- Returns: `{ message: "OK" }`

### Service Configuration

- **POST** `/`
- Returns service metadata including:
  - Available actions
  - Configuration form fields
  - Webhook endpoints
  - API key requirements

### Create Assessment (Meta)

- **POST** `/createAssessment/meta`
- Headers:
  - `X_EXAMPLE_ASSESSMENTS_KEY`: API key (must be `ABCDEFG123456789`)
  - `X_EXAMPLE_BASE_URL`: Base URL for the service
- Returns form fields for assessment creation

### Create Assessment (Submit)

- **POST** `/createAssessment/submit`
- Creates a new assessment with candidate information
- Automatically updates status to "completed" after 10 seconds
- Returns assessment details including external identifier and report URL

### Webhook Processing

- **POST** `/webhook/process`
- Processes webhook callbacks from the assessment system
- Returns updated assessment status and scores

### View Report

- **GET** `/reports/:id`
- Displays HTML report for a specific assessment
- Shows candidate information, test type, status, and results

## Data Storage

The service uses a simple JSON file database (`db.json`) to store assessment data. The database is automatically created on first use.

## Configuration

Required configuration:

- **API Key**: `ABCDEFG123456789` (hardcoded for this example)
- **Base URL**: Your service base URL (e.g., `http://localhost:3000`)

## Available Test Types

- JavaScript Developer Test (`js_test_001`)
- Python Developer Test (`py_test_001`)
- Ruby Developer Test (`rb_test_001`)

## Features

- Request logging with timestamps
- Automatic status updates via webhooks
- Random score generation (0-100) for completed assessments
- Base64 image encoding for logos and icons
- Form validation with required fields

## Architecture

### Main Components

- **[index.js](index.js)**: Express server with route handlers
- **[helpers.mjs](helpers.mjs)**: Utility functions for:
  - Base64 file encoding
  - Database operations
  - Webhook notifications

### Data Flow

1. External system requests assessment creation via `/createAssessment/meta`
2. User fills form and submits via `/createAssessment/submit`
3. Assessment is stored in `db.json` with "pending" status
4. After 10 seconds, status updates to "completed"
5. Webhook is sent to notify the external system
6. Reports are viewable at `/reports/:id`
