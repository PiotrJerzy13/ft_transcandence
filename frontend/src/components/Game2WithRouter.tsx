// src/components/Game2WithRouter.tsx
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Arkanoid from "../pages/Game2";

export default function Game2WithRouter() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Game2WithRouter mounted');
    return () => console.log('Game2WithRouter unmounted');
  }, []);

  return (
    <div className="w-full h-full">
      <Arkanoid onNavigateToLobby={() => navigate("/lobby")} />
    </div>
  );
}
