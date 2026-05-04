import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

const API: AxiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000") + "/api",
  withCredentials: true,
});

API.interceptors.request.use((req: InternalAxiosRequestConfig) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  console.log("🔐 API Interceptor - Token found:", !!token);

  if (token && req.headers) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("✅ API Success:", response.config.url);
    return response;
  },
  (error: AxiosError) => {
    console.error("❌ API Error:", error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);

export default API;