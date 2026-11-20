// Local development continues to work without a .env file. In Vercel,
// VITE_API_URL is set to the public Railway backend URL.
const localApiUrl = "http://127.0.0.1:5000";

export const API_URL = (
  import.meta.env.VITE_API_URL || localApiUrl
).replace(/\/+$/, "");
