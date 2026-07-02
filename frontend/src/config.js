// If a live environment variable exists, use it. Otherwise, fallback to local development.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";