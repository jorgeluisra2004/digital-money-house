"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AppLayout({ children }) {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session?.user) router.replace("/login");
  }, [loading, session, router]);

  if (loading || !session?.user) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-600">
        Cargando…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#efefef]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
