"use client";

import { Button } from "@/components/ui/button";
import { LogOut, Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";

const LOGIN_ROUTE = "/login";

// FUNÇÕES DE COOKIE
const getCookie = (name: string): string | undefined => {
    if (typeof document === "undefined") return undefined;
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name? decodeURIComponent(parts[1]) : r;
    }, '');
};

const setCookie = (name: string, value: string, days = 7) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const isProd = process.env.NODE_ENV === 'production';
    const secure = isProd? '; Secure' : '';
    const sameSite = isProd? '; SameSite=None' : '; SameSite=Lax';
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/${secure}${sameSite}`;
};

const deleteCookie = (name: string) => {
    const isProd = process.env.NODE_ENV === 'production';
    const secure = isProd? '; Secure' : '';
    const sameSite = isProd? '; SameSite=None' : '; SameSite=Lax';
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${secure}${sameSite}`;
};

// Aplica tema igual do LojaLayout
const applyTheme = (theme: string, cardStyle: string, cardSize: string, font: string) => {
    const root = document.documentElement;
    const isDark = theme === 'dark';
    root.style.setProperty('--cor-fundo', isDark? '#0a0a0a' : '#f8fafc');
    root.style.setProperty('--cor-card', isDark? '#111111' : '#ffffff');
    root.style.setProperty('--cor-texto', isDark? '#f1f5f9' : '#1e293b');
    root.style.setProperty('--cor-texto-sec', isDark? '#94a3b8' : '#64748b');
    root.style.setProperty('--cor-primaria', '#10b981');
    root.style.setProperty('--radius', cardStyle === 'arredondado'? '16px' : '8px');
    root.style.setProperty('--padding-card', cardSize === 'grande'? '24px' : '16px');
    root.style.setProperty('--font-zalando', font || 'Inter, sans-serif'); // 👈 fonte do body
    if(isDark) root.classList.add('dark'); else root.classList.remove('dark');
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [cardStyle, setCardStyle] = useState("arredondado");
    const [cardSize, setCardSize] = useState("medio");
    const [font, setFont] = useState("");

    useEffect(() => {
        // Lê do cookie igual LojaLayout
        const savedTheme = getCookie("theme") || "dark";
        const savedCardStyle = getCookie("card_style") || "arredondado";
        const savedCardSize = getCookie("card_size") || "medio";
        const savedFont = getCookie("font_family") || "Inter, sans-serif";

        setTheme(savedTheme as 'dark' | 'light');
        setCardStyle(savedCardStyle);
        setCardSize(savedCardSize);
        setFont(savedFont);
        applyTheme(savedTheme, savedCardStyle, savedCardSize, savedFont);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark'? 'light' : 'dark';
        setTheme(newTheme);
        setCookie("theme", newTheme);
        applyTheme(newTheme, cardStyle, cardSize, font);
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
        <div
            className="min-h-screen bg-fundo text-cor"
            style={{ fontFamily: 'var(--font-zalando)' }} // 👈 AQUI aplica pro body todo
        >
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-6">

                <header
                    className="sticky top-0 z-20 w-full h-14 flex items-center justify-between px-0 border-b"
                    style={{
                        borderColor: 'color-mix(in srgb, var(--cor-primaria) 15%, transparent)',
                        backgroundColor: 'var(--cor-fundo)',
                        backdropFilter: 'blur(8px)',
                        marginBottom: '10px'
                    }}
                >
                    <div
                        className="flex items-center justify-center font-bold shrink-0"
                        style={{
                            backgroundColor: 'var(--cor-primaria)15',
                            color: 'var(--cor-primaria)',
                            fontFamily: 'var(--font-zalando)', // PG continua com a fonte
                        }}
                    >
                        PG
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={toggleTheme}
                            className="p-0 hover:scale-110 transition-transform flex items-center justify-center"
                            style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: 'var(--cor-card)',
                                border: '1px solid var(--cor-primaria)40',
                                borderRadius: 'var(--radius)',
                                color: 'var(--cor-primaria)'
                            }}
                        >
                            {theme === 'dark'? <Sun size={22} /> : <Moon size={22} />}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="p-0 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 hover:scale-110 transition-transform"
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            <LogOut size={22} color="#fff" strokeWidth={2.5} />
                        </button>
                    </div>
                </header>

                {children}
                <Toaster richColors position="top-right" />
            </div>
        </div>
    )
}
