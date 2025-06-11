import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import GameWithRouter from "../components/GameWithRouter";
import Game2WithRouter from "../components/Game2WithRouter";
import Lobby from "../pages/Lobby";
import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} /> {/* ✅ added */}
        <Route path="/game" element={<ProtectedRoute><GameWithRouter /></ProtectedRoute>} />
		<Route path="/game2" element={<ProtectedRoute><Game2WithRouter /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
