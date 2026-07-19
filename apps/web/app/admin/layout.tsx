"use client";

import { Button } from "@/components/ui/button";
import { LogOut, Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";

const LOGIN_ROUTE = "/login";

// FUNÇÃO MANUAL
const deleteCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark'? 'light' : 'dark');
    };

    const handleLogout = () => {
        deleteCookie('token');
        deleteCookie('user');
        deleteCookie('temp_token');
        deleteCookie('lojas_temp');
        deleteCookie('user_temp');
        router.replace(LOGIN_ROUTE);
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)' }}>
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">

                {/* HEADER NOVO */}
                <header
                    className="flex items-center justify-between border-b pb-4 mb-6"
                    style={{ borderColor: 'var(--cor-primaria)20' }}
                >
                    {/* ESQUERDA: LOGO PG 100px */}
                    <div
                        className="flex items-center justify-center font-bold"
                        style={{
                            width: '100px',
                            height: '100px',
                            backgroundColor: 'var(--cor-primaria)15',
                            border: '2px solid var(--cor-primaria)',
                            borderRadius: 'var(--radius)',
                            fontSize: '2.5rem',
                            color: 'var(--cor-primaria)',
                            fontFamily: 'var(--font-zalando)'
                        }}
                    >
                        PG
                    </div>

                    {/* DIREITA: BOTÕES 50px */}
                    <div className="flex items-center gap-3">

                        {/* BOTÃO TEMA 50px */}
                        <Button
                            onClick={toggleTheme}
                            className="p-0 hover:scale-110 transition-transform"
                            style={{
                                width: '50px',
                                height: '50px',
                                backgroundColor: 'var(--cor-fundo-card)',
                                border: '1px solid var(--cor-primaria)40',
                                borderRadius: 'var(--radius)',
                                color: 'var(--cor-primaria)'
                            }}
                        >
                            {theme === 'dark'? <Sun size={22} /> : <Moon size={22} />}
                        </Button>

                        {/* BOTÃO SAIR OFF 50px */}
                        <Button
                            onClick={handleLogout}
                            className="p-0 hover:scale-110 transition-transform"
                            style={{
                                width: '50px',
                                height: '50px',
                                backgroundColor: '#ef4444',
                                borderRadius: 'var(--radius)',
                                color: '#fff'
                            }}
                        >
                            <LogOut size={22} />
                        </Button>

                    </div>
                </header>

                {children}
                <Toaster richColors position="top-right" />
            </div>
        </div>
    )
}
