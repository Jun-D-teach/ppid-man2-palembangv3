import axios from "axios";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || window.location.origin
).replace(/\/$/, "");

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
});

apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  },
);

export const api = apiInstance;
export default apiInstance;

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getUploadUrl = (fileNameOrUrl) => {
  if (!fileNameOrUrl) return "#";
  if (/^https?:\/\//i.test(fileNameOrUrl)) return fileNameOrUrl;

  const safePath = String(fileNameOrUrl).replace(/^\/uploads\//, "");
  return encodeURI(`${API_BASE_URL}/uploads/${safePath}`);
};
