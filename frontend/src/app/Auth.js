"use client";

import { useState } from "react";

export default function Auth({ onAuthSuccess }) {
  // 1. React 'Memory' (State)
  const [isLogin, setIsLogin] = useState(true); // True = Show Login, False = Show Sign Up
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 2. The Submit Button Function
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stops the page from refreshing
    
    // Step A: Decide which door to knock on (Login or Signup)
    const endpoint = isLogin ? "/api/login" : "/api/signup";
    const url = `http://localhost:8000${endpoint}`;

    try {
      // Step B: Send the email and password to Python
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password }),
      });

      const data = await response.json();

      // Step C: Did Python approve the request?
      if (response.ok) {
        if (isLogin) {
          // They logged in successfully! Save the hotel keycard.
          localStorage.setItem("marketing_token", data.access_token);
          
          // Tell the main page to unlock the dashboard
          onAuthSuccess(); 
        } else {
          // They signed up successfully! Switch the form to the Login screen.
          alert("Account created successfully! Please log in.");
          setIsLogin(true); 
          setPassword(""); // Clear the password box for safety
        }
      } else {
        // Python rejected it (wrong password, email taken, etc.)
        alert(data.detail || "Something went wrong.");
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("Could not connect to the backend server.");
    }
  };

  // 3. The Visual UI
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-96 border border-gray-200">
        
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {isLogin ? "Welcome Back" : "Create an Account"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 bg-white placeholder-gray-400"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 bg-white placeholder-gray-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        {/* Toggle Button between Login and Sign Up */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-blue-600 hover:underline"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Log in"}
          </button>
        </div>

      </div>
    </div>
  );
}