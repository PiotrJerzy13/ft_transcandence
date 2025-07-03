import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Game from "../pages/Game";
import ArkanoidGame from "../pages/Game2";
import Lobby from "../pages/Lobby";
import ProtectedRoute from "../components/ProtectedRoute";
import Leaderboard from '../pages/Leaderboard';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
		<Route path="/game" element={<ProtectedRoute><Game /></ProtectedRoute>} />
		<Route path="/game2" element={<ProtectedRoute><ArkanoidGame /></ProtectedRoute>} />
		<Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
