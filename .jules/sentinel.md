## 2024-06-11 - Rate Limiting Authentication Endpoints
**Vulnerability:** Authentication endpoints (/login and /signup) lacked strict rate limiting, making them susceptible to brute-force and credential stuffing attacks.
**Learning:** High-value authentication endpoints require dedicated, strict rate limiting separate from the general API rate limit to prevent targeted attacks. The general API limit (500 requests per 15 minutes) was too permissive for auth endpoints.
**Prevention:** Apply dedicated rate-limiting middleware using `express-rate-limit` with low thresholds (e.g., 10 requests per 15 minutes) specifically to sensitive endpoints like authentication.
