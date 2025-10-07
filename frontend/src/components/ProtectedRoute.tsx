import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { usePlayerData } from "../context/PlayerDataContext";

export default function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { refetch } = usePlayerData();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("[ProtectedRoute] Checking authentication...");
        const res = await fetch("/api/user/me", {
          credentials: "include", // Needed for sending cookies!
        });
        
        console.log("[ProtectedRoute] Auth check result:", res.ok);
        
        if (res.ok) {
          setIsAuthenticated(true);
          // Trigger player data fetch since user is authenticated and accessing protected route
          console.log("[ProtectedRoute] Auth successful, triggering player data fetch");
          refetch();
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthenticated(false);
      } finally {
        // Add delay to ensure cookies are properly set
        setTimeout(() => setIsLoading(false), 200);
      }
    };

    checkAuth();
  }, [refetch]);

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