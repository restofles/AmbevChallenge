import axios from "axios";
import { parseCookies } from "nookies";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:44313",
});

api.interceptors.request.use((config) => {
  const { token } = parseCookies();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
