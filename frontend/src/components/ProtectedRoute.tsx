import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { API_ENDPOINTS } from "../config/api";

export default function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.PROFILE, {
          credentials: "include", // Needed for sending cookies!
        });
        setIsAuthenticated(res.ok);
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}