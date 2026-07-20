"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Store, Users, Plus, Edit, Eye, User, Loader2, Trash2, Mail, MapPin, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Import das modals
import { LojaModal } from "./modals/LojaModal";
import { ConfirmModal } from "./modals/ConfirmModal";
import { DeleteModal } from "./modals/DeleteModal";

export type Dono = { id: string; nome: string; email: string; telefone: string | null };
export type Gerente = Dono;

export type Loja = {
    id: string;
    nome: string;
    slug: string;
    is_active: boolean;
    created_at: string;
    endereco: string | null;
    gerente: Gerente | null;
};

export type DonoNovoForm = { nome: string; email: string; senha: string; telefone: string; };

export type FormData = {
    nome: string; slug: string; is_active: boolean; endereco: string;
    modoDono: 'existente' | 'novo';
    dono_existente_id: string;
    dono_novo: DonoNovoForm;
    dono: Dono | null;
    adminSenha: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://gentle-playfulness-production-d333.up.railway.app/api/v1";

const LOGIN_ROUTE = "/login";
const emptyForm: FormData = {
    nome: "", slug: "", is_active: true, endereco: "",
    modoDono: 'novo', dono_existente_id: "",
    dono_novo: { nome: "", email: "", senha: "", telefone: "" },
    dono: null, adminSenha: ""
};

const getCookie = (name: string): string | undefined => {
    if (typeof document === "undefined") return undefined;
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
};

const deleteCookie = (name: string) => {
    const isProd = process.env.NODE_ENV === 'production';
    const secure = isProd ? '; Secure' : '';
    const sameSite = isProd ? '; SameSite=None' : '; SameSite=Lax';
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${secure}${sameSite}`;
};

const clearAllAuth = () => {
    ['token', 'user', 'role'].forEach(deleteCookie);
};

export default function AdminClient({ lojasIniciais, donosIniciais }: { lojasIniciais: Loja[], donosIniciais: Dono[] }) {
    const [lojas, setLojas] = useState<Loja[]>(lojasIniciais || []);
    const [donos, setDonos] = useState<Dono[]>(donosIniciais || []);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [open, setOpen] = useState(false);
    const [editingLoja, setEditingLoja] = useState<Loja | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [lojaToDelete, setLojaToDelete] = useState<Loja | null>(null);
    const [adminSenhaDelete, setAdminSenhaDelete] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null); // 👈 erro edição
    const [deleteError, setDeleteError] = useState<string | null>(null); // 👈 erro delete
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>(emptyForm);
    const isLoggingOut = useRef(false);

    const handleTerminarSessao = () => {
        isLoggingOut.current = true;
        clearAllAuth();
        router.replace(LOGIN_ROUTE);
    };

    useEffect(() => {
        const token = getCookie("token");
        if (!token) return handleTerminarSessao();

        let timeout = setTimeout(() => {
            toast.error("Tempo de resposta excedido");
            handleTerminarSessao();
        }, 4000);

        const loadData = async () => {
            try {
                const [lojasRes, donosRes] = await Promise.all([
                    fetch(`${API_URL}/lojas`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
                    fetch(`${API_URL}/lojas/donos`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
                ]);

                clearTimeout(timeout);

                if (lojasRes.status === 401 || donosRes.status === 401) return handleTerminarSessao();
                if (!lojasRes.ok || !donosRes.ok) throw new Error("Erro ao buscar dados");

                const lojasData = await lojasRes.json();
                const donosData = await donosRes.json();
                setLojas(Array.isArray(lojasData) ? lojasData : lojasData.data ?? lojasData.lojas ?? []);
                setDonos(donosData);
            } catch (err) {
                console.error(err);
                handleTerminarSessao();
            } finally {
                setLoading(false);
            }
        }
        loadData();

        window.history.pushState(null, '', window.location.href);
        const handlePopState = () => {
            if (!isLoggingOut.current) {
                window.history.pushState(null, '', window.location.href);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => { window.removeEventListener('popstate', handlePopState); clearTimeout(timeout) }
    }, [router]);

    const refreshData = async () => {
        const token = getCookie("token");
        if (!token) return handleTerminarSessao();
        try {
            const [lojasRes, donosRes] = await Promise.all([
                fetch(`${API_URL}/lojas`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
                fetch(`${API_URL}/lojas/donos`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
            ]);
            if (lojasRes.status === 401 || donosRes.status === 401) return handleTerminarSessao();
            if (!lojasRes.ok || !donosRes.ok) throw new Error("Erro ao atualizar");
            setLojas(await lojasRes.json());
            setDonos(await donosRes.json());
        } catch { handleTerminarSessao(); }
    }

    const handleOpenModal = async (loja: Loja | null = null) => {
        setEditingLoja(loja);
        if (loja) {
            const token = getCookie("token");
            const res = await fetch(`${API_URL}/lojas/${loja.slug}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
            if (res.status === 401) return handleTerminarSessao();
            const data = await res.json();
            setFormData({
                ...emptyForm, nome: data.nome || "", slug: data.slug || "", is_active: data.is_active ?? true,
                endereco: data.endereco || "", modoDono: 'existente',
                dono: data.gerente ? { ...data.gerente, telefone: data.gerente.telefone ?? "" } : null
            });
        } else { setFormData(emptyForm); }
        setOpen(true);
    };

    const handleSubmitForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingLoja) { setConfirmModalOpen(true); setConfirmError(null); } // 👈 limpa erro
        else { handleConfirmSave(); }
    }

    const handleConfirmSave = async () => {
        if (editingLoja && !formData.adminSenha) { setConfirmError("Digite a senha do ADMIN para confirmar"); return; }
        setIsSaving(true);
        setConfirmError(null); // 👈 limpa erro antes de tentar
        const token = getCookie("token");
        const isEditing = !!editingLoja;
        const url = isEditing ? `${API_URL}/lojas/${editingLoja.id}` : `${API_URL}/lojas`;
        const method = isEditing ? 'PATCH' : 'POST';
        let payload: any = { nome: formData.nome, slug: formData.slug, is_active: formData.is_active, endereco: formData.endereco || null, };
        if (isEditing) {
            payload.senha_admin = formData.adminSenha
            payload.dono = { ...formData.dono, telefone: formData.dono?.telefone?.trim() || null };
        } else {
            if (formData.modoDono === 'existente') {
                if (!formData.dono_existente_id) { toast.error("Seleciona um dono existente"); setIsSaving(false); return; }
                payload.dono_existente_id = formData.dono_existente_id;
            } else {
                if (!formData.dono_novo.nome || !formData.dono_novo.email || !formData.dono_novo.senha) { toast.error("Preenche todos os dados do novo dono"); setIsSaving(false); return; }
                payload.dono_novo = { nome: formData.dono_novo.nome, email: formData.dono_novo.email, senha: formData.dono_novo.senha, telefone: formData.dono_novo.telefone?.trim() || null, };
            }
        }
        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
            if (res.status === 401) return handleTerminarSessao();
            if (res.status === 403) {
                setConfirmError("Senha do ADMIN incorreta"); // 👈 mostra erro na modal
                setIsSaving(false);
                return;
            }
            if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Erro ao salvar loja'); }
            toast.success(isEditing ? "Loja atualizada" : "Loja criada");
            setOpen(false); setConfirmModalOpen(false); setEditingLoja(null); setFormData(emptyForm);
            await refreshData();
        } catch (err: any) {
            setConfirmError(err.message || "Erro ao salvar loja. Verifique o slug/email.");
        }
        finally { setIsSaving(false); setFormData(prev => ({ ...prev, adminSenha: "" })); }
    }

    const handleDeleteLoja = async () => {
        if (!lojaToDelete || !adminSenhaDelete) { setDeleteError("Digite a senha do ADMIN para apagar"); return; }
        setIsDeleting(true);
        setDeleteError(null);
        const token = getCookie("token");
        try {
            const res = await fetch(`${API_URL}/lojas/${lojaToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ senha_admin: adminSenhaDelete })
            });

            if (res.status === 401) return handleTerminarSessao();
            if (res.status === 403) {
                setDeleteError("Senha do ADMIN incorreta");
                setIsDeleting(false);
                return;
            }
            if (!res.ok) {
                const data = await res.json().catch(() => ({})); // evita crash se não tiver json
                throw new Error(data.detail || "Erro ao apagar loja");
            }

            toast.success(`Loja ${lojaToDelete.nome} apagada`);
            setDeleteModalOpen(false); setLojaToDelete(null); setAdminSenhaDelete(""); await refreshData();
        } catch (err: any) {
            console.error("ERRO DELETE:", err);
            if (err.name === 'TypeError') {
                setDeleteError("Erro de conexão. Verifica se o servidor está online.");
            } else {
                setDeleteError(err.message);
            }
        } finally { setIsDeleting(false); }
    };

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (field === 'adminSenha') setConfirmError(null); // 👈 limpa erro ao digitar
        if (field === 'nome' && !editingLoja) { setFormData(prev => ({ ...prev, slug: value.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') })); }
    }

    const handleDonoChange = (field: string, value: string) => { setFormData(prev => ({ ...prev, dono: prev.dono ? { ...prev.dono, [field]: value } : null })); }

    const handleDonoNovoChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            dono_novo: {
                ...prev.dono_novo,
                [field]: value
            }
        }));
    }

    return (
        <div className="space-y-8">
            <style jsx global>{`
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.snap-x { scroll-snap-type: x mandatory; }
.snap-center { scroll-snap-align: center; }
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.shadow-primary {
  box-shadow: 0 8px 30px 0 rgba(34, 197, 94, 0.20);
}
`}</style>

            {/* HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-3">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        Painel Administrativo
                    </h3>
                    <p className="text-muted-foreground mt-1">Gestão centralizada de todas as lojas da plataforma</p>
                </div>

                <Button onClick={() => handleOpenModal()} className="gap-2 w-full md:w-auto bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 transition-all">
                    <Plus className="w-4 h-4" /> Adicionar Loja
                </Button>

                {/* MODAL CRIAR/EDITAR LOJA */}
                <LojaModal
                    open={open}
                    onOpenChange={(v) => {
                        setOpen(v);
                        if (!v) {
                            setEditingLoja(null);
                            setFormData(emptyForm)
                        }
                    }}
                    editingLoja={editingLoja}
                    donos={donos}
                    formData={formData}
                    setFormData={setFormData}
                    onSave={handleSubmitForm}
                    saving={isSaving}
                    handleChange={handleChange}
                    handleDonoChange={handleDonoChange}
                    handleDonoNovoChange={handleDonoNovoChange}
                />
            </div>

            {/* KPIS - MOBILE SCROLL | DESKTOP GRID */}
            <div className="sm:hidden overflow-x-auto scrollbar-hide snap-x px-4 py-0">
                <div className="flex w-max gap-4">
                    <Card className="glass-card shadow-primary w-[calc(100vw-32px)] snap-center shrink-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Lojas</CardTitle>
                            <Store className="h-5 w-5 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{lojas.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Cadastradas na plataforma</p>
                        </CardContent>
                    </Card>
                    <Card className="glass-card shadow-primary w-[calc(100vw-32px)] snap-center shrink-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Lojas Ativas</CardTitle>
                            <TrendingUp className="h-5 w-5 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{lojas.filter((l) => l.is_active).length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Operando agora</p>
                        </CardContent>
                    </Card>
                    <Card className="glass-card shadow-primary w-[calc(100vw-32px)] snap-center shrink-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Lojas Inativas</CardTitle>
                            <Users className="h-5 w-5 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{lojas.filter((l) => !l.is_active).length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Precisam de atenção</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="hidden sm:grid sm:grid-cols-3 gap-4">
                <Card className="glass-card shadow-primary">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total de Lojas</CardTitle>
                        <Store className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{lojas.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Cadastradas na plataforma</p>
                    </CardContent>
                </Card>
                <Card className="glass-card shadow-primary">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Lojas Ativas</CardTitle>
                        <TrendingUp className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{lojas.filter((l) => l.is_active).length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Operando agora</p>
                    </CardContent>
                </Card>
                <Card className="glass-card shadow-primary">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Lojas Inativas</CardTitle>
                        <Users className="h-5 w-5 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{lojas.filter((l) => !l.is_active).length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Precisam de atenção</p>
                    </CardContent>
                </Card>
            </div>

            {/* CARDS LOJAS */}
            <div>
                {loading ? (<div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-green-500" /></div>) : lojas.length === 0 ? (<p>Nenhuma loja cadastrada ainda.</p>) : (
                    <>
                        <div className="sm:hidden overflow-x-auto scrollbar-hide snap-x px-4 py-0">
                            <div className="flex w-max gap-6">
                                {lojas.map((loja) => (
                                    <Card key={`mobile-${loja.id}`} className="group flex-col glass-card shadow-primary hover:shadow-[0_8px_40px_0_rgba(34,197,94,0.30)] transition-all duration-300 w-[calc(100vw-32px)] snap-center shrink-0">
                                        <CardHeader className="pb-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                                    <Store className="w-6 h-6 text-green-500" />
                                                </div>
                                                <Badge variant={loja.is_active ? "default" : "secondary"} className={cn("font-semibold", loja.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30")}>
                                                    {loja.is_active ? "Ativa" : "Inativa"}
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-xl">{loja.nome}</CardTitle>
                                            <CardDescription className="text-sm">/{loja.slug}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-3 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <User size={14} />
                                                <span className="font-medium">{loja.gerente?.nome ?? "Sem dono"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Mail size={14} />
                                                <span className="text-xs break-all">{loja.gerente?.email ?? "-"}</span>
                                            </div>
                                            {loja.endereco && (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <MapPin size={14} />
                                                    <span className="text-xs">{loja.endereco}</span>
                                                </div>
                                            )}
                                        </CardContent>
                                        <div className="p-4 pt-2 flex gap-2 opacity-100">
                                            <Link href={`/admin/empresas/${loja.slug}`} className={cn(buttonVariants({ size: "sm", variant: "outline" }), "flex-1 gap-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10")}>
                                                <Eye size={14} /> Ver
                                            </Link>
                                            <Button size="sm" variant="outline" className="flex-1 gap-1 border-orange-500/30 text-orange-400 hover:bg-orange-500/10" onClick={() => handleOpenModal(loja)}>
                                                <Edit size={14} /> Editar
                                            </Button>
                                            <Button size="sm" variant="outline" className="flex-1 gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => { setLojaToDelete(loja); setDeleteModalOpen(true); setDeleteError(null); }}> {/* 👈 limpa erro */}
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        <div className="hidden sm:grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {lojas.map((loja) => (
                                <Card key={`desktop-${loja.id}`} className="group flex-col glass-card shadow-primary hover:shadow-[0_8px_40px_0_rgba(34,197,94,0.30)] transition-all duration-300">
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                                <Store className="w-6 h-6 text-green-500" />
                                            </div>
                                            <Badge variant={loja.is_active ? "default" : "secondary"} className={cn("font-semibold", loja.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30")}>
                                                {loja.is_active ? "Ativa" : "Inativa"}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl">{loja.nome}</CardTitle>
                                        <CardDescription className="text-sm">/{loja.slug}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-3 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <User size={14} />
                                            <span className="font-medium">{loja.gerente?.nome ?? "Sem dono"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Mail size={14} />
                                            <span className="text-xs break-all">{loja.gerente?.email ?? "-"}</span>
                                        </div>
                                        {loja.endereco && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin size={14} />
                                                <span className="text-xs">{loja.endereco}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                    <div className="p-4 pt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100">
                                        <Link href={`/admin/empresas/${loja.slug}`} className={cn(buttonVariants({ size: "sm", variant: "outline" }), "flex-1 gap-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10")}>
                                            <Eye size={14} /> Ver
                                        </Link>
                                        <Button size="sm" variant="outline" className="flex-1 gap-1 border-orange-500/30 text-orange-400 hover:bg-orange-500/10" onClick={() => handleOpenModal(loja)}>
                                            <Edit size={14} /> Editar
                                        </Button>
                                        <Button size="sm" variant="outline" className="flex-1 gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => { setLojaToDelete(loja); setDeleteModalOpen(true); setDeleteError(null); }}> {/* 👈 limpa erro */}
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* MODAL CONFIRMAR EDIÇÃO */}
            <ConfirmModal
                open={confirmModalOpen}
                onOpenChange={(v) => { setConfirmModalOpen(v); if (!v) setConfirmError(null); }} // 👈 limpa erro ao fechar
                adminSenha={formData.adminSenha}
                setAdminSenha={(v) => handleChange('adminSenha', v)}
                onConfirm={handleConfirmSave}
                saving={isSaving}
                error={confirmError} // 👈 passa erro
            />

            {/* MODAL DELETAR */}
            <DeleteModal
                open={deleteModalOpen}
                onOpenChange={(v) => { setDeleteModalOpen(v); if (!v) setDeleteError(null); }} // 👈 limpa erro ao fechar
                loja={lojaToDelete}
                adminSenha={adminSenhaDelete}
                setAdminSenha={(v) => { setAdminSenhaDelete(v); setDeleteError(null); }} // 👈 limpa erro ao digitar
                onDelete={handleDeleteLoja}
                deleting={isDeleting}
                error={deleteError} // 👈 passa erro
            />
        </div>
    );
}
