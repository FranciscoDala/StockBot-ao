"use client";
import { useState, useEffect, useMemo } from "react";
import { Users, UserCheck, AlertCircle, DollarSign, ChevronLeft, ChevronRight, Eye, Plus, ShoppingCart, Receipt, Banknote, Search, Filter, Wallet, X, Calendar, Package } from "lucide-react";
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
    ultima_compra: string;
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

type FiltroCliente = 'todos' | 'com_divida' | 'em_dia' | 'pagos'; // <- 1. ADICIONADO 'pagos'
type ProdutoCarrinho = Omit<Produto, 'unidade'> & { qtd: number };

export function ClientesTab({ lojaId, token, theme, cardStyle, cardSize, formatCurrency }: Props) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<FiltroCliente>('com_divida'); // <- 2. MUDOU: padrão agora é com_divida
    const [busca, setBusca] = useState("");
    const [pagina, setPagina] = useState(1);
    const ITENS_POR_PAGINA = 8;

    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
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

    const fetchClientes = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/lojas/${lojaId}/clientes`, { headers: { "Authorization": `Bearer ${token}` } });
            if (!res.ok) throw new Error(`Erro ${res.status}`)
            const data = await res.json();
            setClientes((Array.isArray(data)? data : []).map((c: any) => ({...c, total_divida: c.total_divida?? 0 })));
        } catch (e) {
            toast.error("Erro ao carregar clientes")
            setClientes([])
        } finally { setLoading(false) }
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
        if (!token ||!clienteSelecionado ||!vendaSelecionada ||!valorPagamento || parseFloat(valorPagamento) <= 0) {
            return toast.error("Valor inválido");
        }
        setSaving(true);
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

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || "Erro ao pagar");
            }

            toast.success("Pagamento registrado!");
            setShowPagarModal(false);
            setVendaSelecionada(null);
            await fetchClientes();
            await fetchDetalhesCliente(clienteSelecionado);
        } catch (err: any) {
            toast.error(err?.detail || err?.message || "Erro ao pagar")
        } finally { setSaving(false) }
    }

    const handleSaveCliente = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token ||!lojaId) return toast.error("Erro: Loja não encontrada");
        setSaving(true);
        try {
            const payload: Record<string, any> = {...formDataCliente, loja_id: lojaId };
            for (const key in payload) { if (payload[key] === "") payload[key] = null; }
            const res = await fetch(`${API_URL}/lojas/${lojaId}/clientes`, {
                method: 'POST', headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error((await res.json()).detail || "Erro ao salvar");
            toast.success("Cliente cadastrado com sucesso!");
            setShowModal(false);
            setFiltro('com_divida'); // <- 3. MUDOU: volta pro filtro padrão
            setFormDataCliente({ nome: "", nome_empresa: null, bi: null, telefone: null, email: null, endereco: null, cidade: null, provincia: null, observacoes: null, is_active: true });
            fetchClientes();
        } catch (err: any) {
            toast.error(err.message || "Erro ao cadastrar cliente");
        } finally { setSaving(false); }
    }

    const adicionarAoCarrinhoFiado = (p: Produto) => {
        setCarrinhoFiado(prev => {
            const item = prev.find(i => i.id === p.id);
            if (item) return prev.map(i => i.id === p.id? {...i, qtd: i.qtd + 1 } : i);
            const { unidade,...restoDoProduto } = p;
            return [...prev, {...restoDoProduto, qtd: 1 }];
        })
    }

    const removerDoCarrinho = (id: string) => setCarrinhoFiado(prev => prev.filter(i => i.id!== id));
    const totalCarrinhoFiado = carrinhoFiado.reduce((acc, i) => acc + i.preco * i.qtd, 0);
    useEffect(() => { fetchClientes() }, [lojaId, token]);

    const totalComDivida = clientes.filter(c => (c.total_divida?? 0) > 0).length;
    const totalEmDia = clientes.filter(c => (c.total_divida?? 0) === 0).length;
    const valorTotalEmDivida = clientes.reduce((acc, c) => acc + (c.total_divida?? 0), 0);

    const clientesFiltrados = useMemo(() => {
        let lista = [...clientes];
        if (filtro === 'com_divida') lista = lista.filter(c => (c.total_divida?? 0) > 0);
        if (filtro === 'em_dia') lista = lista.filter(c => (c.total_divida?? 0) === 0);
        if (filtro === 'pagos') lista = lista.filter(c => (c.total_divida?? 0) === 0); // <- 4. NOVO FILTRO
        if (filtro === 'todos') lista = lista.filter(c => (c.total_divida?? 0) > 0); // <- 5. MUDOU: 'todos' agora = só quem deve ou deveu
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
                <Button onClick={() => setShowModal(true)} style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}><Plus size={16} /> Novo Cliente</Button>
            </div>

            {/* 6. REMOVIDO: Card "Total Clientes" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div style={{ background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', border: '1px solid #ef444430', borderRadius: radius, padding }}><p className="text-xs">Com Dívida</p><p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{totalComDivida}</p><p className="text-xs">{formatCurrency(valorTotalEmDivida)}</p></div>
                <div style={{ background: 'color-mix(in srgb, var(--cor-card) 80%, transparent)', border: '1px solid var(--cor-primaria)40', borderRadius: radius, padding }}><p className="text-xs">Em Dia</p><p className="text-2xl font-bold" style={{ color: 'var(--cor-primaria)' }}>{totalEmDia}</p></div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-primaria)30', borderRadius: radius, padding }}>
                <div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" /><Input placeholder="Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 h-9" /></div>
                <Select value={filtro} onValueChange={(v) => setFiltro(v as FiltroCliente)}>
                    <SelectTrigger className="w-full sm:w-[240px] h-9"><Filter size={14} className="mr-2" /> <SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos clientes ({clientes.length})</SelectItem> {/* <- 7. MUDOU O TEXTO */}
                        <SelectItem value="com_divida">Com Dívida ({totalComDivida})</SelectItem>
                        <SelectItem value="em_dia">Em Dia ({totalEmDia})</SelectItem>
                        <SelectItem value="pagos">Clientes com dívidas pagas</SelectItem> {/* <- 8. NOVO ITEM */}
                    </SelectContent>
                </Select>
            </div>

            <div style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-primaria)30', borderRadius: radius, padding }}>
                <div className="space-y-3">
                    {clientesPaginados.length === 0 && <div className="text-center py-16"><DollarSign size={32} className="mx-auto mb-3 opacity-50" /><p>{filtro === 'com_divida'? "Nenhum cliente com dívida" : filtro === 'em_dia'? "Nenhum cliente em dia" : "Nenhum cliente encontrado"}</p></div>}
                    {clientesPaginados.map(c => {
                        const temDivida = (c.total_divida?? 0) > 0;
                        return (
                            <div key={c.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition hover:bg-[var(--cor-primaria)5]"
                                style={{
                                    border: `2px solid var(--cor-primaria)`, // <- 9. BORDA PRIMARY OBRIGATÓRIA
                                    borderRadius: radius,
                                    padding,
                                    background: temDivida? 'color-mix(in srgb, #ef4444 5%, transparent)' : 'color-mix(in srgb, #22c55e 5%, transparent)' // <- 10. FUNDO ALERT
                                }}>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold truncate">{c.nome}</p>
                                        <Badge
                                            style={{
                                                background: temDivida? '#ef4444' : '#22c55e', // <- 11. BADGE COM COR
                                                color: '#fff'
                                            }}
                                        >
                                            {temDivida? "Devendo" : "Pago"} {/* <- 12. MUDOU O TEXTO */}
                                        </Badge>
                                    </div>
                                    <p className="text-xs mt-1">{c.telefone || c.email || "Sem contato"}</p>
                                    <p className="text-xs mt-1 flex items-center gap-1"><Calendar size={12} /> Última compra: {new Date(c.ultima_compra).toLocaleDateString('pt-AO')}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {temDivida && <div className="text-right"><p className="text-xs opacity-70">Dívida</p><p className="text-lg font-bold" style={{ color: '#ef4444' }}>{formatCurrency(c.total_divida?? 0)}</p></div>}
                                    <Button size="sm" variant="outline" onClick={() => fetchDetalhesCliente(c)}><Eye size={14} /> Detalhes</Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
                {totalPaginas > 1 && <div className="flex items-center justify-between mt-4"><p className="text-xs">Página {pagina} de {totalPaginas}</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}><ChevronLeft size={14} /></Button><Button size="sm" variant="outline" disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)}><ChevronRight size={14} /></Button></div></div>}
            </div>

            <ClienteModal open={showModal} onOpenChange={setShowModal} editingCliente={null} formData={formDataCliente} setFormData={setFormDataCliente} onSave={handleSaveCliente} saving={saving} handleChange={(field, value) => setFormDataCliente(prev => ({...prev, [field]: value }))} />

            <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
                <DialogContent className="max-w-[900px] flex-col h-[90vh]" style={{ backgroundColor: 'var(--cor-card)' }}>
                    <DialogHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <DialogTitle className="text-xl">Conta de: {clienteSelecionado?.nome}</DialogTitle>
                                <DialogDescription>
                                    {clienteSelecionado?.telefone} {clienteSelecionado?.email && `• ${clienteSelecionado.email}`}
                                </DialogDescription>
                            </div>
                            {(clienteSelecionado?.total_divida?? 0) > 0 && (
                                <div className="text-right">
                                    <p className="text-xs opacity-70">Dívida Total</p>
                                    <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{formatCurrency(clienteSelecionado?.total_divida?? 0)}</p>
                                </div>
                            )}
                        </div>
                        <div className="h-px bg-[var(--cor-primaria)30] my-2" />
                        <div className="flex gap-2">
                            <Button size="sm" variant={abaDetalhes === 'extrato'? 'default' : 'outline'} onClick={() => setAbaDetalhes('extrato')}><Receipt size={14} /> Extrato de Dívidas</Button>
                            <Button size="sm" variant={abaDetalhes === 'nova_compra'? 'default' : 'outline'} onClick={() => setAbaDetalhes('nova_compra')}><ShoppingCart size={14} /> Nova Compra Fiado</Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-1">
                        {abaDetalhes === 'extrato' && (
                            <div className="space-y-3">
                                {vendasPendentes.length === 0?
                                    <div className="text-center py-16 opacity-70"><UserCheck size={32} className="mx-auto mb-2" /><p>Cliente em dia. Nenhuma dívida em aberto.</p></div> :
                                    vendasPendentes.map(v => (
                                        <div key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition hover:bg-[var(--cor-primaria)5]" style={{ border: '1px solid var(--cor-primaria)30', borderRadius: radius }}>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-semibold">Venda #{v.id.slice(0, 8)}</p>
                                                    <Badge variant={v.status === 'parcial'? 'secondary' : 'destructive'}>{v.status.toUpperCase()}</Badge>
                                                </div>
                                                <p className="text-xs flex items-center gap-1"><Calendar size={12} /> {new Date(v.data_venda).toLocaleDateString('pt-AO')}</p>
                                                <p className="text-xs flex items-center gap-1"><Package size={12} /> {v.total_itens} itens</p>
                                                <div className="flex gap-4 mt-2 text-xs">
                                                    <span>Total: <b>{formatCurrency(v.total)}</b></span>
                                                    <span>Pago: <b>{formatCurrency(v.valor_recebido)}</b></span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs opacity-70">Saldo Devedor</p>
                                                <p className="font-bold text-xl mb-2" style={{ color: '#ef4444' }}>{formatCurrency(v.saldo_devedor)}</p>
                                                <Button size="sm" onClick={() => handleAbrirPagar(v)} style={{ background: '#22c55e', color: '#fff' }}>
                                                    <Wallet size={14} /> Pagar esta Dívida
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        )}

                        {abaDetalhes === 'nova_compra' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                                <div>
                                    <p className="font-semibold mb-2">Produtos da Loja</p>
                                    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                                        {produtosLoja.map(p =>
                                            <div key={p.id} onClick={() => adicionarAoCarrinhoFiado(p)} className="p-3 rounded cursor-pointer border hover:border-[var(--cor-primaria)] hover:bg-[var(--cor-primaria)5] transition">
                                                <p className="text-sm font-medium">{p.nome}</p>
                                                <p className="text-xs">{formatCurrency(p.preco)} • Estoque: {p.estoque}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="font-semibold mb-2">Carrinho Fiado</p>
                                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 mb-3">
                                        {carrinhoFiado.length === 0? <p className="text-xs opacity-70">Clique em um produto para adicionar</p> :
                                            carrinhoFiado.map(i =>
                                                <div key={i.id} className="flex justify-between items-center text-sm p-2 rounded bg-[var(--cor-primaria)10]">
                                                    <div>
                                                        <p>{i.nome}</p>
                                                        <p className="text-xs">{i.qtd} x {formatCurrency(i.preco)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold">{formatCurrency(i.preco * i.qtd)}</p>
                                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removerDoCarrinho(i.id)}><X size={14} /></Button>
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                    <div className="h-px bg-[var(--cor-primaria)30] my-2" />
                                    <p className="font-bold text-right text-lg mt-2">Total: {formatCurrency(totalCarrinhoFiado)}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
                        {abaDetalhes === 'nova_compra' && <Button onClick={handleLancarFiado} disabled={saving || carrinhoFiado.length === 0}>Lançar {formatCurrency(totalCarrinhoFiado)} na Conta</Button>}
                    </DialogFooter>
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
                            <p className="font-bold text-2xl" style={{ color: '#ef4444' }}>{formatCurrency(vendaSelecionada?.saldo_devedor?? 0)}</p>
                        </div>
                        <div><Label>Valor a Receber</Label><Input type="number" value={valorPagamento} onChange={e => setValorPagamento(e.target.value)} placeholder="Ex: 5000" /></div>
                        <div><Label>Forma de Pagamento</Label>
                            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
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
                        <Button variant="outline" onClick={() => setShowPagarModal(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmarPagamento} disabled={saving}>Confirmar Pagamento</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
