"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Shield, Store, Users, Plus, Edit, Eye, User, Loader2, Trash2, AlertTriangle } from "lucide-react"; // <- LogOut removido
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Dono = { id: string; nome: string; email: string; telefone: string | null };
type Gerente = Dono;

type Loja = {
    id: string;
    nome: string;
    slug: string;
    is_active: boolean;
    created_at: string;
    endereco: string | null;
    gerente: Gerente | null;
};

type DonoNovoForm = { nome: string; email: string; senha: string; telefone: string; };

type FormData = {
    nome: string; slug: string; is_active: boolean; endereco: string;
    modoDono: 'existente' | 'novo';
    dono_existente_id: string;
    dono_novo: DonoNovoForm;
    dono: Dono | null;
    adminSenha: string;
};

const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? "http://127.0.0.1:8000/api/v1" // Local
  : "https://gentle-playfulness-production-d333.up.railway.app/api/v1"; // Produção HTTPS


const LOGIN_ROUTE = "/login";
const emptyForm: FormData = {
    nome: "", slug: "", is_active: true, endereco: "",
    modoDono: 'novo', dono_existente_id: "",
    dono_novo: { nome: "", email: "", senha: "", telefone: "" },
    dono: null, adminSenha: ""
};

const getCookie = (name: string): string | undefined => {
    if (typeof window === "undefined") return undefined;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match? decodeURIComponent(match[2]) : undefined;
};


const deleteCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

export default function AdminClient({ lojasIniciais, donosIniciais }: { lojasIniciais: Loja[], donosIniciais: Dono[] }) {
    const [lojas, setLojas] = useState<Loja[]>(lojasIniciais);
    const [donos, setDonos] = useState<Dono[]>(donosIniciais);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [open, setOpen] = useState(false);
    const [editingLoja, setEditingLoja] = useState<Loja | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [lojaToDelete, setLojaToDelete] = useState<Loja | null>(null);
    const [adminSenhaDelete, setAdminSenhaDelete] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>(emptyForm);
    const isLoggingOut = useRef(false);

    // TRAVA DE VOLTAR
    useEffect(() => {
        window.history.pushState(null, '', window.location.href);
        const handlePopState = () => {
          if(!isLoggingOut.current) {
            window.history.pushState(null, '', window.location.href);
          }
        };
        window.addEventListener('popstate', handlePopState);
        return () => { window.removeEventListener('popstate', handlePopState) }
    }, []);

    const handleTerminarSessao = () => {
        isLoggingOut.current = true;
        deleteCookie("token");
        deleteCookie("user");
        router.replace(LOGIN_ROUTE);
    };

    const fetchLojas = async () => {
        const token = getCookie("token");
        if (!token) return handleTerminarSessao();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/lojas`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
            if (res.status === 401) return handleTerminarSessao();
            const data = await res.json();
            setLojas(Array.isArray(data)? data : data.data?? data.lojas?? []);
        } catch { setLojas([]); } finally { setLoading(false); }
    }

    const fetchDonos = async () => {
        const token = getCookie("token");
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/lojas/donos`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
            if (!res.ok) return setDonos([]);
            const data = await res.json();
            setDonos(data);
        } catch { setDonos([]); }
    }

    const handleOpenModal = async (loja: Loja | null = null) => {
        setEditingLoja(loja);
        if (loja) {
            const token = getCookie("token");
            const res = await fetch(`${API_URL}/lojas/${loja.slug}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
            const data = await res.json();
            setFormData({
         ...emptyForm, nome: data.nome || "", slug: data.slug || "", is_active: data.is_active?? true,
                endereco: data.endereco || "", modoDono: 'existente',
                dono: data.gerente? {...data.gerente, telefone: data.gerente.telefone?? "" } : null
            });
        } else { setFormData(emptyForm); }
        setOpen(true);
    };

    const handleSubmitForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingLoja) { setConfirmModalOpen(true); }
        else { handleConfirmSave(); }
    }

    const handleConfirmSave = async () => {
        if (editingLoja &&!formData.adminSenha) { toast.error("Digite a senha do ADMIN para confirmar"); return; }
        setIsSaving(true);
        const token = getCookie("token");
        const isEditing =!!editingLoja;
        const url = isEditing? `${API_URL}/lojas/${editingLoja.id}` : `${API_URL}/lojas/`;
        const method = isEditing? 'PATCH' : 'POST';
        let payload: any = { nome: formData.nome, slug: formData.slug, is_active: formData.is_active, endereco: formData.endereco || null, };
        if (isEditing) {
            payload.senha_admin = formData.adminSenha
            payload.dono = {...formData.dono, telefone: formData.dono?.telefone?.trim() || null };
        } else {
            if (formData.modoDono === 'existente') {
                if (!formData.dono_existente_id) { toast.error("Seleciona um dono existente"); setIsSaving(false); return; }
                payload.dono_existente_id = formData.dono_existente_id;
            } else {
                if (!formData.dono_novo.nome ||!formData.dono_novo.email ||!formData.dono_novo.senha) { toast.error("Preenche todos os dados do novo dono"); setIsSaving(false); return; }
                payload.dono_novo = { nome: formData.dono_novo.nome, email: formData.dono_novo.email, senha: formData.dono_novo.senha, telefone: formData.dono_novo.telefone?.trim() || null, };
            }
        }
        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
            if (res.status === 401) return handleTerminarSessao();
            if (res.status === 403) { toast.error("Senha do ADMIN incorreta"); setIsSaving(false); return; }
            if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Erro ao salvar loja'); }
            toast.success(isEditing? "Loja atualizada" : "Loja criada");
            setOpen(false); setConfirmModalOpen(false); setEditingLoja(null); setFormData(emptyForm);
            await Promise.all([fetchLojas(), fetchDonos()]);
        } catch (err: any) { toast.error(err.message || "Erro ao salvar loja. Verifique o slug/email."); }
        finally { setIsSaving(false); setFormData(prev => ({...prev, adminSenha: "" })); }
    }

    const handleDeleteLoja = async () => {
        if (!lojaToDelete ||!adminSenhaDelete) { toast.error("Digite a senha do ADMIN para apagar"); return; }
        setIsDeleting(true);
        const token = getCookie("token");
        try {
            const res = await fetch(`${API_URL}/lojas/${lojaToDelete.id}`, {
                method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ senha_admin: adminSenhaDelete })
            });
            if (res.status === 401) return handleTerminarSessao();
            if (res.status === 403) { toast.error("Senha do ADMIN incorreta"); setIsDeleting(false); return; }
            if (!res.ok) throw new Error("Erro ao apagar loja");
            toast.success(`Loja ${lojaToDelete.nome} apagada`);
            setDeleteModalOpen(false); setLojaToDelete(null); setAdminSenhaDelete(""); await fetchLojas();
        } catch (err: any) { toast.error(err.message); } finally { setIsDeleting(false); }
    };

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({...prev, [field]: value }));
        if (field === 'nome' &&!editingLoja) { setFormData(prev => ({...prev, slug: value.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') })); }
    }
    const handleDonoChange = (field: string, value: string) => { setFormData(prev => ({...prev, dono: prev.dono? {...prev.dono, [field]: value } : null })); }
    const handleDonoNovoChange = (field: string, value: string) => { setFormData(prev => ({...prev, dono_novo: {...prev.dono_novo, [field]: value }})); }

    return (
        <div className="space-y-6">
            <style jsx global>{`.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}.hide-scrollbar::-webkit-scrollbar{display:none;}`}</style>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Shield className="w-8 h-8 text-green-500" />Painel Admin</h1>
                    <p className="text-muted-foreground">Gestão de todas as lojas da plataforma</p>
                </div>

                <Button onClick={() => handleOpenModal()} className="gap-2 w-full md:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md"> {/* <- WRAPPER E BOTAO VERMELHO REMOVIDOS */}
                    <Plus className="w-4 h-4" /> Nova Loja
                </Button>

            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) {setEditingLoja(null); setFormData(emptyForm)} }}>
            <DialogContent
                className="sm:max-w-[600px] bg-black/50 border-white/10 p-0 flex flex-col max-h-[85vh]"
                style={{ backdropFilter: 'blur(10px)' }}
            >
                <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 min-h-0">
                <DialogHeader className="p-6 pb-0 shrink-0">
                    <DialogTitle>{editingLoja? "Editar Loja" : "Criar Nova Loja"}</DialogTitle>
                    <DialogDescription>
                    {editingLoja? "Altere os dados abaixo." : `Preencha os dados. Slug: /${formData.slug || "minha-loja"}`}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 px-6 overflow-y-auto hide-scrollbar flex-1 min-h-0">

                    <p className="text-sm font-semibold text-muted-foreground -mb-2">Dados da Loja</p>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nome" className="text-right">Nome</Label>
                    <Input id="nome" value={formData.nome} onChange={e => handleChange('nome', e.target.value)} className="col-span-3 bg-background" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="slug" className="text-right">Slug</Label>
                    <Input id="slug" value={formData.slug} onChange={e => handleChange('slug', e.target.value)} className="col-span-3 bg-background" required disabled={!!editingLoja} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="endereco" className="text-right">Endereço</Label>
                    <Input id="endereco" value={formData.endereco} onChange={e => handleChange('endereco', e.target.value)} className="col-span-3 bg-background" placeholder="Rua, Bairro, Cidade" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="active" className="text-right">Ativa</Label>
                    <Switch id="active" checked={formData.is_active} onCheckedChange={v => handleChange('is_active', v)} className="col-span-3 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-700" />
                    </div>

                    {editingLoja && formData.dono && (
                    <>
                        <div className="border-t pt-4 mt-2">
                        <p className="text-sm font-semibold text-muted-foreground -mb-2">Dados do Dono</p>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Nome</Label>
                        <Input value={formData.dono.nome} onChange={e => handleDonoChange('nome', e.target.value)} className="col-span-3 bg-background" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Email</Label>
                        <Input type="email" value={formData.dono.email} onChange={e => handleDonoChange('email', e.target.value)} className="col-span-3 bg-background" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Telefone</Label>
                        <Input value={formData.dono.telefone?? ""} onChange={e => handleDonoChange('telefone', e.target.value)} placeholder="Ex: 923456789" className="col-span-3 bg-background" />
                        </div>
                    </>
                    )}

                    {!editingLoja && (
                    <>
                        <div className="border-t pt-4 mt-2">
                        <p className="text-sm font-semibold text-muted-foreground -mb-2">Dono da Loja</p>
                        </div>
                        <div className="grid w-full grid-cols-2 gap-2">
                        <Button type="button" variant={formData.modoDono === 'existente'? 'default' : 'outline'} onClick={() => handleChange('modoDono', 'existente')} className={formData.modoDono === 'existente'? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                            Dono Existente
                        </Button>
                        <Button type="button" variant={formData.modoDono === 'novo'? 'default' : 'outline'} onClick={() => handleChange('modoDono', 'novo')} className={formData.modoDono === 'novo'? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                            Criar Novo Dono
                        </Button>
                        </div>

                        {formData.modoDono === 'existente' && (
                        <div className="space-y-4 pt-2">
                            <select value={formData.dono_existente_id} onChange={(e) => handleChange('dono_existente_id', e.target.value)} required={formData.modoDono === 'existente'} className="flex h-10 w-full rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            <option value="" disabled>{donos.length > 0? "Seleciona um dono..." : "Nenhum dono cadastrado"}</option>
                            {donos.map(d => <option key={d.id} value={d.id}>{d.nome} - {d.email}</option>)}
                            </select>
                        </div>
                        )}

                        {formData.modoDono === 'novo' && (
                        <div className="space-y-4 pt-2">
                            <Input placeholder="Nome do Dono" value={formData.dono_novo.nome} onChange={e => handleDonoNovoChange('nome', e.target.value)} required={formData.modoDono === 'novo'} />
                            <Input type="email" placeholder="Email do Dono" value={formData.dono_novo.email} onChange={e => handleDonoNovoChange('email', e.target.value)} required={formData.modoDono === 'novo'} />
                            <Input type="password" placeholder="Senha do Dono" value={formData.dono_novo.senha} onChange={e => handleDonoNovoChange('senha', e.target.value)} required={formData.modoDono === 'novo'} />
                            <Input placeholder="Telefone Opcional" value={formData.dono_novo.telefone} onChange={e => handleDonoNovoChange('telefone', e.target.value)} />
                        </div>
                        )}
                    </>
                    )}
                </div>
                <DialogFooter className="p-6 pt-0 bg-background shrink-0 border-t border-white/10">
                    <DialogClose asChild>
                    <Button type="button" className="bg-gray-500 hover:bg-gray-600 text-white">
                        Cancelar
                    </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSaving} className="gap-2 bg-green-600 hover:bg-green-700">
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingLoja? "Salvar Alterações" : "Salvar Loja"}
                    </Button>
                </DialogFooter>
                </form>
            </DialogContent>
            </Dialog>


            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0"><CardTitle className="text-sm font-medium">Total de Lojas</CardTitle><Store className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{lojas.length}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0"><CardTitle className="text-sm font-medium">Lojas Ativas</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{lojas.filter((l) => l.is_active).length}</div></CardContent></Card>
            </div>

            <div>
                {loading? (<p>Carregando lojas...</p>) : lojas.length === 0? (<p>Nenhuma loja cadastrada ainda.</p>) : (
                    <div className="grid grid-flow-col auto-cols-[100%] sm:auto-cols-[calc(50%-0.5rem)] md:auto-cols-[calc(33.333%-0.666rem)] lg:auto-cols-[calc(25%-0.75rem)] gap-4 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory">
                        {lojas.map((loja) => (
                            <Card key={loja.id} className="flex flex-col hover:border-green-500 transition-colors snap-start">
                                <CardHeader><div className="flex justify-between items-start"><Store className="w-6 h-6 text-green-500" /><Badge variant={loja.is_active? "default" : "secondary"} className={loja.is_active? "bg-green-600 hover:bg-green-700" : ""}>{loja.is_active? "Ativa" : "Inativa"}</Badge></div><CardTitle className="pt-2">{loja.nome}</CardTitle><CardDescription>/{loja.slug}</CardDescription></CardHeader>
                                <CardContent className="flex-grow space-y-2 text-sm"><div className="flex items-center gap-2 text-muted-foreground"><User size={14} /><span>{loja.gerente?.nome?? "Sem dono"}</span></div><div className="text-xs text-muted-foreground break-all">{loja.gerente?.email?? "-"}</div></CardContent>
                                <div className="p-4 pt-0 flex gap-2">
                                    <Link href={`/admin/empresas/${loja.slug}`} className={cn(buttonVariants({ size: "sm" }), "flex-1 gap-1 bg-blue-600 hover:bg-blue-700 text-white")}><Eye size={14} /></Link>
                                    <Button size="sm" className="flex-1 gap-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleOpenModal(loja)}><Edit size={14} /></Button>
                                    <Button size="sm" className="flex-1 gap-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => { setLojaToDelete(loja); setDeleteModalOpen(true); }}><Trash2 size={14} /></Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={confirmModalOpen} onOpenChange={(v) => { if (!v) { setConfirmModalOpen(false); setFormData(prev => ({...prev, adminSenha: "" })) } }}>
                <DialogContent className="sm:max-w-[425px] bg-black/50 border-white/10" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500" />Confirmar Edição</DialogTitle><DialogDescription>Para editar esta loja, digite a sua senha de ADMIN.</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-4"><Input type="password" placeholder="Senha do ADMIN" value={formData.adminSenha} onChange={(e) => handleChange('adminSenha', e.target.value)} className="bg-background" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleConfirmSave()} /></div>
                    <DialogFooter>
                        <Button className="bg-gray-500 hover:bg-gray-600 text-white" onClick={() => { setConfirmModalOpen(false); setFormData(prev => ({...prev, adminSenha: "" })); }}>Cancelar</Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirmSave} disabled={isSaving ||!formData.adminSenha}>{isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteModalOpen} onOpenChange={(v) => { if (!v) { setDeleteModalOpen(false); setAdminSenhaDelete("") } }}>
                <DialogContent className="sm:max-w-[425px] bg-black/50 border-white/10" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader><DialogTitle>Apagar {lojaToDelete?.nome}?</DialogTitle><DialogDescription>Esta ação é irreversível. Digita a tua senha de ADMIN para confirmar.</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-4"><Input type="password" placeholder="Senha do ADMIN" value={adminSenhaDelete} onChange={(e) => setAdminSenhaDelete(e.target.value)} className="bg-background" onKeyDown={(e) => e.key === 'Enter' && handleDeleteLoja()} /></div>
                    <DialogFooter>
                        <Button className="bg-gray-500 hover:bg-gray-600 text-white" onClick={() => { setDeleteModalOpen(false); setAdminSenhaDelete(""); }}>Cancelar</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteLoja} disabled={isDeleting ||!adminSenhaDelete}>{isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Apagar para sempre</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
