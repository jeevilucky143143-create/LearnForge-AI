import axios from "axios";
import { getCookie } from "./cookies";

const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
const baseURL = envApiUrl
  ? (envApiUrl.endsWith("/api/v1") ? envApiUrl : `${envApiUrl.replace(/\/$/, "")}/api/v1`)
  : "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically inject JWT token into all requests if cookie exists
api.interceptors.request.use(
  (config) => {
    const token = getCookie("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
