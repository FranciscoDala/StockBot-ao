"use client";

import { useEffect, useState } from "react";
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
  DialogClose
} from "@/components/ui/dialog";
import { Shield, Store, Users, Plus, Edit, Eye, User, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Gerente = { id: string; nome: string; email: string; };

type Loja = {
  id: string;
  nome: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  gerente: Gerente | null;
};

type FormData = {
  nome: string;
  slug: string;
  is_active: boolean;
  gerente_nome: string;
  gerente_email: string;
  gerente_senha: string;
};

const API_URL = "http://127.0.0.1:8000/api/v1";
const LOGIN_ROUTE = "/login";
const emptyForm: FormData = { nome: "", slug: "", is_active: true, gerente_nome: "", gerente_email: "", gerente_senha: "" };

export default function AdminDashboard() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingLoja, setEditingLoja] = useState<Loja | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [lojaToDelete, setLojaToDelete] = useState<Loja | null>(null);
  const [adminSenha, setAdminSenha] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.replace(LOGIN_ROUTE);
  };

  const fetchLojas = () => {
    const token = localStorage.getItem("token");
    if (!token) return handleLogout();
    setLoading(true);
    fetch(`${API_URL}/lojas`, { headers: { Authorization: `Bearer ${token}` } })
 .then((res) => res.status === 401? (handleLogout(), Promise.reject()) : res.json())
 .then((data) => setLojas(Array.isArray(data)? data : data.data?? data.lojas?? []))
 .catch(() => setLojas([]))
 .finally(() => setLoading(false));
  }

  useEffect(() => { fetchLojas(); }, []);

  const handleOpenModal = (loja: Loja | null = null) => {
    setEditingLoja(loja);
    if (loja) {
      setFormData({
        nome: loja.nome,
        slug: loja.slug,
        is_active: loja.is_active,
        gerente_nome: loja.gerente?.nome?? "",
        gerente_email: loja.gerente?.email?? "",
        gerente_senha: "",
      });
    } else {
      setFormData(emptyForm);
    }
    setOpen(true);
  };

  const handleSaveLoja = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem("token");
    const isEditing =!!editingLoja;
    const url = isEditing? `${API_URL}/lojas/${editingLoja.id}` : `${API_URL}/lojas`;
    const method = isEditing? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.status === 401) return handleLogout();
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Erro ao salvar loja'); }

      toast.success(isEditing? "Loja atualizada" : "Loja criada");
      setOpen(false);
      setEditingLoja(null);
      setFormData(emptyForm);
      fetchLojas();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar loja. Verifique o slug/email.");
    } finally {
      setIsSaving(false);
    }
  }

  const handleDeleteLoja = async () => {
    if (!lojaToDelete ||!adminSenha) return;
    setIsDeleting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/lojas/${lojaToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ senha: adminSenha })
      });
      if (res.status === 401) return handleLogout();
      if (res.status === 403) throw new Error("Senha incorreta");
      if (!res.ok) throw new Error("Erro ao apagar loja");

      toast.success(`Loja ${lojaToDelete.nome} apagada`);
      setDeleteModalOpen(false);
      setLojaToDelete(null);
      setAdminSenha("");
      fetchLojas();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({...prev, [field]: value }));
    if (field === 'nome' &&!editingLoja) {
      setFormData(prev => ({...prev, slug: value.toString().toLowerCase().replace(/\s+/g, '-') }));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8 text-green-500" />
            Painel Admin
          </h1>
          <p className="text-muted-foreground">Gestão de todas as lojas da plataforma</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => handleOpenModal()} className="gap-2 w-full md:w-auto bg-green-600 hover:bg-green-700 text-white shadow-md">
            <Plus className="w-4 h-4" /> Nova Loja
          </Button>
          <DialogContent className="sm:max-w-[500px] bg-background">
            <form onSubmit={handleSaveLoja}>
              <DialogHeader>
                <DialogTitle>{editingLoja? "Editar Loja" : "Criar Nova Loja"}</DialogTitle>
                <DialogDescription>
                  {editingLoja? "Altere os dados abaixo." : `Preencha os dados. Slug: /${formData.slug || "minha-loja"}`}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
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
                  <Label htmlFor="active" className="text-right">Ativa</Label>
                  <Switch id="active" checked={formData.is_active} onCheckedChange={v => handleChange('is_active', v)} className="col-span-3 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-700" />
                </div>

                <div className="border-t pt-4 mt-2">
                  <p className="text-sm font-semibold text-muted-foreground -mb-2">Dados do Gerente</p>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gerente_nome" className="text-right">Nome</Label>
                  <Input id="gerente_nome" value={formData.gerente_nome} onChange={e => handleChange('gerente_nome', e.target.value)} className="col-span-3 bg-background" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gerente_email" className="text-right">Email</Label>
                  <Input id="gerente_email" type="email" value={formData.gerente_email} onChange={e => handleChange('gerente_email', e.target.value)} className="col-span-3 bg-background" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gerente_senha" className="text-right">Senha</Label>
                  <Input id="gerente_senha" type="password" value={formData.gerente_senha} onChange={e => handleChange('gerente_senha', e.target.value)} className="col-span-3 bg-background" placeholder={editingLoja? "Deixe em branco pra não alterar" : ""} required={!editingLoja} />
                </div>
              </div>
              <DialogFooter>
                {/* Cancelar = Cinzento */}
                <DialogClose asChild>
                  <Button type="button" className="bg-gray-500 hover:bg-gray-600 text-white" onClick={() => setEditingLoja(null)}>
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
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total de Lojas</CardTitle><Store className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{lojas.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Lojas Ativas</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{lojas.filter((l) => l.is_active).length}</div></CardContent></Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Lojas Cadastradas</h2>
        {loading? (<p>Carregando lojas...</p>) : lojas.length === 0? (<p>Nenhuma loja cadastrada ainda.</p>) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {lojas.map((loja) => (
              <Card key={loja.id} className="flex flex-col hover:border-green-500 transition-colors">
                <CardHeader><div className="flex justify-between items-start"><Store className="w-6 h-6 text-green-500" /><Badge variant={loja.is_active? "default" : "secondary"} className={loja.is_active? "bg-green-600 hover:bg-green-700" : ""}>{loja.is_active? "Ativa" : "Inativa"}</Badge></div><CardTitle className="pt-2">{loja.nome}</CardTitle><CardDescription>/{loja.slug}</CardDescription></CardHeader>
                <CardContent className="flex-grow space-y-2 text-sm"><div className="flex items-center gap-2 text-muted-foreground"><User size={14} /><span>{loja.gerente?.nome?? "Sem gerente"}</span></div><div className="text-xs text-muted-foreground break-all">{loja.gerente?.email?? "-"}</div></CardContent>
                <div className="p-4 pt-0 flex gap-2">
                  {/* Ver = Azul com fundo - ROTA AJUSTADA AQUI */}
                  <Link href={`/admin/empresas/${loja.slug}`} className={cn(buttonVariants({ size: "sm" }), "flex-1 gap-1 bg-blue-600 hover:bg-blue-700 text-white")}>
                    <Eye size={14} />
                  </Link>
                  {/* Editar = Laranja com fundo */}
                  <Button size="sm" className="flex-1 gap-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleOpenModal(loja)}>
                    <Edit size={14} />
                  </Button>
                  {/* Apagar = Vermelho com fundo */}
                  <Button size="sm" className="flex-1 gap-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => { setLojaToDelete(loja); setDeleteModalOpen(true); }}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background">
          <DialogHeader>
            <DialogTitle>Apagar {lojaToDelete?.nome}?</DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. Vai apagar a loja, produtos, vendas e tudo mais.
              Digita a tua senha de ADMIN para confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              type="password"
              placeholder="Senha do ADMIN"
              value={adminSenha}
              onChange={(e) => setAdminSenha(e.target.value)}
              className="bg-background"
            />
          </div>
          <DialogFooter>
            {/* Cancelar = Cinzento */}
            <Button className="bg-gray-500 hover:bg-gray-600 text-white" onClick={() => { setDeleteModalOpen(false); setAdminSenha(""); }}>
              Cancelar
            </Button>
            {/* Apagar para sempre = Vermelho */}
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteLoja} disabled={isDeleting ||!adminSenha}>
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Apagar para sempre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}