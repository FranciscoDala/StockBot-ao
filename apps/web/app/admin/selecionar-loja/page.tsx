"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building, AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogOverlay } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

export default function SelectLojaPage() {
  const router = useRouter();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [user, setUser] = useState<UserTemp | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [erroModalOpen, setErroModalOpen] = useState(false);
  const [erroMsg, setErroMsg] = useState("");
  const isMounted = useRef(true);
  const isLoggingOut = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false }
  }, [])

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

    return () => {
      window.onpopstate = null;
    }
  }, [router]);

  const handleSelectLoja = async (loja: Loja) => {
    setSelecting(loja.id);
    const tempToken = getCookie("temp_token");
    try {
      const res = await fetch(`${API_URL}/auth/select-loja`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tempToken}`
        },
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
        setSelecting(null);
        setErroMsg(err.message || "Não foi possível entrar na loja");
        setErroModalOpen(true);
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>
  }

  return (
    <div className="space-y-8">
        <style jsx global>{`.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}.hide-scrollbar::-webkit-scrollbar{display:none;}`}</style>

        {/* OVERLAY SPINNER */}
        {selecting && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-foreground text-lg font-semibold">Carregando loja...</p>
                </div>
            </div>
        )}

        <div>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold tracking-tight">Minhas Lojas</h3>
            </div>
            <p className="text-muted-foreground mb-8">
                Olá <b className="text-primary"> {user?.nome}</b>,
                selecione uma loja para gerenciar
            </p>
        </div>

        {/* CARDS COM SCROLL-X NO MOBILE - 100% LARGURA */}
        <div className="flex gap-4 overflow-x-auto pb-4 px-4 -mx-4 hide-scrollbar snap-x snap-center md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:mx-0">
            {lojas.map((loja) => (
                <Card
                    key={loja.id}
                    onClick={() => handleSelectLoja(loja)}
                    className="p-6 cursor-pointer border-2 hover:bg-accent transition-all group disabled:opacity-50 disabled:cursor-not-allowed min-w-full md:min-w-0 snap-start"
                    style={{ borderColor: 'var(--cor-primaria)' }} // BORDA PRIMARY
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Building className="h-6 w-6 text-primary group-hover:scale-110 transition" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{loja.nome}</h3>
                                <p className="text-xs text-muted-foreground">/{loja.slug}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                loja.is_active
                                 ? "bg-green-500/20 text-green-500 border-green-500/30"
                                    : "bg-red-500/20 text-red-500 border-red-500/30"
                            }`}>
                                {loja.is_active? "Ativa" : "Inativa"}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground capitalize">
                                {loja.role}
                            </span>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {loja.endereco || "Endereço não informado"}
                    </p>
                </Card>
            ))}
        </div>

        <Dialog open={erroModalOpen} onOpenChange={setErroModalOpen}>
            <DialogOverlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md" />
            <DialogContent className="sm:max-w-[425px] bg-card border-destructive">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive text-xl">
                        <AlertTriangle className="w-6 h-6" />
                        Erro ao acessar loja
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2 text-base">
                        {erroMsg}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="destructive" className="w-full font-bold" onClick={() => setErroModalOpen(false)}>
                        Entendi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  )
}
