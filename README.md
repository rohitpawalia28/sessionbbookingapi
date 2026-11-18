# Session Booking API

A REST API for a platform where teachers create sessions, users book them, and completed sessions appear in the user's history.

**Stack:** Node.js, TypeScript, Express.js 5, MongoDB, Mongoose 8, Zod (request validation).

## Setup

### Prerequisites

- Node.js 18 or newer
- MongoDB **5.0 or newer** (local, or a free MongoDB Atlas cluster). The aggregation pipelines use `$dateTrunc` and `$dateDiff`, which were added in MongoDB 5.0.

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file and set MONGODB_URI
cp .env.example .env

# 3. Start in development mode (auto-restarts on changes)
npm run dev
```

The API runs at `http://localhost:5000`. Check it with `GET /health`.

For a production build:

```bash
npm run build
npm start
```

### Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `MONGODB_URI` | Yes | – | MongoDB connection string |
| `PORT` | No | `5000` | Port the server listens on |
| `APP_TIMEZONE` | No | `Asia/Kolkata` | IANA time zone that decides which calendar day a timestamp belongs to |
| `NODE_ENV` | No | `development` | `production` hides internal error messages |

## Testing with Postman

1. Import `postman/Session-Booking-API.postman_collection.json` into Postman.
2. Start the server (`npm run dev`).
3. Open the collection and click **Run** to run all requests in order.

The collection covers every API, including the failure cases (duplicate email, double booking, invalid state changes, missing records, bad input). Each request has automatic tests, and requests save `teacherId`, `userId` and `sessionId` for the ones that follow. Change `baseUrl` in the collection variables if your server uses a different port.

## API reference

Every response uses the same shape:

```json
{ "success": true, "data": { } }
{ "success": false, "error": { "message": "...", "details": [ { "field": "email", "message": "..." } ] } }
```

### Create Teacher (helper)

`POST /teachers`

Not one of the six required APIs, but a session needs an existing teacher, so this makes the API testable end to end.

```json
{ "fullName": "Anita Sharma", "email": "anita@example.com", "specialization": "Mathematics", "experience": 8 }
```

Returns `201 Created`.

### API 1: Create User

`POST /users`

```json
{ "fullName": "Rahul Verma", "email": "rahul@example.com", "phone": "+919876543210" }
```

- `201 Created` with the new user
- `400` if a field is missing or invalid
- `409` if the email is already registered

### API 2: Create Session

`POST /sessions`

```json
{ "teacherId": "665f1c...", "startTime": "2026-11-20T10:00:00+05:30", "endTime": "2026-11-20T11:00:00+05:30" }
```

`startTime` and `endTime` accept an ISO 8601 string or epoch milliseconds. Status starts as `AVAILABLE`.

- `201 Created` with the new session
- `400` if `endTime` is not after `startTime`, or input is invalid
- `404` if the teacher does not exist
- `409` if it overlaps another session of the same teacher

### API 3: Available Sessions for Booking

`GET /sessions/available?dateTimestamp=1795154400000`

Returns every `AVAILABLE` session that starts on the same calendar day as `dateTimestamp`, sorted by start time, with teacher details and duration. `dateTimestamp` is a Unix timestamp in milliseconds (13 digits) or seconds (10 digits); any moment of the wanted day works. The day is judged in `APP_TIMEZONE`.

Built with the **MongoDB aggregation pipeline**: `$match` → `$match` with `$dateTrunc` → `$sort` → `$lookup` (teacher) → `$unwind` → `$project`.

- `200 OK` with `count` and `data`
- `400` if `dateTimestamp` is missing or not a valid timestamp

### API 4: Book Session

`POST /sessions/:id/book`

```json
{ "userId": "665f1d..." }
```

- `200 OK` with the session, now `BOOKED` and linked to the user
- `404` if the user or the session does not exist
- `409` if the session is already booked or completed

### API 5: Mark Session Complete

`PATCH /sessions/:id/complete`

- `200 OK` with the session, now `COMPLETED`, with `completedAt` set
- `404` if the session does not exist
- `409` if the session is not `BOOKED`

### API 6: User Session List

`GET /users/:id/sessions`

```json
{
  "success": true,
  "data": {
    "upcomingSessions": [ ],
    "completedSessions": [ ],
    "counts": { "upcoming": 1, "completed": 2 }
  }
}
```

Upcoming sessions are the user's `BOOKED` sessions, soonest first. Completed sessions are `COMPLETED`, most recently completed first. Each includes teacher details.

Built with the **MongoDB aggregation pipeline**: `$match` → `$lookup` (teacher) → `$unwind` → `$project` → `$facet` (splits into the two lists in one query).

- `200 OK`
- `400` if the id is not a valid ObjectId
- `404` if the user does not exist

## Design decisions

- **No double booking, even under concurrent requests.** Booking uses one atomic `findOneAndUpdate` whose filter is `{ _id, status: "AVAILABLE" }`. If two users book the same session at the same moment, only one update matches; the other gets `409`. Completing a session uses the same pattern with `status: "BOOKED"`. A read-then-write check would have a race window.
- **Unique email enforced by the database.** A unique index on `email` rejects duplicates, and the error handler converts MongoDB error `11000` into `409 Conflict`. This is also race-safe, unlike checking first and then inserting.
- **Index-friendly date filtering.** API 3 first matches on `status` and a ±24-hour `startTime` range, so MongoDB can use the `{ status, startTime }` index. A second stage then keeps only sessions on exactly that calendar day using `$dateTrunc` with the configured time zone. Without a time zone, a session at 1 AM IST would count as the previous day in UTC.
- **One query for the user's history.** API 6 uses `$facet` to build the upcoming and completed lists in a single round trip.
- **Indexes** match the queries: `{ status, startTime }` for available sessions, `{ userId, status, startTime }` for a user's history, and `{ teacherId, startTime }` for the overlap check.
- **Validation at the edge.** Zod validates every body, path parameter and query string, and returns all field errors at once with `400`. Mongoose schema validation is a second line of defence.
- **Centralized error handling.** Services throw `AppError` (400/404/409). One error handler formats every error, including invalid JSON, Mongoose validation and cast errors, duplicate keys, and unknown routes. Express 5 forwards errors from `async` handlers automatically, so no try/catch wrappers are needed.
- **Layered structure.** Routes → controllers (HTTP and validation) → services (business rules and queries) → models.
- **Overlap check (addition).** A teacher cannot create two sessions that overlap in time.

## Project structure

```
src/
  app.ts                  Express app, middleware, routes
  server.ts               Starts the server, connects to MongoDB, graceful shutdown
  config/                 Environment variables, database connection
  models/                 Mongoose schemas: User, Teacher, Session
  validators/             Zod schemas for request validation
  services/               Business rules and aggregation pipelines
  controllers/            Request handlers
  routes/                 Route definitions
  middlewares/            Central error handler, 404 handler
  utils/                  AppError, validate helper
postman/                  Postman collection
```
