import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/user/me", {
          credentials: "include", // Needed for sending cookies!
        });
        setIsAuthenticated(res.ok);
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthenticated(false);
      } finally {
        // Add small delay to ensure cookies are properly set
        setTimeout(() => setIsLoading(false), 100);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 font-mono">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}