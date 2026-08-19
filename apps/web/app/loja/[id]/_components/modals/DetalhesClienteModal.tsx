"use client";
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, FileText, ShoppingCart, Calendar, Plus, Minus, Trash2, Loader2, Inbox, History, Package, Wallet, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Produto } from "./ProdutoModal";
import { ConfirmarModal } from "./ConfirmacaoModal"; // <- IMPORT ADICIONADO

export type Cliente = {
    id: string; loja_id: string; nome: string; nome_empresa: string | null; bi: string | null;
    telefone: string | null; email: string | null; endereco: string | null; cidade: string | null;
    provincia: string | null; observacoes: string | null; is_active: boolean; created_at: string;
    total_divida: number; ultima_compra: string | null; status: 'com_divida' | 'em_dia';
}

export type VendaPendente = {
    id: string; data_venda: string; total: number; valor_recebido: number;
    saldo_devedor: number; status: string; total_itens: number;
}

type ProdutoCarrinho = Omit<Produto, 'unidade'> & { qtd: number };

interface Props {
    open: boolean;
    onClose: () => void;
    cliente: Cliente | null;
    vendas: VendaPendente[];
    produtos: Produto[];
    onPagar: (v: VendaPendente) => void;
    onSalvarFiado: (carrinho: ProdutoCarrinho[]) => Promise<void>;
    formatCurrency: (v: number) => string;
    loading: boolean;
}

function TabButton({ label, icon, active, onClick, count }: { label: string, icon: any, active: boolean, onClick: () => void, count?: number }) {
    return (
        <button onClick={onClick} className="relative flex-1 flex items-center justify-center gap-2 px-4 py-4 font-semibold text-sm transition">
            <div className="flex items-center gap-2">
                {icon} {label}
                {count !== undefined && count > 0 && (
                    <Badge className="rounded-full h-5 min-w-5 flex items-center justify-center text-[10px]" style={{ background: active ? 'var(--cor-primaria)' : 'var(--cor-texto-sec)', color: '#fff' }}>{count}</Badge>
                )}
            </div>
            {active && <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'var(--cor-primaria)' }} />}
        </button>
    )
}

export function DetalhesClienteModal({ open, onClose, cliente, vendas, produtos, onPagar, onSalvarFiado, formatCurrency, loading }: Props) {
    const [abaAtiva, setAbaAtiva] = useState<'dividas' | 'fiado'>('dividas'); // <- CORRIGIDO: agora começa em 'dividas'
    const [carrinho, setCarrinho] = useState<ProdutoCarrinho[]>([]);
    const [buscaProduto, setBuscaProduto] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [showConfirmFiado, setShowConfirmFiado] = useState(false); // <- NOVO: estado da modal de confirmação

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            setAbaAtiva('dividas'); // <- CORRIGIDO: abre em dividas
            setCarrinho([]);
            setBuscaProduto("");
        } else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; }
    }, [open]);

    const getPreco = (p: Produto | ProdutoCarrinho) => p.preco_venda ?? p.preco ?? 0;

    const adicionarAoCarrinho = (p: Produto) => {
        if ((p.estoque ?? 0) <= 0) return toast.error("Sem estoque");
        setCarrinho(prev => {
            const item = prev.find(i => i.id === p.id);
            if (item) {
                if (item.qtd >= (p.estoque ?? 0)) return toast.error("Estoque máximo atingido"), prev;
                return prev.map(i => i.id === p.id ? { ...i, qtd: i.qtd + 1 } : i);
            }
            const { unidade, ...resto } = p as any;
            return [...prev, { ...resto, qtd: 1 }];
        })
    }
    const removerDoCarrinho = (id: string) => setCarrinho(prev => prev.filter(i => i.id !== id));

    const alterarQtd = (id: string, delta: number) => {
        setCarrinho(prev => prev.map(i => {
            if (i.id === id) {
                const produto = produtos.find(p => p.id === id);
                const novaQtd = Math.max(1, i.qtd + delta);
                if (produto && novaQtd > (produto.estoque ?? 0)) return toast.error("Estoque insuficiente"), i;
                return { ...i, qtd: novaQtd };
            }
            return i;
        }));
    }

    const totalCarrinho = useMemo(() => carrinho.reduce((acc, i) => acc + getPreco(i) * i.qtd, 0), [carrinho]);

    const handleSalvarFiado = async () => {
        if (carrinho.length === 0) return toast.error("Adicione produtos ao carrinho");
        setShowConfirmFiado(true); // <- NOVO: abre modal de confirmação em vez de salvar direto
    }

    const executarSalvarFiado = async () => { // <- NOVO: só executa depois de confirmar
        setShowConfirmFiado(false);
        setSalvando(true);
        try {
            await onSalvarFiado(carrinho);
            setCarrinho([]);
            onClose();
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSalvando(false);
        }
    }

    const produtosFiltrados = useMemo(() =>
        produtos.filter(p =>
            p.is_active && (
                p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
                p.sku?.toLowerCase().includes(buscaProduto.toLowerCase())
            )
        ),
        [produtos, buscaProduto]
    );

    const dividasPendentes = vendas.filter(v => v.saldo_devedor > 0);

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !flex !flex-col !border-0 !rounded-none !shadow-none !translate-x-0 !translate-y-0 [&>button]:hidden" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)' }}>
                    <DialogHeader className="p-4 sm:p-5 border-b shrink-0 flex-row items-center justify-between gap-4 text-left" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)', backgroundColor: 'var(--cor-card)' }}>
                        <div className="min-w-0 flex-1 text-left">
                            <DialogTitle className="text-xl sm:text-2xl font-bold text-left" style={{ color: 'var(--cor-texto)' }}>{cliente?.nome}</DialogTitle>
                            <div className="flex items-center gap-4 mt-1 flex-wrap justify-start">
                                <DialogDescription className="text-sm" style={{ color: 'var(--cor-texto-sec)' }}>{cliente?.telefone}</DialogDescription>
                                <div className="flex items-center gap-1 text-sm"><Wallet size={14} style={{ color: '#ef4444' }} /><span>Dívida: </span><span className="font-bold" style={{ color: '#ef4444' }}>{formatCurrency(cliente?.total_divida ?? 0)}</span></div>
                                <div className="flex items-center gap-1 text-sm"><Calendar size={14} style={{ color: 'var(--cor-texto-sec)' }} /><span>Última: {cliente?.ultima_compra ? new Date(cliente.ultima_compra).toLocaleDateString('pt-AO') : 'Nunca'}</span></div>
                            </div>
                        </div>
                        <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-lg transition shrink-0" style={{ background: '#fee2e2', color: '#ef4444' }}><X size={22} strokeWidth={2.5} /></button>
                    </DialogHeader>

                    
                    <div className="flex gap-1 px-2 sm:px-6 border-b shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)', backgroundColor: 'var(--cor-card)' }}>
                        <TabButton label="Dívidas" icon={<FileText size={16} />} active={abaAtiva === 'dividas'} onClick={() => setAbaAtiva('dividas')} count={dividasPendentes.length} />
                        <TabButton label="Lançar Fiado" icon={<ShoppingCart size={16} />} active={abaAtiva === 'fiado'} onClick={() => setAbaAtiva('fiado')} count={carrinho.length} />
                    </div>

                    <div className="flex-1 min-h-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3"><Loader2 className="animate-spin" size={32} style={{ color: 'var(--cor-primaria)' }} /><p className="text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Carregando...</p></div>
                        ) : (
                            <>
                                {abaAtiva === 'dividas' && (
                                    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4">
                                        <div className="flex items-center gap-2"><History size={18} /><h3 className="font-bold text-lg">Histórico de Vendas</h3></div>
                                        {vendas.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center mt-4" style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-card)' }}><Inbox size={40} style={{ color: 'var(--cor-texto-sec)' }} /><p className="font-semibold">Nenhuma venda registrada</p></div>
                                        ) : (
                                            <div className="space-y-3">
                                                {vendas.map(v => {
                                                    const estaPaga = v.saldo_devedor <= 0;
                                                    return (
                                                        <div key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-xl" style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-card)' }}>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-bold flex items-center gap-1"><Calendar size={14} />{new Date(v.data_venda).toLocaleDateString('pt-AO')}</p><Badge style={{ background: estaPaga ? '#22c55e' : '#f59e0b', color: '#fff', fontSize: '10px', padding: '2px 8px' }}>{estaPaga ? 'Pago' : 'Pendente'}</Badge></div>
                                                                <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-sec)' }}>ID: #{v.id.slice(0, 8)} | Itens: {v.total_itens}</p>
                                                                <div className="flex items-center gap-4 mt-2"><p className="text-sm">Total: <span className="font-semibold">{formatCurrency(v.total)}</span></p><p className="text-sm">Saldo: <span className="font-bold" style={{ color: estaPaga ? '#22c55e' : '#ef4444' }}>{formatCurrency(v.saldo_devedor)}</span></p></div>
                                                            </div>
                                                            {!estaPaga && (<Button size="sm" className="w-full sm:w-auto" style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: '8px', fontWeight: 600 }} onClick={() => onPagar(v)}>Pagar</Button>)}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {abaAtiva === 'fiado' && (
                                    <div className="h-full grid-cols-1 lg:grid-cols-5 gap-0">
                                        <div className="lg:col-span-3 p-4 sm:p-6 border-r flex flex-col" style={{ borderColor: 'var(--cor-borda)' }}>
                                            <div className="flex items-center gap-2 mb-4 shrink-0"><Package size={18} /><h3 className="font-bold text-lg">Selecionar Produtos</h3></div>
                                            <div className="relative mb-4 shrink-0">
                                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--cor-texto-sec)' }} />
                                                <Input placeholder="Buscar produto por nome ou SKU..." value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} className="pl-9 h-10" />
                                            </div>
                                            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                                                {produtos.length === 0 && <p className="text-sm text-center opacity-70 py-10">Carregando produtos...</p>}
                                                {produtosFiltrados.length === 0 && produtos.length > 0 && <p className="text-sm text-center opacity-70 py-10">Nenhum produto encontrado</p>}
                                                {produtosFiltrados.map(p => {
                                                    const preco = getPreco(p);
                                                    return (
                                                        <div key={`${p.id}-${p.estoque}`} className="flex items-center justify-between p-3 border rounded-lg transition hover:border-[var(--cor-primaria)]" style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-card)', opacity: (p.estoque ?? 0) <= 0 ? 0.5 : 1 }}>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-semibold truncate">{p.nome}</p>
                                                                <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>{formatCurrency(preco)} | Estoque: {p.estoque ?? 0}</p>
                                                            </div>
                                                            <Button size="sm" disabled={(p.estoque ?? 0) <= 0} style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: '8px', minWidth: '36px' }} onClick={() => adicionarAoCarrinho(p)}>
                                                                <Plus size={16} />
                                                            </Button>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <div className="lg:col-span-2 p-4 sm:p-6 flex-col" style={{ backgroundColor: 'var(--cor-card)' }}>
                                            <p className="font-bold text-lg mb-4 shrink-0">Carrinho Fiado</p>
                                            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                                                {carrinho.length === 0 && <p className="text-sm opacity-70 text-center py-10">Adicione produtos ao carrinho</p>}
                                                {carrinho.map(i => {
                                                    const preco = getPreco(i);
                                                    return (
                                                        <div key={i.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'color-mix(in srgb, var(--cor-primaria) 5%, transparent)' }}>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-semibold truncate">{i.nome}</p>
                                                                <p className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>{formatCurrency(preco)} x {i.qtd} = {formatCurrency(preco * i.qtd)}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => alterarQtd(i.id, -1)}><Minus size={14} /></Button>
                                                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => removerDoCarrinho(i.id)}><Trash2 size={14} /></Button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            <div className="border-t pt-4 mt-4 shrink-0" style={{ borderColor: 'var(--cor-borda)' }}>
                                                <div className="flex justify-between items-center mb-4"><p className="font-semibold">Total da Dívida:</p><p className="font-bold text-2xl" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(totalCarrinho)}</p></div>
                                                <Button className="w-full h-11" disabled={carrinho.length === 0 || salvando} style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: '8px', fontWeight: 600 }} onClick={handleSalvarFiado}>
                                                    {salvando ? <Loader2 size={18} className="animate-spin" /> : "Confirmar e Salvar Dívida"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* MODAL DE CONFIRMAÇÃO ANTES DE LANÇAR FIADO */}
            <ConfirmarModal
                open={showConfirmFiado}
                onClose={() => setShowConfirmFiado(false)}
                onConfirm={executarSalvarFiado}
                titulo="Confirmar Lançamento Fiado"
                descricao={`Tem certeza que deseja lançar uma dívida de ${formatCurrency(totalCarrinho)} para ${cliente?.nome}? Esta ação não pode ser desfeita.`}
                loading={salvando}
                tipo="venda"
                textoConfirmar="Sim, Lançar Dívida"
            />
        </>
    )
}
