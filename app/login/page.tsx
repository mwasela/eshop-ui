
"use client";
import { useState } from "react";
import Link from "next/link";
import axiosInstance from "@/helpers/axios";
import { message } from "antd";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.post("/login", {
        email,
        password,
      });
      
      const { token } = response.data;
      localStorage.setItem("token", token);
      message.success("Login successful");
      window.location.href = "/home";
    } catch (err: any) {
        //console.error("Login error:", err);
      setError(err?.response?.data?.message || "Login failed");
        message.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-100">
      <div className="flex items-center gap-3 mt-12 mb-8">
        <img src="/icon.png" alt="Logo" className="w-10 h-10 object-contain" />
        <span className="text-3xl font-bold text-blue-700">Login to Sales Portal</span>
      </div>
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">Login</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="px-4 py-2 border border-zinc-300 rounded focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="px-4 py-2 border border-zinc-300 rounded focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/" className="text-blue-600 hover:underline text-sm">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
