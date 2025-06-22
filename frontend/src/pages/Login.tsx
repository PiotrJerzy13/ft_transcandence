import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // store cookie!
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Login successful:", data);
        navigate("/lobby");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background & Grid */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-amber-500 rounded-full blur-xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[50px_50px]"></div>
      </div>

      {/* Login Form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white font-mono tracking-wider mb-2 drop-shadow-2xl">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 bg-clip-text text-transparent animate-pulse">
              CYBER PONG
            </span>
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 mx-auto rounded-full animate-pulse shadow-lg shadow-cyan-400/50" />
          {/* <div className="text-xs text-gray-400 font-mono mt-2 tracking-widest opacity-60">
            &gt; INITIALIZE_AUTH_PROTOCOL &lt;
          </div> */}
        </div>

        <div className="relative bg-black/80 backdrop-blur-sm border-2 border-cyan-500/50 p-8 rounded-lg shadow-2xl shadow-cyan-500/25">
          {error && (
            <div className="mb-6 p-3 bg-red-900/50 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-300 text-center font-mono">&gt; ERROR: {error} &lt;</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-cyan-300 font-mono tracking-wide">
                &gt; USERNAME INPUT
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                placeholder="Enter username..."
                className="w-full bg-black/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-cyan-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 font-mono shadow-inner"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-purple-300 font-mono tracking-wide">
                &gt; PASSWORD INPUT
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter password..."
                className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-4 py-3 text-purple-100 placeholder-gray-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 font-mono shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 relative overflow-hidden bg-gradient-to-r from-cyan-600 via-purple-600 to-amber-600 text-black font-black py-4 px-6 rounded-lg font-mono tracking-wide text-lg hover:from-cyan-400 hover:via-purple-400 hover:to-amber-400 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50 border border-cyan-400/50"
            >
              <span className="relative z-10 drop-shadow-sm">
                {isLoading ? "> AUTHENTICATING... <" : "> LOGIN <"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 font-mono text-sm">
              &gt; ARE YOU NEW HERE ?{" "}
              <a
                href="/register"
                className="text-cyan-400 hover:text-cyan-300 underline hover:no-underline transition-all duration-300 font-bold animate-pulse"
              >
                [REGISTER HERE]
              </a>
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <div className="flex justify-center space-x-3 opacity-60">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse shadow-lg shadow-purple-400/50" style={{ animationDelay: '0.5s' }}></div>
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/50" style={{ animationDelay: '1s' }}></div>
          </div>
          <div className="text-xs text-gray-500 font-mono mt-3 tracking-widest">
            SYSTEM_STATUS: [ONLINE] | AUTH_MODULE: [ACTIVE]
          </div>
        </div>
      </div>
    </div>
  );
}
