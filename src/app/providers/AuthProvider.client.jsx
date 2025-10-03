"use client";
import { AuthProvider } from "@/context/AuthContext";

export default function ClientAuthProvider({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
