# Drop Me Recycling API Documentation

## Base URL
```
http://localhost:3000/api
```

## Response Format

All responses follow a consistent structure:

### Success Response
```json
{
  "success": true,
  "message": "Optional success message",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [ ... ]  // Optional, for validation errors
  }
}
```

---

## Endpoints

### Health Check

#### `GET /api/health`
Check if the API is running.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Drop Me Recycling API is running",
  "timestamp": "2026-01-14T21:50:00.000Z",
  "version": "1.0.0"
}
```

---

### Users

#### `POST /api/users/register`
Register a new user.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phoneNumber | string | Yes | Phone number in international format (e.g., +201234567890) |
| name | string | Yes | User's name (2-100 characters) |

**Example Request:**
```json
{
  "phoneNumber": "+201234567890",
  "name": "Ahmed Hassan"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phoneNumber": "+201234567890",
    "name": "Ahmed Hassan",
    "totalPoints": 0,
    "createdAt": "2026-01-14 21:50:00"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR` - Invalid input data
- `409 USER_EXISTS` - Phone number already registered

---

#### `POST /api/users/identify`
Identify an existing user by phone number.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phoneNumber | string | Yes | Registered phone number |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phoneNumber": "+201234567890",
    "name": "Ahmed Hassan",
    "totalPoints": 45,
    "createdAt": "2026-01-14 21:50:00"
  }
}
```

**Error Responses:**
- `404 USER_NOT_FOUND` - User not found

---

#### `GET /api/users/:userId`
Get user details by ID.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | UUID | User's unique identifier |

**Response:** `200 OK`

---

#### `GET /api/users/leaderboard`
Get top users by points.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 10 | Number of users to return (max 100) |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Ahmed Hassan",
      "totalPoints": 150
    }
  ]
}
```

---

### Transactions

#### `GET /api/transactions/points-config`
Get the current points configuration for each item type.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "pointsPerItem": {
      "plastic_bottle": 10,
      "aluminum_can": 15,
      "glass_bottle": 20
    }
  }
}
```

---

#### `POST /api/transactions/recycle`
Create a new recycling transaction.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | UUID | Yes | User's unique identifier |
| itemType | string | Yes | One of: `plastic_bottle`, `aluminum_can`, `glass_bottle` |
| itemBarcode | string | No | Item barcode (8-50 characters) |
| machineId | string | Yes | Recycling machine identifier |

**Example Request:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "itemType": "plastic_bottle",
  "itemBarcode": "5901234123457",
  "machineId": "MACHINE-CAIRO-001"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Recycling transaction completed successfully",
  "data": {
    "transaction": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "itemType": "plastic_bottle",
      "itemBarcode": "5901234123457",
      "pointsEarned": 10,
      "machineId": "MACHINE-CAIRO-001",
      "createdAt": "2026-01-14 21:55:00"
    },
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Ahmed Hassan",
      "totalPoints": 55
    }
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR` - Invalid input data
- `404 USER_NOT_FOUND` - User does not exist
- `409 DUPLICATE_SCAN` - Item barcode already recycled
- `429 RAPID_SCANNING` - Too many scans in short time (fraud prevention)

---

#### `GET /api/transactions/user/:userId`
Get all transactions for a user.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | UUID | User's unique identifier |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Number of transactions (max 100) |
| offset | integer | 0 | Pagination offset |

**Response:** `200 OK`

---

#### `GET /api/transactions/:transactionId`
Get a specific transaction by ID.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| transactionId | UUID | Transaction's unique identifier |

**Response:** `200 OK`

---

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation error |
| 404 | Not Found |
| 409 | Conflict - Duplicate resource |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

## Error Codes

| Code | Description |
|------|-------------|
| VALIDATION_ERROR | Input validation failed |
| USER_NOT_FOUND | User does not exist |
| USER_EXISTS | Phone number already registered |
| TRANSACTION_NOT_FOUND | Transaction does not exist |
| DUPLICATE_SCAN | Item barcode already recycled |
| RAPID_SCANNING | Too many scans in short time |
| RATE_LIMIT_EXCEEDED | API rate limit exceeded |
| NOT_FOUND | Route not found |
| INTERNAL_ERROR | Unexpected server error |
