"use client";
import { useParams, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LojaDashboardPage() {
  const { slug } = useParams(); // Aqui vem: "connect-teste"
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user'); 
    router.replace('/'); // Manda pro login
  };

  return (
    <div className="p-6">
      <header className="flex justify-between items-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold">Loja: {slug}</h1>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
          <LogOut size={16} /> Terminar Sessão
        </button>
      </header>
      Conteúdo do dashboard aqui...
    </div>
  );
}