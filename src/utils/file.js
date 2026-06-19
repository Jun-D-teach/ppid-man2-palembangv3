const BASE_URL = import.meta.env.VITE_API_URL || window.location.origin;

export const fileUrl = (path) => {
  if (!path) return "#";

  if (path.startsWith("http")) return path;

  const cleanPath = path.replace(/^\/?uploads\//, "");

  return `${BASE_URL}/uploads/${cleanPath}`;
};
