# Sellora Backend API Specification & PRD

## Overview
Backend for Sellora E-Commerce Intelligence platform.

## 1. Authentication API
- **POST /api/auth/register**
  - Payload (JSON): `{"email": "user@example.com", "password": "password123", "name": "John Doe"}`
  - Returns: `200 OK` on success, `400 Bad Request` if email exists.
- **POST /api/auth/login**
  - Payload (JSON): `{"email": "user@example.com", "password": "password123"}`
  - Returns: `200 OK` with access_token.
- **GET /api/auth/profile**
  - Requires: Bearer Token
  - Returns: `200 OK` with user details.

## 2. Analysis API
- **POST /api/analysis/save**
  - Requires: Bearer Token
  - Payload (JSON): 
    ```json
    {
      "input": {
        "productName": "Shoes", "category": "Footwear", "sellingPrice": 100, "costPrice": 50, "platforms": ["Amazon"], "description": "Running shoes", "reportLanguage": "en"
      },
      "overallScore": 85,
      "status": "completed",
      "startedAt": "2023-10-10T10:00:00Z",
      "pricing": {}, "seo": {}, "adCopies": {}, "marketIntel": {}, "financials": {}, "recommendations": []
    }
    ```
  - Returns: `200 OK`
- **GET /api/analysis/my-reports**
  - Requires: Bearer Token
  - Returns: `200 OK` with list of reports.

## 3. Competitor API
- **GET /api/competitor/track**
  - Parameters: `?product_name=Shoes&base_price=100`
  - Returns: `200 OK` with scraper results.
