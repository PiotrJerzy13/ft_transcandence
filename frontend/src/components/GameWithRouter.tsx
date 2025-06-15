// src/components/GameWithRouter.tsx
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Game from "../pages/Game";

export default function GameWithRouter() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log('GameWithRouter mounted');
    return () => console.log('GameWithRouter unmounted');
  }, []);

  return (
    <div className="w-full h-full">
      <Game onNavigateToLobby={() => navigate("/lobby")} />
    </div>
  );
}