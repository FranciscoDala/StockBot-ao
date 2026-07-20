"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Power, Palette, Store, Shield } from "lucide-react";
import { Zalando_Sans_Expanded } from "next/font/google";
import { ConfirmarModal } from "@/app/loja/[id]/_components/modals/ConfirmacaoModal"; // 👈 import igual da loja

const zalando = Zalando_Sans_Expanded({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-zalando",
});

const getCookie = (name: string): string | undefined => {
    if (typeof document === "undefined") return undefined;
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name? decodeURIComponent(parts[1]) : r;
    }, '');
};

const deleteCookie = (name: string) => {
    const isProd = process.env.NODE_ENV === 'production';
    const secure = isProd? '; Secure' : '';
    const sameSite = isProd? '; SameSite=None' : '; SameSite=Lax';
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${secure}${sameSite}`;
};

const clearAllAuth = () => {
    ['token', 'user', 'role', 'temp_token', 'lojas_temp', 'user_temp'].forEach(deleteCookie); // 👈 limpa tudo
}

const applyTheme = (theme: string) => {
    const root = document.documentElement;
    const isDark = theme === 'dark';
    root.style.setProperty('--cor-fundo', isDark? '#0a0a0a' : '#f8fafc');
    root.style.setProperty('--cor-card', isDark? '#111' : '#ffffff');
    root.style.setProperty('--cor-texto', isDark? '#f1f5f9' : '#1e293b');
    root.style.setProperty('--cor-texto-sec', isDark? '#94a3b8' : '#64748b');
    root.style.setProperty('--cor-primaria', '#10b981');
    if(isDark) root.classList.add('dark'); else root.classList.remove('dark');
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [theme, setTheme] = useState("dark");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // 👈 loading da modal

  useEffect(() => {
    const savedTheme = getCookie("theme") || "dark";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, [])

  const handleSaveTheme = () => {
    const newTheme = theme === 'dark'? 'light' : 'dark';
    setTheme(newTheme);
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000`;
    applyTheme(newTheme);
  }

  const handleSair = () => {
    setIsLoggingOut(true);
    clearAllAuth();
    setShowLogoutModal(false);

    // 👈 FORÇA SAIR IMEDIATO. router.replace não funciona bem em layout
    window.location.href = "/login";
  }

  return (
    <div
        className={`min-h-screen ${zalando.variable}`}
        style={{backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', fontFamily: 'var(--font-zalando)'}}
    >
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-6">

            <header
                className="sticky top-0 z-20 w-full h-14 flex items-center justify-between px-0 border-b mb-6"
                style={{
                    borderColor: 'color-mix(in srgb, var(--cor-primaria) 15%, transparent)',
                    backgroundColor: 'var(--cor-fundo)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <div className="flex items-center gap-3">
                    <Store size={40} style={{color: 'var(--cor-primaria)'}} />
                    <h2 className="text-2xl font-bold"></h2>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSaveTheme}
                        className="p-0 hover:scale-110 transition-transform flex items-center justify-center"
                        style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: 'var(--cor-card)',
                            border: '1px solid var(--cor-primaria)40',
                            borderRadius: '8px',
                            color: 'var(--cor-primaria)'
                        }}
                    >
                        <Palette size={22} />
                    </button>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        disabled={isLoggingOut}
                        className="p-0 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 hover:scale-110 transition-transform disabled:opacity-50"
                        style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px'
                            }}
                    >
                        <Power size={22} color="#fff" strokeWidth={2.5} />
                    </button>
                </div>
            </header>

            {children}
        </div>

        {/* Modal de confirmação de logout - sem senha */}
        <ConfirmarModal
            open={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            onConfirm={handleSair}
            titulo="Sair do Admin"
            descricao="Tem certeza que deseja sair? Você precisará fazer login novamente para acessar."
            loading={isLoggingOut} // 👈 mostra spinner no "Sim, Sair"
            textoConfirmar="Sim, Sair"
            tipo="venda"
        />
    </div>
  )
}
