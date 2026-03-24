/** FastAPI base URL. Set `NEXT_PUBLIC_API_URL` on Vercel to your deployed backend. */
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/+$/, "")
