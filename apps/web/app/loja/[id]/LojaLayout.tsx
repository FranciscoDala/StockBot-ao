"use client";
import { FileText, BarChart3, ShieldAlert, Users, Package, Truck, ShoppingCart, Settings, Power, Palette } from "lucide-react";
import { useRouter } from "next/navigation";

const deleteCookie = (name: string) => {
    if (typeof window === "undefined") return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; Secure; SameSite=None`;
}

const getInitials = (name: string) => {
    if (!name) return "PG"; // fallback
    const words = name.trim().split(" ").filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
}

interface LojaLayoutProps {
    children: React.ReactNode;
    theme: string;
    handleSaveTheme: (data: any) => void;
    lojaNome?: string | null;
}

export default function LojaLayout({ children, theme, handleSaveTheme, lojaNome }: LojaLayoutProps) {
    const router = useRouter();

    const handleSair = () => {
        deleteCookie("token");
        deleteCookie("user");
        router.replace("/login");
    };

    const initials = getInitials(lojaNome || "");

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)' }}>
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-6">

                <header
                    className="flex items-center justify-between gap-3 mb-4 sm:mb-6 border-b pb-4"
                    style={{ borderColor: 'var(--cor-primaria)20' }}
                >
                    <div
                        className="flex items-center justify-center font-bold shrink-0"
                        style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: 'var(--cor-primaria)15',
                            border: '2px solid var(--cor-primaria)',
                            borderRadius: '100%',
                            fontSize: '1rem',
                            color: 'var(--cor-primaria)',
                            fontFamily: 'var(--font-zalando)',
                            textTransform: 'uppercase'
                        }}
                    >
                        {initials}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => handleSaveTheme({ theme: theme === 'dark' ? 'light' : 'dark' })}
                            className="p-0 hover:scale-110 transition-transform flex items-center justify-center"
                            style={{
                                width: '50px',
                                height: '50px',
                                backgroundColor: 'var(--cor-card)',
                                border: '1px solid var(--cor-primaria)40',
                                borderRadius: 'var(--radius)',
                                color: 'var(--cor-primaria)'
                            }}
                        >
                            <Palette size={22} />
                        </button>

                        <button
                            onClick={handleSair}
                            className="p-0 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 hover:scale-110 transition-transform"
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            <Power size={22} color="#fff" strokeWidth={2.5} />
                        </button>
                    </div>
                </header>

                {children}
            </div>
        </div>
    );
}
