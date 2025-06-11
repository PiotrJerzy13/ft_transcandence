// src/components/Game2WithRouter.tsx
import { useNavigate } from "react-router-dom";
import Game2 from "../pages/Game";

export default function Game2WithRouter() {
  const navigate = useNavigate();
  return <Game2 onNavigateToLobby={() => navigate("/lobby")} />;
}