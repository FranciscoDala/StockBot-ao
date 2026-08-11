"use client";
import { useState, useEffect, useMemo } from "react";
import { Users, UserCheck, AlertCircle, DollarSign, ChevronLeft, ChevronRight, Eye, Plus, ShoppingCart, Receipt, Banknote, Search, Filter, Wallet, X, Calendar, Package, Loader2, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClienteModal, ClienteForm } from "../modals/clientemodal";
import { Produto } from "../modals/ProdutoModal";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type Cliente = {
    id: string;
    nome: string;
    telefone?: string | null;
    email?: string | null;
    total_divida: number;
    ultima_compra: string | null;
    status: 'com_divida' | 'em_dia';
}

type VendaPendente = {
    id: string;
    data_venda: string;
    total: number;
    valor_recebido: number;
    saldo_devedor: number;
    status: string;
    total_itens: number;
}

type Props = {
    lojaId: string;
    token: string | null;
    theme: string;
    cardStyle: string;
    cardSize: string;
    formatCurrency: (v: number) => string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stockbot-ao.onrender.com/api/v1";

type FiltroCliente = 'todos' | 'com_divida' | 'novo' | 'em_dia';
type ProdutoCarrinho = Omit<Produto, 'unidade'> & { qtd: number };

export function ClientesTab({ lojaId, token, theme, cardStyle, cardSize, formatCurrency }: Props) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<FiltroCliente>('com_divida');
    const [busca, setBusca] = useState("");
    const [pagina, setPagina] = useState(1);
    const ITENS_POR_PAGINA = 8;

    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savingPagamento, setSavingPagamento] = useState(false);
    const [editingClienteId, setEditingClienteId] = useState<string | null>(null); // <- NOVO
    const [editingCliente, setEditingCliente] = useState<ClienteForm | null>(null);
    const [formDataCliente, setFormDataCliente] = useState<ClienteForm>({
        nome: "", nome_empresa: null, bi: null, telefone: null, email: null,
        endereco: null, cidade: null, provincia: null, observacoes: null, is_active: true
    });

    const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
    const [showDetalhes, setShowDetalhes] = useState(false);
    const [vendasPendentes, setVendasPendentes] = useState<VendaPendente[]>([]);
    const [abaDetalhes, setAbaDetalhes] = useState<'extrato' | 'nova_compra'>('extrato');

    const [carrinhoFiado, setCarrinhoFiado] = useState<ProdutoCarrinho[]>([]);
    const [produtosLoja, setProdutosLoja] = useState<Produto[]>([]);

    const [showPagarModal, setShowPagarModal] = useState(false);
    const [vendaSelecionada, setVendaSelecionada] = useState<VendaPendente | null>(null);
    const [valorPagamento, setValorPagamento] = useState("");
    const [formaPagamento, setFormaPagamento] = useState("Dinheiro");

    // ESTADOS DO MODAL DE SENHA - IGUAL PRODUTO/EQUIPA
    const [showPermissaoModal, setShowPermissaoModal] = useState(false);
    const [acaoPendente, setAcaoPendente] = useState<{ tipo: 'editar' | 'apagar', data: Cliente | null } | null>(null);
    const [senhaDono, setSenhaDono] = useState("");

    const fetchClientes = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/lojas/${lojaId}/clientes`, { headers: { "Authorization": `Bearer ${token}` } });
            if (!res.ok) throw new Error(`Erro ${res.status}`)
            const data = await res.json();
            setClientes((Array.isArray(data) ? data : []).map((c: any) => ({
                ...c,
                total_divida: c.total_divida ?? 0,
                ultima_compra: c.ultima_compra || null
            })));
        } catch (e) {
            toast.error("Erro ao carregar clientes")
            setClientes([])
        } finally { setLoading(false) }
    }

    const fetchDetalhesCliente = async (cliente: Cliente, abrirModal = true) => {
        if (!token) return;
        if (abrirModal) {
            setClienteSelecionado(cliente);
            setShowDetalhes(true);
            setAbaDetalhes('extrato');
        } else {
            setClienteSelecionado(cliente);
        }

        try {
            const res = await fetch(`${API_URL}/lojas/${lojaId}/clientes/${cliente.id}/pendentes`, { headers: { "Authorization": `Bearer ${token}` } });
            const data = await res.json();
            setVendasPendentes(Array.isArray(data) ? data : []);
        } catch { setVendasPendentes([]) }

        await fetchClientes();
    }

    const handleLancarFiado = async () => {
        if (!token || !clienteSelecionado || carrinhoFiado.length === 0) return;
        setSaving(true);
        try {
            const itens = carrinhoFiado.map(i => ({
                produto_id: i.id, quantidade: i.qtd,
                preco_unitario: Number(i.preco), subtotal: Number(i.preco) * i.qtd
            }));
            const total = itens.reduce((acc, i) => acc + i.preco_unitario * i.quantidade, 0);
            const total_itens = carrinhoFiado.reduce((acc, i) => acc + i.qtd, 0);

            const payload = {
                cliente_id: clienteSelecionado.id, itens, total: Number(total), total_itens,
                forma_pagamento: "Fiado", status: "divida", valor_recebido: 0, troco: 0
            };

            const res = await fetch(`${API_URL}/vendas/`, {
                method: 'POST', headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error((await res.json()).detail || "Erro ao lançar");

            toast.success("Compra lançada na conta do cliente!");
            setCarrinhoFiado([]);
            await fetchDetalhesCliente(clienteSelecionado);
            await fetchClientes();
        } catch (err: any) {
            toast.error(err.message || "Erro ao lançar")
        } finally { setSaving(false) }
    }

    const handleAbrirPagar = (venda: VendaPendente) => {
        setVendaSelecionada(venda);
        setValorPagamento(String(venda.saldo_devedor));
        setShowPagarModal(true);
    }

    const handleConfirmarPagamento = async () => {
        if (!token || !clienteSelecionado || !vendaSelecionada || !valorPagamento || parseFloat(valorPagamento) <= 0) {
            return toast.error("Valor inválido");
        }
        setSavingPagamento(true);
        try {
            const url = `${API_URL}/lojas/${lojaId}/clientes/${clienteSelecionado.id}/vendas/${vendaSelecionada.id}/pagar`;
            const payload = {
                valor: parseFloat(valorPagamento),
                forma_pagamento: formaPagamento,
                observacao: `Pagamento venda ${vendaSelecionada.id.slice(0, 8)}`
            };

            const res = await fetch(url, {
                method: 'POST',
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error((await res.json()).detail || "Erro ao pagar");

            toast.success("Pagamento registrado!");
            setShowPagarModal(false);
            setVendaSelecionada(null);
            await fetchClientes();
            await fetchDetalhesCliente(clienteSelecionado, false);
        } catch (err: any) {
            toast.error(err?.detail || err?.message || "Erro ao pagar")
        } finally { setSavingPagamento(false) }
    }

    // ABRIR MODAL DE EDITAR
    const handleEditClick = (c: Cliente) => {
        setEditingClienteId(c.id); // <- guarda o id aqui
        setEditingCliente({
            nome: c.nome,
            nome_empresa: null,
            bi: null,
            telefone: c.telefone || null,
            email: c.email || null,
            endereco: null,
            cidade: null,
            provincia: null,
            observacoes: null,
            is_active: true
        });
        setAcaoPendente({ tipo: 'editar', data: c });
        setShowPermissaoModal(true);
    }

    // ABRIR MODAL DE APAGAR
    const handleDeleteClick = (c: Cliente) => {
        setAcaoPendente({ tipo: 'apagar', data: c });
        setShowPermissaoModal(true);
    }

    // EXECUTAR COM SENHA - IGUAL PRODUTO
    const executarAcaoComSenha = async () => {
        if (!token || !acaoPendente || !senhaDono) return;
        setSaving(true);
        try {
            if (acaoPendente.tipo === 'editar' && editingClienteId) { // <- checa o id
                const payload = { ...formDataCliente, senha_dono: senhaDono };
                const res = await fetch(`${API_URL}/lojas/${lojaId}/clientes/${editingClienteId}`, { // <- usa editingClienteId
                    method: 'PUT', headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error((await res.json()).detail || "Erro ao editar");
                toast.success("Cliente atualizado!");
            }

            if (acaoPendente.tipo === 'apagar' && acaoPendente.data) {
                const res = await fetch(`${API_URL}/lojas/${lojaId}/clientes/${acaoPendente.data.id}`, {
                    method: 'DELETE', headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ senha_dono: senhaDono })
                });
                if (!res.ok) throw new Error((await res.json()).detail || "Erro ao apagar");
                toast.success("Cliente apagado!");
            }

            setShowPermissaoModal(false);
            setSenhaDono("");
            setAcaoPendente(null);
            setEditingCliente(null);
            setEditingClienteId(null); // <- limpa também
            fetchClientes();
        } catch (err: any) {
            toast.error(err.message || "Senha incorreta");
        } finally { setSaving(false); }
    }

    const handleSaveCliente = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !lojaId) return toast.error("Erro: Loja não encontrada");
        setSaving(true);
        try {
            const payload: Record<string, any> = { ...formDataCliente, loja_id: lojaId };
            for (const key in payload) { if (payload[key] === "") payload[key] = null; }
            const res = await fetch(`${API_URL}/lojas/${lojaId}/clientes`, {
                method: 'POST', headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error((await res.json()).detail || "Erro ao salvar");
            toast.success("Cliente cadastrado com sucesso!");
            setShowModal(false);
            setFiltro('todos');
            setFormDataCliente({ nome: "", nome_empresa: null, bi: null, telefone: null, email: null, endereco: null, cidade: null, provincia: null, observacoes: null, is_active: true });
            fetchClientes();
        } catch (err: any) {
            toast.error(err.message || "Erro ao cadastrar cliente");
        } finally { setSaving(false); }
    }

    const adicionarAoCarrinhoFiado = (p: Produto) => {
        setCarrinhoFiado(prev => {
            const item = prev.find(i => i.id === p.id);
            if (item) return prev.map(i => i.id === p.id ? { ...i, qtd: i.qtd + 1 } : i);
            const { unidade, ...restoDoProduto } = p;
            return [...prev, { ...restoDoProduto, qtd: 1 }];
        })
    }

    const removerDoCarrinho = (id: string) => setCarrinhoFiado(prev => prev.filter(i => i.id !== id));
    const totalCarrinhoFiado = carrinhoFiado.reduce((acc, i) => acc + i.preco * i.qtd, 0);
    useEffect(() => { fetchClientes() }, [lojaId, token]);

    const totalComDivida = clientes.filter(c => (c.total_divida ?? 0) > 0).length;
    const totalEmDia = clientes.filter(c => (c.total_divida ?? 0) === 0).length;
    const valorTotalEmDivida = clientes.reduce((acc, c) => acc + (c.total_divida ?? 0), 0);

    const clientesFiltrados = useMemo(() => {
        let lista = [...clientes];
        if (filtro === 'com_divida') lista = lista.filter(c => (c.total_divida ?? 0) > 0);
        if (filtro === 'em_dia') lista = lista.filter(c => (c.total_divida ?? 0) === 0 && !!c.ultima_compra);
        if (filtro === 'novo') lista = lista.filter(c => (c.total_divida ?? 0) === 0 && !c.ultima_compra);

        if (busca) lista = lista.filter(c =>
            c.nome.toLowerCase().includes(busca.toLowerCase()) ||
            c.telefone?.includes(busca) ||
            c.email?.toLowerCase().includes(busca.toLowerCase())
        );

        lista.sort((a, b) => {
            const getTime = (d: string | null) => d ? new Date(d).getTime() : 0;
            return getTime(b.ultima_compra) - getTime(a.ultima_compra); // DESC
        });

        return lista;
    }, [clientes, filtro, busca]);

    const totalPaginas = Math.ceil(clientesFiltrados.length / ITENS_POR_PAGINA);
    const clientesPaginados = clientesFiltrados.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA);
    useEffect(() => { setPagina(1) }, [filtro, busca]);

    const radius = cardStyle === 'arredondado' ? '16px' : '8px';
    const padding = cardSize === 'grande' ? '20px' : '16px';

    if (loading) return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--cor-primaria)' }}></div></div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>Clientes <Users size={16} style={{ color: 'var(--cor-primaria)' }} /></h2>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Controle de dívidas e pagamentos</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingCliente(null);
                        setEditingClienteId(null);
                        setFormDataCliente({
                            nome: "",
                            nome_empresa: null,
                            bi: null,
                            telefone: null,
                            email: null,
                            endereco: null,
                            cidade: null,
                            provincia: null,
                            observacoes: null,
                            is_active: true
                        });
                        setShowModal(true)
                    }}
                    style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}
                >
                    <Plus size={16} /> Novo Cliente
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div style={{ background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', border: '1px solid #ef444430', borderRadius: radius, padding }}><p className="text-xs">Com Dívida</p><p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{totalComDivida}</p><p className="text-xs">{formatCurrency(valorTotalEmDivida)}</p></div>
                <div style={{ background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', border: '1px solid #22c55e40', borderRadius: radius, padding }}><p className="text-xs">Em Dia</p><p className="text-2xl font-bold" style={{ color: '#22c55e' }}>{totalEmDia}</p></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-primaria)30', borderRadius: radius, padding }}>
                <div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" /><Input placeholder="Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 h-9" /></div>
                <Select value={filtro} onValueChange={(v) => setFiltro(v as FiltroCliente)}>
                    <SelectTrigger className="w-full sm:w-[240px] h-9"><Filter size={14} className="mr-2" /> <SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos clientes</SelectItem>
                        <SelectItem value="com_divida">Com Dívida</SelectItem>
                        <SelectItem value="novo">Novo Cliente</SelectItem>
                        <SelectItem value="em_dia">Em Dia</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-primaria)30', borderRadius: radius, padding }}>
                <div className="space-y-3">
                    {clientesPaginados.length === 0 && <div className="text-center py-16"><DollarSign size={32} className="mx-auto mb-3 opacity-50" /><p>Nenhum cliente encontrado</p></div>}

                    {clientesPaginados.map(c => {
                        const temDivida = (c.total_divida ?? 0) > 0;
                        const isNovo = !temDivida && !c.ultima_compra;
                        const isPago = !temDivida && !!c.ultima_compra;

                        let badgeText = "Em Dia";
                        let badgeColor = "#22c55e";
                        let borderColor = "#22c55e";
                        let bgColor = 'color-mix(in srgb, #22c55e 5%, transparent)';
                        let buttonColor = "#22c55e";

                        if (temDivida) {
                            badgeText = "Devendo";
                            badgeColor = "#ef4444";
                            borderColor = "#ef4444";
                            bgColor = 'color-mix(in srgb, #ef4444 5%, transparent)';
                            buttonColor = "#ef4444";
                        } else if (isNovo) {
                            badgeText = "Novo Cliente";
                            badgeColor = "#3b82f6";
                            borderColor = "#3b82f6";
                            bgColor = 'color-mix(in srgb, #3b82f6 5%, transparent)';
                            buttonColor = "#3b82f6";
                        }

                        return (
                            <div key={c.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition hover:bg-[var(--cor-primaria)5]"
                                style={{
                                    border: `1px solid ${borderColor}`,
                                    background: bgColor,
                                    borderRadius: radius,
                                    padding
                                }}>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold truncate">{c.nome}</p>
                                        <Badge style={{ background: badgeColor, color: '#fff' }}>
                                            {badgeText}
                                        </Badge>
                                    </div>
                                    <p className="text-xs mt-1">{c.telefone || c.email || "Sem contato"}</p>
                                    <p className="text-xs mt-1 flex items-center gap-1">
                                        <Calendar size={12} />
                                        Última compra: {c.ultima_compra ? new Date(c.ultima_compra).toLocaleDateString('pt-AO') : "Nunca"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {temDivida && <div className="text-right"><p className="text-xs opacity-70">Dívida</p><p className="text-lg font-bold" style={{ color: '#ef4444' }}>{formatCurrency(c.total_divida ?? 0)}</p></div>}
                                    <Button size="sm" style={{ background: buttonColor, color: '#fff', fontSize: '12px', height: '32px' }} onClick={() => fetchDetalhesCliente(c)}><Eye size={14} /></Button>
                                    <Button size="sm" variant="outline" style={{ height: '32px' }} onClick={() => handleEditClick(c)}><Edit size={14} /></Button>
                                    <Button size="sm" variant="destructive" style={{ height: '32px' }} onClick={() => handleDeleteClick(c)}><Trash2 size={14} /></Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
                {totalPaginas > 1 && <div className="flex items-center justify-between mt-4"><p className="text-xs">Página {pagina} de {totalPaginas}</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}><ChevronLeft size={14} /></Button><Button size="sm" variant="outline" disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)}><ChevronRight size={14} /></Button></div></div>}
            </div>

            <ClienteModal open={showModal} onOpenChange={setShowModal} editingCliente={editingCliente} formData={formDataCliente} setFormData={setFormDataCliente} onSave={handleSaveCliente} saving={saving} handleChange={(field, value) => setFormDataCliente(prev => ({ ...prev, [field]: value }))} />

            {/* MODAL DE SENHA DO DONO - IGUAL PRODUTO/EQUIPA */}
            <Dialog open={showPermissaoModal} onOpenChange={setShowPermissaoModal}>
                <DialogContent style={{ backgroundColor: 'var(--cor-card)' }}>
                    <DialogHeader>
                        <DialogTitle>{acaoPendente?.tipo === 'editar' ? "Confirmar Edição" : "Confirmar Exclusão"}</DialogTitle>
                        <DialogDescription>Digite a senha do DONO para {acaoPendente?.tipo === 'editar' ? "editar" : "apagar"} o cliente {acaoPendente?.data?.nome}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div><Label>Senha do Dono</Label><Input type="password" value={senhaDono} onChange={e => setSenhaDono(e.target.value)} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowPermissaoModal(false); setSenhaDono("") }}>Cancelar</Button>
                        <Button onClick={executarAcaoComSenha} disabled={saving} style={{ background: 'var(--cor-primaria)', color: '#fff' }}>{saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
                {/*... resto do modal de detalhes igual... */}
                <DialogContent className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !flex !flex-col !border-0 !rounded-none !shadow-none !translate-x-0 !translate-y-0 [&>button]:hidden" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)' }}>
                    <DialogHeader className="p-4 sm:p-6 border-b shrink-0 flex-row items-center justify-between" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)', backgroundColor: 'var(--cor-card)' }}>
                        <div>
                            <DialogTitle className="text-lg sm:text-xl font-bold" style={{ color: 'var(--cor-texto)' }}>
                                Conta de: {clienteSelecionado?.nome}
                            </DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>
                                {clienteSelecionado?.telefone} {clienteSelecionado?.email && `• ${clienteSelecionado.email}`}
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            {(clienteSelecionado?.total_divida ?? 0) > 0 && (
                                <div className="text-right">
                                    <p className="text-xs opacity-70">Dívida Total</p>
                                    <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{formatCurrency(clienteSelecionado?.total_divida ?? 0)}</p>
                                </div>
                            )}
                            <button onClick={() => setShowDetalhes(false)} className="h-10 w-10 flex items-center justify-center rounded-lg transition hover:opacity-90 shrink-0" style={{ background: 'var(--cor-erro)', color: '#fff' }} aria-label="Fechar">
                                <X size={22} strokeWidth={3} />
                            </button>
                        </div>
                    </DialogHeader>
                    {/*... resto igual... */}
                </DialogContent>
            </Dialog>

            <Dialog open={showPagarModal} onOpenChange={setShowPagarModal}>
                <DialogContent style={{ backgroundColor: 'var(--cor-card)' }}>
                    <DialogHeader>
                        <DialogTitle>Pagar Dívida Específica</DialogTitle>
                        <DialogDescription>
                            Cliente: {clienteSelecionado?.nome} <br />
                            Venda de: {vendaSelecionada && new Date(vendaSelecionada.data_venda).toLocaleDateString('pt-AO')} • #{vendaSelecionada?.id.slice(0, 8)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-3 rounded" style={{ background: 'var(--cor-primaria)10' }}>
                            <Label>Valor da Dívida</Label>
                            <p className="font-bold text-2xl" style={{ color: '#ef4444' }}>{formatCurrency(vendaSelecionada?.saldo_devedor ?? 0)}</p>
                        </div>
                        <div><Label>Valor a Receber</Label><Input type="number" value={valorPagamento} onChange={e => setValorPagamento(e.target.value)} placeholder="Ex: 5000" disabled={savingPagamento} /></div>
                        <div><Label>Forma de Pagamento</Label>
                            <Select value={formaPagamento} onValueChange={setFormaPagamento} disabled={savingPagamento}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                    <SelectItem value="Transferencia">Transferência</SelectItem>
                                    <SelectItem value="TPA">TPA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPagarModal(false)} disabled={savingPagamento}>Cancelar</Button>
                        <Button onClick={handleConfirmarPagamento} disabled={savingPagamento} style={{ background: '#22c55e', color: '#fff' }}>
                            {savingPagamento ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                            {savingPagamento ? "Processando..." : "Confirmar Pagamento"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
