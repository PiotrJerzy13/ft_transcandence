import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import GameWithRouter from "../components/GameWithRouter";
import Game2WithRouter from "../components/Game2WithRouter";
import Lobby from "../pages/Lobby";
import ProtectedRoute from "../components/ProtectedRoute";
import Leaderboard from '../pages/Leaderboard';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
        <Route path="/game" element={<ProtectedRoute><GameWithRouter /></ProtectedRoute>} />
		<Route path="/game2" element={<ProtectedRoute><Game2WithRouter /></ProtectedRoute>} />
		<Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
