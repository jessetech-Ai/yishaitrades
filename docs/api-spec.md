# YishaiEdge Production API Spec

This app currently ships as a complete static, local-first product. Use this API contract when moving to a multi-user SaaS backend.

## Auth

### POST `/api/auth/register`
Request:
```json
{ "email": "trader@example.com", "password": "Password123!", "displayName": "Yishai" }
```
Response:
```json
{ "user": { "id": "uuid", "email": "trader@example.com" }, "accessToken": "jwt", "refreshToken": "jwt" }
```

### POST `/api/auth/login`
Request:
```json
{ "email": "trader@example.com", "password": "Password123!" }
```

### POST `/api/auth/refresh`
Request:
```json
{ "refreshToken": "jwt" }
```

### POST `/api/auth/logout`
Client deletes tokens. Server revokes refresh token if using token storage.

## Trades

### POST `/api/trades`
Creates one trade. Validate positive prices, positive quantity, date order, and authenticated ownership.

```json
{
  "accountId": "uuid",
  "symbol": "EURUSD",
  "side": "long",
  "entryPrice": 1.085,
  "exitPrice": 1.089,
  "quantity": 1,
  "fees": 0,
  "entryDate": "2024-01-15T14:30:00Z",
  "exitDate": "2024-01-15T16:45:00Z",
  "strategy": "Breakout",
  "emotion": "confident",
  "disciplineRating": 5,
  "notes": "Strong support bounce."
}
```

### GET `/api/trades`
Query params:

- `page`, `limit`
- `symbol`
- `strategy`
- `status`
- `side`
- `startDate`, `endDate`
- `result=win|loss|breakeven`
- `search`

Example:
`/api/trades?symbol=EURUSD&strategy=Breakout&startDate=2024-01-01&endDate=2024-01-31`

### PATCH `/api/trades/:id`
Updates one owned trade. Recompute cached stats after successful update.

### DELETE `/api/trades/:id`
Soft delete only:
```sql
UPDATE trades SET deleted_at = NOW() WHERE id = $1 AND user_id = $2;
```

### POST `/api/trades/bulk-import`
Accepts CSV upload, validates every row, inserts valid rows transactionally, returns row-level errors.

## Analytics

### GET `/api/analytics/summary`
Returns cached user/account stats.

### GET `/api/analytics/strategy`
Returns per-strategy stats.

### GET `/api/analytics/timeline`
Returns daily/weekly P&L points.

### GET `/api/analytics/heatmap`
Returns day/hour profitability matrix.

## Export

### GET `/api/export/csv`
Returns `text/csv` with all trades matching filters.

### GET `/api/export/pdf`
Generates monthly performance report.

## Security Defaults

- Passwords: bcrypt or Argon2, never plaintext.
- Tokens: access token 15 minutes, refresh token 7 days.
- Rate limit: auth endpoints 5/min/IP, write endpoints 60/min/user.
- Audit: never hard-delete trades; use `deleted_at`.
- Input validation: zod/joi on every endpoint.
- Ownership: every query includes `user_id` from JWT claims.