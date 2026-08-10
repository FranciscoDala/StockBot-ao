"use client";
import { useState, useEffect, useMemo } from "react";
import { Users, UserCheck, AlertCircle, DollarSign, ChevronLeft, ChevronRight, Eye, Plus, ShoppingCart, Receipt, Banknote, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClienteModal, ClienteForm } from "../modals/clientemodal";
import { Produto } from "../modals/ProdutoModal"; // <- reaproveita
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

type Cliente = {
    id: string;
    nome: string;
    telefone?: string | null;
    email?: string | null;
    total_divida: number;
    ultima_compra: string;
    status: 'com_divida' | 'em_dia';
}

type VendaPendente = {
    id: string;
    data_venda: string;
    total: number;
    total_itens: number;
    itens: { nome: string; quantidade: number; preco_unitario: number }[]
}

type Props = {
    lojaId: string;
    token: string | null;
    theme: string;
    cardStyle: string;
    cardSize: string;
    formatCurrency: (v: number) => string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://gentle-playfulness-production-d333.up.railway.app/api/v1";
type FiltroCliente = 'todos' | 'com_divida' | 'em_dia';

// 1. USA qtd EM VEZ DE unidade PRA NAO CONFLITAR COM STRING DO PRODUTO
type ProdutoCarrinho = Omit<Produto, 'unidade'> & { qtd: number };

export function ClientesTab({ lojaId, token, theme, cardStyle, cardSize, formatCurrency }: Props) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<FiltroCliente>('todos'); // <- MUDOU: começa em todos
    const [busca, setBusca] = useState(""); // <- NOVO
    const [pagina, setPagina] = useState(1);
    const ITENS_POR_PAGINA = 8;

    // ESTADOS GERAIS
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formDataCliente, setFormDataCliente] = useState<ClienteForm>({
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

    // ESTADOS FLUXO 2
    const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
    const [showDetalhes, setShowDetalhes] = useState(false);
    const [vendasPendentes, setVendasPendentes] = useState<VendaPendente[]>([]);
    const [abaDetalhes, setAbaDetalhes] = useState<'extrato' | 'nova_compra'>('extrato');

    // 2. CARRINHO AGORA USA ProdutoCarrinho
    const [carrinhoFiado, setCarrinhoFiado] = useState<ProdutoCarrinho[]>([]);
    const [produtosLoja, setProdutosLoja] = useState<Produto[]>([]);

    const fetchClientes = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/lojas/${lojaId}/clientes`, { headers: { "Authorization": `Bearer ${token}` } });
            if (!res.ok) throw new Error(`Erro ${res.status}`)
            const data = await res.json();
            const clientesFormatados = (Array.isArray(data)? data : []).map((c: any) => ({...c, total_divida: c.total_divida?? 0 }));
            setClientes(clientesFormatados);
        } catch (e) {
            console.error(e)
            toast.error("Erro ao carregar clientes")
            setClientes([])
        }
        finally { setLoading(false) }
    }

    const fetchDetalhesCliente = async (cliente: Cliente) => {
        if (!token) return;
        setClienteSelecionado(cliente);
        setShowDetalhes(true);
        setAbaDetalhes('extrato');
        try {
            const res = await fetch(`${API_URL}/lojas/${lojaId}/clientes/${cliente.id}/pendentes`, { headers: { "Authorization": `Bearer ${token}` } });
            const data = await res.json();
            setVendasPendentes(Array.isArray(data)? data : []);
        } catch { setVendasPendentes([]) }
        const resProd = await fetch(`${API_URL}/produtos?loja_id=${lojaId}`, { headers: { "Authorization": `Bearer ${token}` } });
        setProdutosLoja(await resProd.json());
    }

    const handleLancarFiado = async () => {
        if (!token ||!clienteSelecionado || carrinhoFiado.length === 0) return;
        setSaving(true);
        try {
            const itens = carrinhoFiado.map(i => ({ produto_id: i.id, quantidade: i.qtd, preco_unitario: i.preco }));
            const total = itens.reduce((acc, i) => acc + i.preco_unitario * i.quantidade, 0);
            const payload = { cliente_id: clienteSelecionado.id, loja_id: lojaId, itens, total, forma_pagamento: "Fiado", status: "pendente" };
            const res = await fetch(`${API_URL}/vendas/`, { method: 'POST', headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error("Erro ao lançar");
            toast.success("Compra lançada na conta do cliente!");
            setCarrinhoFiado([]);
            fetchDetalhesCliente(clienteSelecionado);
            fetchClientes();
        } catch (err: any) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleReceberPagamento = async () => {
        if (!token ||!clienteSelecionado) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/lojas/${lojaId}/clientes/${clienteSelecionado.id}/receber`, { method: 'POST', headers: { "Authorization": `Bearer ${token}` } });
            if (!res.ok) throw new Error("Erro ao receber");
            toast.success("Pagamento recebido! Conta zerada.");
            setShowDetalhes(false);
            fetchClientes();
        } catch (err: any) { toast.error(err.message) }
        finally { setSaving(false) }
    }

    const handleSaveCliente = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token ||!lojaId) {
            toast.error("Erro: Loja não encontrada");
            return;
        }
        setSaving(true);
        try {
            const payload = {...formDataCliente, loja_id: lojaId };
            if (payload.email === "") payload.email = null;
            if (payload.bi === "") payload.bi = null;
            if (payload.telefone === "") payload.telefone = null;
            if (payload.nome_empresa === "") payload.nome_empresa = null;
            if (payload.endereco === "") payload.endereco = null;
            if (payload.cidade === "") payload.cidade = null;
            if (payload.provincia === "") payload.provincia = null;
            if (payload.observacoes === "") payload.observacoes = null;

            const res = await fetch(`${API_URL}/lojas/${lojaId}/clientes`, {
                method: 'POST',
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || "Erro ao salvar");
            }
            toast.success("Cliente cadastrado com sucesso!");
            setShowModal(false);
            setFiltro('todos'); // <- NOVO: força mostrar na lista
            setFormDataCliente({ nome: "", nome_empresa: null, bi: null, telefone: null, email: null, endereco: null, cidade: null, provincia: null, observacoes: null, is_active: true });
            fetchClientes();
        } catch (err: any) {
            toast.error(err.message || "Erro ao cadastrar cliente");
        } finally {
            setSaving(false);
        }
    }

    const adicionarAoCarrinhoFiado = (p: Produto) => {
        setCarrinhoFiado(prev => {
            const item = prev.find(i => i.id === p.id);
            if (item) {
                return prev.map(i => i.id === p.id? {...i, qtd: i.qtd + 1 } : i);
            }
            const { unidade,...restoDoProduto } = p;
            const novoItem: ProdutoCarrinho = {...restoDoProduto, qtd: 1 };
            return [...prev, novoItem];
        })
    }

    const totalCarrinhoFiado = carrinhoFiado.reduce((acc, i) => acc + i.preco * i.qtd, 0);
    useEffect(() => { fetchClientes() }, [lojaId, token]);

    const totalComDivida = clientes.filter(c => (c.total_divida?? 0) > 0).length;
    const totalEmDia = clientes.filter(c => (c.total_divida?? 0) === 0).length;
    const valorTotalEmDivida = clientes.reduce((acc, c) => acc + (c.total_divida?? 0), 0);

    const clientesFiltrados = useMemo(() => {
        let lista = [...clientes];
        // FILTRO
        if (filtro === 'com_divida') lista = lista.filter(c => (c.total_divida?? 0) > 0);
        if (filtro === 'em_dia') lista = lista.filter(c => (c.total_divida?? 0) === 0);
        // BUSCA
        if (busca) lista = lista.filter(c =>
            c.nome.toLowerCase().includes(busca.toLowerCase()) ||
            c.telefone?.includes(busca) ||
            c.email?.toLowerCase().includes(busca.toLowerCase())
        );
        return lista;
    }, [clientes, filtro, busca]);

    const totalPaginas = Math.ceil(clientesFiltrados.length / ITENS_POR_PAGINA);
    const clientesPaginados = clientesFiltrados.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA);
    useEffect(() => { setPagina(1) }, [filtro, busca]);

    const radius = cardStyle === 'arredondado'? '16px' : '8px';
    const padding = cardSize === 'grande'? '20px' : '16px';

    if (loading) return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--cor-primaria)' }}></div></div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>Clientes <Users size={16} style={{ color: 'var(--cor-primaria)' }} /></h2>
                    <p className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Controle de dívidas e pagamentos</p>
                </div>
                <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 font-semibold transition hover:brightness-110 text-sm h-10 px-4" style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}><Plus size={16} /> Novo Cliente</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div style={{ background: 'var(--cor-primaria)', borderRadius: radius, color: '#fff', padding: padding }} className="transition hover:scale-[1.02]"><div className="flex items-center justify-between mb-2"><p className="text-xs" style={{ opacity: 0.9 }}>Total Clientes</p><Users size={16} /></div><p className="text-lg sm:text-xl font-bold">{clientes.length}</p></div>
                <div style={{ background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', backdropFilter: 'blur(12px)', border: '1px solid #ef444430', borderRadius: radius, color: 'var(--cor-texto)', padding: padding, boxShadow: '0 0 20px color-mix(in srgb, #ef4444 15%, transparent)' }} className="transition hover:scale-[1.02]"><div className="flex items-center justify-between mb-2"><p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Com Dívida</p><AlertCircle size={16} style={{ color: '#ef4444' }} /></div><p className="text-lg sm:text-xl font-bold" style={{ color: '#ef4444' }}>{totalComDivida}</p><p className="text-xs mt-1" style={{ color: 'var(--cor-texto-sec)' }}>{formatCurrency(valorTotalEmDivida)}</p></div>
                <div style={{ background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', backdropFilter: 'blur(12px)', border: '1px solid var(--cor-primaria)40', borderRadius: radius, color: 'var(--cor-texto)', padding: padding, boxShadow: '0 0 20px color-mix(in srgb, var(--cor-primaria) 15%, transparent)' }} className="transition hover:scale-[1.02]"><div className="flex items-center justify-between mb-2"><p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Em Dia</p><UserCheck size={16} style={{ color: 'var(--cor-primaria)' }} /></div><p className="text-lg sm:text-xl font-bold" style={{ color: 'var(--cor-primaria)' }}>{totalEmDia}</p></div>
            </div>

            {/* FILTRO PROFISSIONAL COM SELECT */}
            <div className="flex flex-col sm:flex-row gap-3" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-primaria)30', borderRadius: radius, padding: padding }}>
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--cor-texto-sec)' }} />
                    <Input
                        placeholder="Buscar cliente..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        className="pl-9 text-xs h-9"
                        style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)', borderRadius: radius }}
                    />
                </div>
                <Select value={filtro} onValueChange={(v) => setFiltro(v as FiltroCliente)}>
                    <SelectTrigger className="w-full sm:w-[240px] h-9 text-xs" style={{ backgroundColor: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', borderRadius: radius }}>
                        <Filter size={14} className="mr-2" /> <SelectValue placeholder="Filtrar clientes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos ({clientes.length})</SelectItem>
                        <SelectItem value="com_divida">Com Dívida ({totalComDivida})</SelectItem>
                        <SelectItem value="em_dia">Em Dia ({totalEmDia})</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-primaria)30', borderRadius: radius, padding: padding }}>
                <div className="space-y-3">
                    {clientesPaginados.length === 0 && (<div className="text-center py-16 border-2 border-dashed" style={{ borderColor: 'var(--cor-primaria)30', borderRadius: radius }}><DollarSign size={32} className="mx-auto mb-3" style={{ color: 'var(--cor-primaria)', opacity: 0.5 }} /><p className="text-sm font-medium" style={{ color: 'var(--cor-texto)' }}>{filtro === 'com_divida'? "Nenhum cliente com dívida" : filtro === 'em_dia'? "Nenhum cliente em dia" : "Nenhum cliente cadastrado"}</p></div>)}
                    {clientesPaginados.map(c => (
                        <div key={c.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:brightness-105 transition" style={{ backgroundColor: 'var(--cor-card)', border: `1px solid ${(c.total_divida?? 0) > 0? '#ef4444' : 'var(--cor-primaria)'}40`, borderRadius: radius, padding: padding }}>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1"><p className="font-medium text-sm sm:text-base truncate" style={{ color: 'var(--cor-texto)' }}>{c.nome}</p><span className="text-xs px-2 py-0.5 font-medium" style={{ backgroundColor: (c.total_divida?? 0) > 0? '#ef4444' : 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}>{(c.total_divida?? 0) > 0? "Com Dívida" : "Em Dia"}</span></div>
                                <p className="text-xs truncate" style={{ color: 'var(--cor-texto-sec)' }}>{c.telefone || c.email}</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-sec)' }}>Última compra: {new Date(c.ultima_compra).toLocaleDateString('pt-AO')}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                {(c.total_divida?? 0) > 0 && (<div className="text-right"><p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Dívida</p><p className="text-lg font-bold" style={{ color: '#ef4444' }}>{formatCurrency(c.total_divida?? 0)}</p></div>)}
                                <Button size="sm" variant="outline" onClick={() => fetchDetalhesCliente(c)} style={{ borderColor: 'var(--cor-primaria)', color: 'var(--cor-primaria)', borderRadius: radius, background: 'transparent' }}><Eye size={14} /> Detalhes</Button>
                            </div>
                        </div>
                    ))}
                </div>
                {totalPaginas > 1 && (<div className="flex items-center justify-between mt-4"><p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Página {pagina} de {totalPaginas} - {clientesFiltrados.length} resultados</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} style={{ borderColor: 'var(--cor-primaria)', borderRadius: radius }}><ChevronLeft size={14} /></Button><Button size="sm" variant="outline" disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)} style={{ borderColor: 'var(--cor-primaria)', borderRadius: radius }}><ChevronRight size={14} /></Button></div></div>)}
            </div>

            <ClienteModal open={showModal} onOpenChange={setShowModal} editingCliente={null} formData={formDataCliente} setFormData={setFormDataCliente} onSave={handleSaveCliente} saving={saving} handleChange={(field, value) => setFormDataCliente(prev => ({...prev, [field]: value }))} />

            <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
                <DialogContent className="w-full max-w-full sm:max-w-[800px] p-0 flex-col" style={{ backgroundColor: 'var(--cor-card)', height: '85vh', maxHeight: '85vh' }}>
                    <DialogHeader className="p-4 sm:p-6 pb-0 shrink-0">
                        <DialogTitle style={{ color: 'var(--cor-texto)' }}>Conta de: {clienteSelecionado?.nome}</DialogTitle>
                        <p className="text-sm" style={{ color: '#ef4444' }}>Dívida Atual: {formatCurrency(clienteSelecionado?.total_divida?? 0)}</p>
                        <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={() => setAbaDetalhes('extrato')} style={{ background: abaDetalhes === 'extrato'? 'var(--cor-primaria)' : 'var(--cor-card)', color: abaDetalhes === 'extrato'? '#fff' : 'var(--cor-texto)' }}><Receipt size={14} /> Extrato</Button>
                            <Button size="sm" onClick={() => setAbaDetalhes('nova_compra')} style={{ background: abaDetalhes === 'nova_compra'? 'var(--cor-primaria)' : 'var(--cor-card)', color: abaDetalhes === 'nova_compra'? '#fff' : 'var(--cor-texto)' }}><ShoppingCart size={14} /> Nova Compra</Button>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide">
                        {abaDetalhes === 'extrato' && (
                            <div className="space-y-3">
                                {vendasPendentes.length === 0? <p style={{ color: 'var(--cor-texto-sec)' }}>Nenhuma dívida em aberto</p> :
                                    vendasPendentes.map(v => (
                                        <div key={v.id} style={{ border: '1px solid var(--cor-primaria)30', borderRadius: radius, padding: padding }}>
                                            <div className="flex justify-between"><p className="font-semibold">{new Date(v.data_venda).toLocaleDateString('pt-AO')}</p><p className="font-bold" style={{ color: '#ef4444' }}>{formatCurrency(v.total)}</p></div>
                                            <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>{v.total_itens} itens</p>
                                        </div>
                                    ))
                                }
                            </div>
                        )}
                        {abaDetalhes === 'nova_compra' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                    <p className="font-semibold mb-2">Produtos da Loja</p>
                                    <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                                        {produtosLoja.map(p => <div key={p.id} onClick={() => adicionarAoCarrinhoFiado(p)} className="p-2 rounded cursor-pointer hover:bg-[var(--cor-primaria)10]" style={{ border: '1px solid var(--cor-primaria)20' }}><p className="text-sm">{p.nome}</p><p className="text-xs" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(p.preco)}</p></div>)}
                                    </div>
                                </div>
                                <div>
                                    <p className="font-semibold mb-2">Carrinho Fiado</p>
                                    <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                                        {carrinhoFiado.map(i => <div key={i.id} className="flex justify-between text-sm"><p>{i.nome} x{i.qtd}</p><p>{formatCurrency(i.preco * i.qtd)}</p></div>)}
                                    </div>
                                    <p className="font-bold mt-2 text-right">Total: {formatCurrency(totalCarrinhoFiado)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="p-4 sm:p-6 pt-4 border-t shrink-0 flex-row gap-2 justify-between" style={{ borderColor: 'var(--cor-borda)' }}>
                        <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
                        <div className="flex gap-2">
                            {abaDetalhes === 'nova_compra' && <Button onClick={handleLancarFiado} disabled={saving || carrinhoFiado.length === 0} style={{ background: 'var(--cor-primaria)', color: '#fff' }}>Lançar na Conta</Button>}
                            {(clienteSelecionado?.total_divida?? 0) > 0 && <Button onClick={handleReceberPagamento} disabled={saving} style={{ background: '#22c55e', color: '#fff' }}><Banknote size={14} /> Receber Pagamento</Button>}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
