import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Game from "../pages/Game";
import Game2 from "../pages/Game2";
import Lobby from "../pages/Lobby"; // ✅ added
import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} /> {/* ✅ added */}
        <Route path="/game" element={<ProtectedRoute><Game /></ProtectedRoute>} />
		<Route path="/game2" element={<ProtectedRoute><Game2 /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
