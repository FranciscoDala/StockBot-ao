"use client";

import { Store, User, Lock, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "sonner"; // <- adicionei toast

const API_URL = "http://127.0.0.1:8000/api/v1";

const MENSAGEM_LOJA_DESATIVADA = "a sua loja foi desativada, vá até o escritório ou entra em contacto com o admin da stocckbot.\n\ncontacto:\ne-mail: stockbot26@gmail.com\nwhatsapp: +244930438947";

const ROUTES = {
    ADMIN: "/admin",
    VENDEDOR: "/loja",
    LOGIN: "/login",
    SELECT_LOJA_ADMIN: "/admin/lojas", // <- dono/gerente
    SELECT_LOJA_FUNC: "/select-loja" // <- funcionario
};

type LojaSelectOut = { id: string; nome: string; slug: string; role: "dono" | "gerente" | "vendedor" };
type UserData = {
    id: string; nome: string; email: string; is_superuser?: boolean;
    nivel?: "admin" | "gerente" | "vendedor" | "dono";
    role?: "admin" | "gerente" | "dono" | "funcionario" | "multi_loja"; // <- NOVO: campo role
    loja_id?: string | null;
    loja?: { id: string; nome: string; slug: string } | null;
};

type LoginResponse = {
    access_token: string;
    token_type: string;
    user: UserData | null;
    need_selection: boolean;
    lojas: LojaSelectOut[];
};

// ===== FUNÇÕES MANUAIS DE COOKIE =====
/**
 * FUNÇÃO: setCookie
 * Salva um cookie no navegador
 */
const setCookie = (name: string, value: string, days = 7) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    // Secure só em produção
    const secure = process.env.NODE_ENV === 'production'? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
};

/**
 * FUNÇÃO: getCookie
 * Lê um cookie do navegador
 */
const getCookie = (name: string): string | undefined => {
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name? decodeURIComponent(parts[1]) : r;
    }, '');
};

/**
 * FUNÇÃO: deleteCookie
 * Apaga um cookie
 */
const deleteCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

/**
 * FUNÇÃO: clearAllAuthCookies
 * Limpa todos cookies de autenticação
 */
const clearAllAuthCookies = () => {
    deleteCookie('token');
    deleteCookie('user');
    deleteCookie('role'); // <- NOVO
    deleteCookie('temp_token');
    deleteCookie('lojas_temp');
    deleteCookie('user_temp');
}
// ======================================

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState("");
    const [lojaBloqueadaOpen, setLojaBloqueadaOpen] = useState(false);
    const router = useRouter();
    const redirectedRef = useRef(false);

    /**
     * FUNÇÃO: safeRedirect
     * Redireciona o usuário dependendo do nivel/role
     */
    const safeRedirect = (user: UserData) => {
        if (user.is_superuser || user.nivel === "admin") return router.replace(ROUTES.ADMIN);
        if (user.nivel === "vendedor") return router.replace(ROUTES.VENDEDOR);
        if (user.nivel === "dono" || user.nivel === "gerente") return router.replace(ROUTES.SELECT_LOJA_ADMIN);

        setError("Erro no servidor: usuario sem nivel. Fala com o dev.");
        clearAllAuthCookies();
        setChecking(false);
    };

    /**
     * HOOK: useEffect
     * Roda ao carregar a página. Se já tem token, redireciona
     */
    useEffect(() => {
        if (redirectedRef.current) return;
        const token = getCookie("token");
        const userStr = getCookie("user");
        if (token && userStr) {
            try {
                const user: UserData = JSON.parse(userStr as string);
                redirectedRef.current = true;
                safeRedirect(user);
                return;
            } catch {
                clearAllAuthCookies();
            }
        }
        setChecking(false);
    }, [router]);

    /**
     * FUNÇÃO: handleLogin
     * Roda quando o usuário clica em "entrar"
     * Faz 3 cenários: admin direto, 1 loja direto, multi-loja seleciona
     */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        clearAllAuthCookies();

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: email, password })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || `Erro ${res.status}`);
            }

            const data: LoginResponse = await res.json();

            // CORREÇÃO: agora o backend sempre retorna user
            if (!data.user) throw new Error("Backend não retornou dados do usuário");

            // REGRA 0: MULTI-LOJA - PRECISA ESCOLHER PRIMEIRO
            if (data.need_selection && data.lojas.length > 0) {
                setCookie('temp_token', data.access_token, 1 / 24 / 6); // 10 min
                setCookie('role', 'multi_loja', 1 / 24 / 6); // <- NOVO: salva role temporário
                setCookie('lojas_temp', JSON.stringify(data.lojas), 1 / 24 / 6);
                setCookie('user_temp', JSON.stringify(data.user), 1 / 24 / 6);
                redirectedRef.current = true;

                const isGestor = data.user.nivel === "dono" || data.user.nivel === "gerente" || data.user.is_superuser;
                return router.replace(isGestor? ROUTES.SELECT_LOJA_ADMIN : ROUTES.SELECT_LOJA_FUNC);
            }

            // REGRA 1: ADMIN SEMPRE VAI DIRETO
            if (data.user.is_superuser || data.user.nivel === "admin") {
                setCookie('token', data.access_token, 7);
                setCookie('role', 'admin', 7); // <- NOVO: salva role
                setCookie('user', JSON.stringify(data.user), 7);
                redirectedRef.current = true;
                return router.replace(ROUTES.ADMIN);
            }

            // REGRA 2: VENDEDOR VAI DIRETO
            if (data.user.nivel === "vendedor") {
                setCookie('token', data.access_token, 7);
                setCookie('role', 'funcionario', 7); // <- NOVO: salva role
                setCookie('user', JSON.stringify(data.user), 7);
                redirectedRef.current = true;
                return router.replace(ROUTES.VENDEDOR);
            }

            // REGRA 3: DONO/GERENTE COM 1 LOJA JA VEM SELECIONADA
            if (data.user.nivel === "dono" || data.user.nivel === "gerente") {
                setCookie('token', data.access_token, 7);
                setCookie('role', data.user.nivel, 7); // <- NOVO: salva role
                setCookie('user', JSON.stringify(data.user), 7);
                redirectedRef.current = true;
                return router.replace(`/loja/${data.user.loja?.slug}`);
            }

            // FALLBACK
            setCookie('token', data.access_token, 7);
            setCookie('role', data.user.role || 'funcionario', 7); // <- NOVO: salva role
            setCookie('user', JSON.stringify(data.user), 7);
            redirectedRef.current = true;
            safeRedirect(data.user);

        } catch (err: any) {
            const msg = String(err.message || err).toLowerCase();

            if (msg.includes("loja foi desativada")) {
                setLojaBloqueadaOpen(true);
            } else if (msg.includes("sem loja vinculada")) {
                setError("Usuário sem loja vinculada. Crie uma loja primeiro.");
            } else if (msg.includes("401") || msg.includes("403") || msg.includes("credenciais")) {
                setError("Email ou senha incorretos");
            } else {
                setError(err.message || "Erro ao fazer login");
            }
        } finally {
            setLoading(false);
        }
    };

    if (checking) return <div className="flex items-center justify-center min-h-screen bg-black"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>

    return (
        <main className="flex min-h-screen items-center justify-center p-4 bg-black">
            <div className="w-full max-w-sm space-y-6 rounded-2xl border-zinc-800 bg-zinc-950 p-8 shadow-2xl shadow-green-900/20">
                <div className="flex flex-col items-center gap-2">
                    <Store className="h-10 w-10 text-green-500" />
                    <h1 className="text-2xl font-bold text-white">stockbot</h1>
                    <p className="text-sm text-zinc-400">use: admin@stockbot.ao / admin123</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                        <label className="flex items-center gap-2 text-sm text-zinc-300"><User size={16} /> email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border-zinc-700 bg-zinc-900 p-2 text-white focus:border-green-500 outline-none" required />
                    </div>
                    <div className="space-y-1">
                        <label className="flex items-center gap-2 text-sm text-zinc-300"><Lock size={16} /> senha</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border-zinc-700 bg-zinc-900 p-2 text-white focus:border-green-500 outline-none" required />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full rounded-md bg-green-600 p-2 font-bold text-white disabled:opacity-50 hover:bg-green-500 transition">
                        {loading? "entrando..." : "entrar"}
                    </button>
                </form>
            </div>

            <Dialog open={lojaBloqueadaOpen} onOpenChange={(open) => { if (!open) return; }}>
                <DialogOverlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md" />
                <DialogContent className="sm:max-w-[425px] bg-zinc-950/85 backdrop-blur-xl border-red-500/50 z-50" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-500 text-xl"><AlertTriangle className="w-6 h-6" />acesso bloqueado</DialogTitle>
                        <DialogDescription className="text-zinc-300 pt-2 text-base whitespace-pre-line">{MENSAGEM_LOJA_DESATIVADA}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold" onClick={() => setLojaBloqueadaOpen(false)}>ok, entendi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Toaster richColors position="top-right" />
        </main>
    );
}
