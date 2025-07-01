// Register.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ 
    username: "", 
    email: "",
    password: "", 
    confirm: "" 
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
	if (form.password.length < 6) {
    setError("Password must be at least 6 characters");
    setIsLoading(false);
    return;
}

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          username: form.username, 
          email: form.email,
          password: form.password 
        }),
      });

	if (!res.ok) {
	let errorMessage = "Registration failed";
	try {
		const data = await res.json();
		console.error("Registration failed - Server response:", data);
		errorMessage = data?.error || data?.message || res.statusText || errorMessage;
	} catch (parseError) {
		console.error("Failed to parse error response:", parseError);
		errorMessage = res.statusText || errorMessage;
	}

	throw new Error(errorMessage);
}


      navigate("/login");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-2 sm:p-4">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Animated Neon Lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-30 animate-pulse"></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-400 to-transparent opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute left-0 top-1/3 w-full h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating Cyber Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-amber-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-1/2 right-1/2 w-64 h-64 bg-red-500 rounded-full mix-blend-screen filter blur-xl opacity-15 animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Digital Rain Effect */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-cyan-400 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${Math.random() * 3 + 2}s`
            }}
          ></div>
        ))}
      </div>

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-30 animate-ping"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white font-mono tracking-wider mb-2 drop-shadow-2xl">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 bg-clip-text text-transparent animate-pulse">
              CYBER PONG
            </span>
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 mx-auto rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
        </div>

        {/* Form Container */}
        <div className="relative">
          {/* Glowing border effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 rounded-lg blur opacity-30"></div>
          
          <form
            onSubmit={handleSubmit}
            className="relative bg-black/80 backdrop-blur-sm border-2 border-cyan-500/50 p-6 sm:p-8 rounded-lg shadow-2xl shadow-cyan-500/25 before:absolute before:inset-0 before:bg-gradient-to-br before:from-cyan-500/10 before:to-purple-500/10 before:rounded-lg before:-z-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center font-mono tracking-wide">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                REGISTER USER
              </span>
            </h2>

            {error && (
              <div className="mb-6 p-3 bg-red-900/50 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-300 text-center font-mono">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="relative">
                <label className="block mb-2 text-sm font-medium text-cyan-300 font-mono tracking-wide">
                  USERNAME
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-800/50 border border-cyan-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 font-mono"
                  placeholder="Enter your username"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>

              <div className="relative">
                <label className="block mb-2 text-sm font-medium text-purple-300 font-mono tracking-wide">
                  EMAIL
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-800/50 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 font-mono"
                  placeholder="Enter your email"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>

              <div className="relative">
                <label className="block mb-2 text-sm font-medium text-amber-300 font-mono tracking-wide">
                  PASSWORD
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-800/50 border border-amber-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300 font-mono"
                  placeholder="Enter your password"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>

              <div className="relative">
                <label className="block mb-2 text-sm font-medium text-red-300 font-mono tracking-wide">
                  CONFIRM PASSWORD
                </label>
                <input
                  type="password"
                  name="confirm"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-800/50 border border-red-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 transition-all duration-300 font-mono"
                  placeholder="Confirm your password"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

              <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 relative overflow-hidden bg-gradient-to-r from-cyan-600 via-purple-600 to-amber-600 text-black font-black py-4 px-6 rounded-lg font-mono tracking-wide text-lg hover:from-cyan-400 hover:via-purple-400 hover:to-amber-400 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50 border border-cyan-400/50"
            >
              <span className="relative z-10 drop-shadow-sm">
                {isLoading ? "REGISTERING..." : "REGISTER"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <div className="mt-6 text-center">
				<p className="text-gray-400 font-mono text-sm">
				&gt; ALREADY REGISTERED?{" "}
				<Link 
					to="/login" 
					className="text-cyan-400 hover:text-cyan-300 underline hover:no-underline transition-all duration-300 font-bold animate-pulse"
				>
					[LOGIN]
				</Link>
				</p>
            </div>
          </form>
        </div>

        {/* Footer decoration */}
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