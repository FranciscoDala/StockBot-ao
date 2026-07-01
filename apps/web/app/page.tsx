"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react"; // <- Ícone de loading do lucide

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login"); // <- Joga direto pro login
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-green-500" />
        {/* ^ Esse é o spinner girando */}
      </div>
    </main>
  );
}