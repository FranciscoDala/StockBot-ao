"use client"; // <- 1. ESSA LINHA RESOLVE TUDO

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner"; // <- 2. Importa o Toaster do sonner

const LOGIN_ROUTE = "/";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter(); // <- 3. Agora pode usar hook

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace(LOGIN_ROUTE);
  };

  return (
    <div className="p-6">
      <header className="flex items-center justify-between border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold">StockBot Admin</h2>
        
        <Button 
          variant="destructive" 
          size="sm" 
          className="gap-2 shadow-md bg-red-600 hover:bg-red-700 text-white"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" /> Sair
        </Button>
      </header>
      {children}

      {/* 4. Toaster tem que ficar aqui, 1 vez só no layout */}
      <Toaster richColors position="top-right" /> 
    </div>
  )
}