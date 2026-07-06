"use client";

import { Button } from "@/components/ui/button";
import { LogOut, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";

const LOGIN_ROUTE = "/login";

// FUNÇÃO MANUAL
const deleteCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const handleLogout = () => {
        deleteCookie('token');
        deleteCookie('user');
        deleteCookie('temp_token');
        deleteCookie('lojas_temp');
        deleteCookie('user_temp');
        router.replace(LOGIN_ROUTE);
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="p-6 max-w-7xl mx-auto">
                <header className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Store className="h-8 w-8 text-green-500" />
                        <h2 className="text-2xl font-bold">StockBot Admin</h2>
                    </div>
                    <Button variant="destructive" size="sm" className="gap-2 shadow-md bg-red-600 hover:bg-red-700 text-white" onClick={handleLogout}>
                        <LogOut className="w-4 h-4" /> Sair
                    </Button>
                </header>
                {children}
                <Toaster richColors position="top-right" />
            </div>
        </div>
    )
}
