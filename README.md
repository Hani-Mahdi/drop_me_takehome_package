# Drop Me Recycling API

A backend service for the Drop Me recycling machine system that enables users to scan, recycle, and earn points.

## Tasks Implemented

This project implements **Task 1 (Core Recycling Flow)** and **Task 2 (API Design + Validation Layer)** from the Drop Me internship assignment.

---

## Architecture Overview

```
Client (Mobile App / Recycling Machine)
              |
              | HTTP/JSON
              v
+----------------------------------+
|        Express.js Server         |
+----------------------------------+
|  - Helmet (security headers)     |
|  - CORS (cross-origin requests)  |
|  - Rate Limiting                 |
|  - JSON body parsing             |
+----------------------------------+
              |
              v
+----------------------------------+
|           Routes                 |
|  /api/users                      |
|  /api/transactions               |
+----------------------------------+
              |
              v
+----------------------------------+
|           Logic                  |
|  - Database functions            |
|  - Request handlers              |
|  - Validation rules              |
|  - Fraud prevention checks       |
+----------------------------------+
              |
              v
+----------------------------------+
|         SQLite Database          |
+----------------------------------+
```

### Why I Made These Choices

1. **SQLite**: Easy to set up, no need to install a separate database server. The database is just a file.

2. **Simple folder structure**: Everything related to users is in one file, everything related to transactions is in another. Easy to find things.

3. **Validation with express-validator**: Checks if the data sent to the API is correct before processing it.

4. **Fraud prevention**: Checks for duplicate barcodes and users scanning too fast.

---

## Setup & Run Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd drop_me

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment mode |
| DATABASE_PATH | ./data/dropme.db | SQLite database path |
| POINTS_PER_PLASTIC_BOTTLE | 10 | Points for plastic bottles |
| POINTS_PER_ALUMINUM_CAN | 15 | Points for aluminum cans |
| POINTS_PER_GLASS_BOTTLE | 20 | Points for glass bottles |
| RATE_LIMIT_WINDOW_MS | 60000 | Rate limit window (ms) |
| RATE_LIMIT_MAX_REQUESTS | 100 | Max requests per window |
| MIN_SCAN_INTERVAL_SECONDS | 5 | Min time between scans |

---

## API Endpoints

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/users/register | Register new user |
| POST | /api/users/identify | Identify user by phone |
| GET | /api/users/:userId | Get user details |
| GET | /api/users/leaderboard | Get top users |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/transactions/recycle | Create recycling transaction |
| GET | /api/transactions/points-config | Get points per item type |
| GET | /api/transactions/user/:userId | Get user's transactions |
| GET | /api/transactions/:transactionId | Get transaction details |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |

See [docs/api-documentation.md](docs/api-documentation.md) for full API documentation.

---

## Sample API Requests

### Register a User
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+201234567890", "name": "Ahmed Hassan"}'
```

### Create Recycling Transaction
```bash
curl -X POST http://localhost:3000/api/transactions/recycle \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "itemType": "plastic_bottle",
    "itemBarcode": "5901234123457",
    "machineId": "MACHINE-CAIRO-001"
  }'
```

### Check Points Configuration
```bash
curl http://localhost:3000/api/transactions/points-config
```

See [api-requests.http](api-requests.http) for more examples (compatible with VS Code REST Client).

---

## Validation & Business Rules

### Input Validation
- **Phone Number**: International format validation (regex: `^\+?[1-9]\d{7,14}$`)
- **User ID**: UUID format validation
- **Item Type**: Enum validation (`plastic_bottle`, `aluminum_can`, `glass_bottle`)
- **Barcode**: Length validation (8-50 characters)

### Business Rules Enforced

1. **Duplicate Scan Prevention**: Each barcode can only be recycled once. Attempting to recycle the same barcode returns `409 DUPLICATE_SCAN`.

2. **Rapid Scanning Detection**: Users must wait a configurable interval (default 5 seconds) between scans. Prevents fraud from rapid-fire scanning. Returns `429 RAPID_SCANNING`.

3. **Rate Limiting**: Global rate limit of 100 requests per minute per IP to prevent abuse.

4. **Unique Phone Numbers**: Each phone number can only be registered once.

---

## Project Structure

```
drop_me/
├── src/
│   ├── config/
│   │   └── index.js          # Settings from .env file
│   ├── database/
│   │   └── index.js          # Database setup and tables
│   ├── logic/
│   │   ├── users.js          # User functions and handlers
│   │   ├── transactions.js   # Transaction functions and handlers
│   │   └── helpers.js        # Validation and error handling
│   ├── routes/
│   │   ├── userRoutes.js     # User API endpoints
│   │   └── transactionRoutes.js
│   └── index.js              # Main app file
├── docs/
│   └── api-documentation.md
├── data/                     # Database file (auto-created)
├── .env
├── .env.example
├── api-requests.http
├── package.json
└── README.md
```

---

## Points System

| Item Type | Points Earned |
|-----------|---------------|
| Plastic Bottle | 10 |
| Aluminum Can | 15 |
| Glass Bottle | 20 |

Points are configurable via environment variables and automatically added to the user's total upon successful recycling.

---

## Assumptions & Trade-offs

### Assumptions
1. **Single Machine Context**: The API assumes transactions come from trusted recycling machines. In production, machine authentication would be required.
2. **Phone-based Identity**: Users are identified by phone number. A real system might use QR codes, NFC cards, or app-based authentication.
3. **Barcode Uniqueness**: Barcodes are assumed globally unique. In reality, product barcodes repeat, so a combination of barcode + timestamp window might be needed.

### Trade-offs

| Decision | Trade-off |
|----------|-----------|
| **SQLite** | Simple setup, no external dependencies. Not suitable for horizontal scaling or high write concurrency. |
| **Synchronous DB** | Simpler code, but blocks event loop. Fine for moderate load; async driver needed for high throughput. |
| **In-memory Rate Limiting** | Works for single instance. Distributed systems need Redis-based rate limiting. |
| **No Authentication** | Simplified for demo. Production needs JWT/OAuth for API security. |
| **UUID Primary Keys** | Globally unique, no coordination needed. Slightly larger than auto-increment integers. |

---

## What I Would Improve With More Time

1. **Authentication & Authorization**: JWT-based auth for users and API keys for machines.
2. **Async Database Driver**: Switch to `better-sqlite3` async wrapper or PostgreSQL for production.
3. **Redis Integration**: For distributed rate limiting and caching.
4. **Comprehensive Testing**: Unit tests for models, integration tests for API endpoints.
5. **Docker Compose**: Full containerization with database persistence.
6. **OpenAPI/Swagger**: Auto-generated interactive API documentation.
7. **Logging & Monitoring**: Structured logging with Winston, metrics with Prometheus.
8. **Webhook Support**: Notify external systems on recycling events.

---

## License

MIT
