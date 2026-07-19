"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building, AlertTriangle, Power, Palette, Store } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Loja = {
  id: string;
  nome: string;
  slug: string;
  role: "dono" | "gerente" | "vendedor";
  endereco?: string | null;
  is_active: boolean;
  created_at: string;
}

type UserTemp = {
  id: string;
  nome: string;
  email: string;
  nivel: "admin" | "gerente" | "vendedor" | "dono";
}

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
    root.style.setProperty('--font-zalando', font || 'var(--font-zalando)');
    if(isDark) root.classList.add('dark'); else root.classList.remove('dark');
}

export default function SelectLojaPage() {
  const router = useRouter();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [user, setUser] = useState<UserTemp | null>(null);
  const [loading, setLoading] = useState(true);
  const [erroModalOpen, setErroModalOpen] = useState(false);
  const [erroMsg, setErroMsg] = useState("");
  const [theme, setTheme] = useState("dark");
  const [cardStyle, setCardStyle] = useState("arredondado");
  const [cardSize, setCardSize] = useState("medio");
  const [font, setFont] = useState("");
  const isMounted = useRef(true);
  const isLoggingOut = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    const savedTheme = getCookie("theme") || "dark";
    const savedCardStyle = getCookie("card_style") || "arredondado";
    const savedCardSize = getCookie("card_size") || "medio";
    const savedFont = getCookie("font_family") || "";
    setTheme(savedTheme); setCardStyle(savedCardStyle); setCardSize(savedCardSize); setFont(savedFont);
    applyTheme(savedTheme, savedCardStyle, savedCardSize, savedFont);
    return () => { isMounted.current = false }
  }, [])

  const handleSaveTheme = () => {
    const newTheme = theme === 'dark'? 'light' : 'dark';
    setTheme(newTheme);
    setCookie("theme", newTheme);
    applyTheme(newTheme, cardStyle, cardSize, font);
  }

  const handleTerminarSessao = () => {
    isLoggingOut.current = true;
    deleteCookie("temp_token");
    deleteCookie("lojas_temp");
    deleteCookie("user_temp");
    window.onpopstate = null;
    router.replace("/login");
  }

  useEffect(() => {
    const tempToken = getCookie("temp_token");
    const userStr = getCookie("user_temp");
    if (!tempToken ||!userStr) {
      handleTerminarSessao();
      return;
    }
    const fetchLojas = async () => {
      try {
        const res = await fetch(`${API_URL}/lojas/minhas-temp`, {
          headers: { "Authorization": `Bearer ${tempToken}` }
        });
        if (!res.ok) throw new Error("Erro ao buscar lojas");
        const lojasReais = await res.json();
        if(isMounted.current){
            setLojas(lojasReais);
            setUser(JSON.parse(userStr));
            setLoading(false);
            window.history.pushState(null, '', window.location.href);
            window.history.pushState(null, '', window.location.href);
            window.onpopstate = () => {
              if(!isLoggingOut.current) {
                window.history.pushState(null, '', window.location.href);
              }
            };
        }
      } catch {
        handleTerminarSessao();
      }
    };
    fetchLojas();
    return () => { window.onpopstate = null; }
  }, [router]);

  const handleSelectLoja = async (loja: Loja) => {
    const tempToken = getCookie("temp_token");
    try {
      const res = await fetch(`${API_URL}/auth/select-loja`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tempToken}` },
        body: JSON.stringify({ loja_id: loja.id })
      });
      if(!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Erro ao selecionar loja");
      }
      const data = await res.json();
      if(isMounted.current){
          window.onpopstate = null;
          setCookie("token", data.access_token, 7);
          setCookie("user", JSON.stringify(data.user), 7);
          deleteCookie("temp_token");
          deleteCookie("lojas_temp");
          deleteCookie("user_temp");
          router.push(`/loja/${loja.id}`);
      }
    } catch (err: any) {
      if(isMounted.current) {
        setErroMsg(err.message || "Não foi possível entrar na loja");
        setErroModalOpen(true);
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20" style={{backgroundColor: 'var(--cor-fundo)'}}><div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{borderColor: 'var(--cor-primaria)'}}></div></div>
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)'}}>
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-6">

            {/* SÓ 1 HEADER */}
            <header
                className="sticky top-0 z-20 w-full h-14 flex items-center justify-between px-0 border-b mb-6"
                style={{
                    borderColor: 'color-mix(in srgb, var(--cor-primaria) 15%, transparent)',
                    backgroundColor: 'var(--cor-fundo)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                {/* ESQUERDA: Logo + Titulo */}
                <div className="flex items-center gap-3">
                    <Store size={32} style={{color: 'var(--cor-primaria)'}} />
                    <h2 className="text-2xl font-bold" style={{fontFamily: 'var(--font-zalando)'}}>Selecionar Loja</h2>
                </div>

                {/* DIREITA: Tema + Sair */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSaveTheme}
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
                        <Palette size={20} />
                    </button>
                    <button
                        onClick={handleTerminarSessao}
                        className="p-0 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 hover:scale-110 transition-transform"
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        <Power size={20} color="#fff" strokeWidth={2.5} />
                    </button>
                </div>
            </header>

            <p className="text-sm mb-8" style={{color: 'var(--cor-texto-sec)'}}>Olá {user?.nome}, selecione uma loja para gerenciar</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {lojas.map((loja) => (
                    <button
                        key={loja.id}
                        onClick={() => handleSelectLoja(loja)}
                        className="text-left transition-all group"
                        style={{
                            backgroundColor: 'var(--cor-card)',
                            border: '1px solid var(--cor-primaria)20',
                            borderRadius: 'var(--radius)',
                            padding: 'var(--padding-card)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--cor-primaria)'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--cor-primaria)20'}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Building className="h-6 w-6 group-hover:scale-110 transition" style={{color: 'var(--cor-primaria)'}} />
                                <h3 className="text-xl font-bold">{loja.nome}</h3>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    loja.is_active? "bg-green-600 text-white" : "bg-red-600 text-white"
                                }`}>
                                    {loja.is_active? "Ativa" : "Inativa"}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-semibold border" style={{borderColor: 'var(--cor-primaria)30', color: 'var(--cor-texto-sec)'}}>
                                    {loja.role.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm" style={{color: 'var(--cor-texto-sec)'}}>
                            {loja.endereco || "Endereço não informado"}
                        </p>
                    </button>
                ))}
            </div>

            <Dialog open={erroModalOpen} onOpenChange={setErroModalOpen}>
                <DialogOverlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md" />
                <DialogContent className="sm:max-w-[425px] border-red-500/50 z-50" style={{backgroundColor: 'var(--cor-card)'}}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-500 text-xl">
                            <AlertTriangle className="w-6 h-6" />
                            Erro ao acessar loja
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-base" style={{color: 'var(--cor-texto-sec)'}}>
                            {erroMsg}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold" onClick={() => setErroModalOpen(false)}>
                            Entendi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    </div>
  )
}
