"use client";

import { useRouter } from "next/navigation";
import Auth from "../Auth"; // Pulling your Auth component from src/app/Auth.js

export default function AuthPage() {
  const router = useRouter();

  // When Auth.js reports a successful login, push the user to the dashboard
  const handleSuccess = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* We wrap your existing Auth component here */}
      <Auth onAuthSuccess={handleSuccess} />
    </div>
  );
}