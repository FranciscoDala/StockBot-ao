"use client";
import { useState } from "react";
import { FileText, BarChart3, ShieldAlert, Users, Package, Truck, ShoppingCart, Settings, Power, Palette, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import { toast } from "sonner";

const deleteCookie = (name: string) => {
    if (typeof window === "undefined") return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; Secure; SameSite=None`;
}

const getInitials = (name: string) => {
    if (!name) return "PG";
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
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [loadingLogout, setLoadingLogout] = useState(false);

    // Igual ao handleConfirmarRemocao do carrinho
    const handleConfirmarLogout = async (senha?: string) => {
        if (!senha) return;

        setLoadingLogout(true);
        try {
            const res = await fetch("/api/loja/validar-senha", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ senha })
            });

            if (!res.ok) {
                const data = await res.json();
                toast.error(data.message || "Senha incorreta");
                setLoadingLogout(false);
                return;
            }

            deleteCookie("token");
            deleteCookie("user");
            router.replace("/login");
            setShowLogoutModal(false);

        } catch (error) {
            toast.error("Erro ao sair. Tente novamente.");
            setLoadingLogout(false);
        }
    };

    const initials = getInitials(lojaNome || "");

    return (
        <div className="min-h-screen bg-fundo text-cor">
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
                            fontFamily: 'var(--font-zalando)',
                        }}
                    >
                        <Store size={40} />
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => handleSaveTheme({ theme: theme === 'dark'? 'light' : 'dark' })}
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
                            <Palette size={22} />
                        </button>

                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="p-0 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 hover:scale-110 transition-transform"
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            <Power size={22} color="#fff" strokeWidth={2.5} />
                        </button>
                    </div>
                </header>

                {children}
            </div>

            <ConfirmarModal
                open={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleConfirmarLogout} // recebe a senha
                titulo="Sair da Loja"
                descricao="Tem certeza que deseja sair? Você precisará fazer login novamente para acessar."
                loading={loadingLogout}
                textoConfirmar="Sim, Sair"
                tipo="delete" // 👈 isso força o campo de senha igual ao remover carrinho com delete
            />
        </div>
    );
}
