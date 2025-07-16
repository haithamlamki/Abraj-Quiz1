import { useState } from "react";
import { useRouter } from "next/router";

export default function ManagerLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Redirect if already manager
  if (typeof window !== "undefined" && localStorage.getItem("isManager") === "true") {
    router.replace("/manager");
    
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "1234") {
      localStorage.setItem("isManager", "true");
      router.push("/manager");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#222c36]">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
        <h1 className="text-3xl font-bold text-[#04A2C9] mb-6 text-center">Manager Login</h1>
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            className="border rounded px-3 py-2 text-gray-900"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border rounded px-3 py-2 text-gray-900"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-red-600 font-bold text-center">{error}</div>}
          <button type="submit" className="main-btn px-6 py-2 text-lg font-bold mt-2">Login</button>
        </form>
      </div>
    </div>
  );
} 