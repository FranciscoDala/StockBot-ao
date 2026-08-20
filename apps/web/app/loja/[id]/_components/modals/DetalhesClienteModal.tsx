"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, FileText, ShoppingCart, Calendar, Plus, Minus, Trash2, Loader2, Inbox, History, Package, Wallet, Search, ArrowLeft, PackageX, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Produto } from "./ProdutoModal";
import { ConfirmarModal } from "./ConfirmacaoModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || "http://127.0.0.1:8000";

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
    onRefreshVendas?: () => Promise<void>;
    formatCurrency: (v: number) => string;
    loading: boolean;
    cardStyle?: string;
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

export function DetalhesClienteModal({ open, onClose, cliente, vendas, produtos, onPagar, onSalvarFiado, onRefreshVendas, formatCurrency, loading, cardStyle = 'arredondado' }: Props) {
    const [abaAtiva, setAbaAtiva] = useState<'dividas' | 'fiado'>('dividas');
    const [carrinho, setCarrinho] = useState<ProdutoCarrinho[]>([]);
    const [buscaProduto, setBuscaProduto] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [showConfirmFiado, setShowConfirmFiado] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const radius = cardStyle === 'arredondado' ? '16px' : '8px';

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            setAbaAtiva('dividas');
            setCarrinho([]);
            setBuscaProduto("");
        } else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; }
    }, [open]);

    const getPreco = (p: Produto | ProdutoCarrinho) => p.preco_venda ?? p.preco ?? 0;

    const adicionarAoCarrinho = useCallback((p: Produto) => {
        const estoqueAtual = p.estoque ?? 0;
        if (estoqueAtual <= 0) return toast.error("Sem estoque");
        setCarrinho(prev => {
            const item = prev.find(i => i.id === p.id);
            if (item) {
                if (item.qtd >= estoqueAtual) return toast.error("Estoque máximo atingido"), prev;
                return prev.map(i => i.id === p.id ? { ...i, qtd: i.qtd + 1 } : i);
            }
            const { unidade, ...resto } = p as any;
            return [...prev, { ...resto, qtd: 1 }];
        })
    }, [produtos]);

    const removerDoCarrinho = (id: string) => setCarrinho(prev => prev.filter(i => i.id !== id));

    const alterarQtd = (id: string, delta: number) => {
        setCarrinho(prev => prev.map(i => {
            if (i.id === id) {
                const produto = produtos.find(p => p.id === id);
                const estoqueProduto = produto?.estoque ?? 0;
                const novaQtd = Math.max(1, i.qtd + delta);
                if (produto && novaQtd > estoqueProduto) return toast.error("Estoque insuficiente"), i;
                return { ...i, qtd: novaQtd };
            }
            return i;
        }));
    }

    const totalItens = useMemo(() => carrinho.reduce((acc, i) => acc + i.qtd, 0), [carrinho]);
    const totalCarrinho = useMemo(() => carrinho.reduce((acc, i) => acc + getPreco(i) * i.qtd, 0), [carrinho]);
    const podeFinalizar = carrinho.length > 0 && !salvando;

    const handleSalvarFiado = async () => {
        if (carrinho.length === 0) return toast.error("Adicione produtos ao carrinho");
        setShowConfirmFiado(true);
    }

    const executarSalvarFiado = async () => {
        setShowConfirmFiado(false);
        setSalvando(true);
        try {
            await onSalvarFiado(carrinho);
            toast.success("Fiado lançado com sucesso!");
            setCarrinho([]);
            setAbaAtiva('dividas');

            setRefreshing(true);
            if (onRefreshVendas) {
                await onRefreshVendas();
            }
            setRefreshing(false);

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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (abaAtiva !== 'fiado') return;
            if (e.key === 'Escape') setAbaAtiva('dividas');
            if (e.key === 'Enter' && podeFinalizar) handleSalvarFiado();
            if (e.key === 'F2') document.getElementById('busca-fiado')?.focus();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [abaAtiva, podeFinalizar]);

    const dividasContent = (
        <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4 relative">
            {refreshing && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10 rounded-xl">
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 px-4 py-2 rounded-lg">
                        <RefreshCw size={16} className="animate-spin" />
                        <span className="text-sm">Atualizando...</span>
                    </div>
                </div>
            )}
            <div className="flex items-center gap-2"><History size={18} /><h3 className="font-bold text-lg">Histórico de Vendas</h3></div>
            {vendas.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center mt-4" style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-card)' }}><Inbox size={40} style={{ color: 'var(--cor-texto-sec)' }} /><p className="font-semibold">Nenhuma venda registrada</p></div>
            ) : (
                <div className="space-y-3">
                    {vendas.map(v => {
                        const estaPaga = v.saldo_devedor <= 0;
                        return (
                            <div key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-xl" style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-card)', borderRadius: radius }}>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-bold flex items-center gap-1"><Calendar size={14} />{new Date(v.data_venda).toLocaleDateString('pt-AO')}</p><Badge style={{ background: estaPaga ? '#22c55e' : '#f59e0b', color: '#fff', fontSize: '10px', padding: '2px 8px' }}>{estaPaga ? 'Pago' : 'Pendente'}</Badge></div>
                                    <p className="text-xs mt-1" style={{ color: 'var(--cor-texto-sec)' }}>ID: #{v.id.slice(0, 8)} | Itens: {v.total_itens}</p>
                                    <div className="flex items-center gap-4 mt-2"><p className="text-sm">Total: <span className="font-semibold">{formatCurrency(v.total)}</span></p><p className="text-sm">Saldo: <span className="font-bold" style={{ color: estaPaga ? '#22c55e' : '#ef4444' }}>{formatCurrency(v.saldo_devedor)}</span></p></div>
                                </div>
                                {!estaPaga && (<Button size="sm" className="w-full sm:w-auto" style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: radius, fontWeight: 600 }} onClick={() => onPagar(v)}>Pagar</Button>)}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );

    const fiadoContent = (
        <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)' }}>
            <div className="flex items-center justify-between p-3 border-b sticky top-0 z-20" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-primaria)30' }}>
                <Button variant="ghost" onClick={() => setAbaAtiva('dividas')} className="gap-2 h-9">
                    <ArrowLeft size={18} /> <span className="hidden sm:inline">Voltar</span>
                </Button>
                <h2 className="font-bold text-base truncate">Fiado para: {cliente?.nome}</h2>
                <div className="text-xs hidden lg:block" style={{ color: 'var(--cor-texto-sec)' }}>F2: Buscar | ESC: Voltar</div>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-3 flex-1">
                <div className="lg:col-span-2 p-3">
                    <div className="relative mb-3 sticky top-[57px] z-10 pb-2" style={{ backgroundColor: 'var(--cor-fundo)' }}>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--cor-texto-sec)' }} />
                        <Input
                            id="busca-fiado"
                            placeholder="Buscar produto... [F2]"
                            className="pl-9 h-10 text-base sm:text-sm"
                            style={{ backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', border: '1px solid var(--cor-primaria)30', borderRadius: radius, fontSize: '16px' }}
                            value={buscaProduto}
                            onChange={(e) => setBuscaProduto(e.target.value)}
                        />
                    </div>

                    {produtosFiltrados.length === 0 && (<div className="flex flex-col items-center justify-center h-64" style={{ color: 'var(--cor-texto-sec)' }}><PackageX size={40} /><p className="mt-2 text-sm">Nenhum produto encontrado</p></div>)}

                    <div className="flex lg:grid gap-3 overflow-x-auto lg:overflow-x-visible lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-4">
                        {produtosFiltrados.map(p => {
                            const preco = getPreco(p);
                            const estoqueAtual = p.estoque ?? 0;
                            return (
                                <button
                                    key={`${p.id}-${estoqueAtual}`}
                                    onClick={() => adicionarAoCarrinho(p)}
                                    disabled={estoqueAtual <= 0}
                                    className="border overflow-hidden text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed group shrink-0 w-28 sm:w-32 lg:w-auto"
                                    style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-primaria)20', borderRadius: radius }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--cor-primaria)'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--cor-primaria)20'}
                                >
                                    <div className="relative w-full aspect-square" style={{ backgroundColor: 'var(--cor-fundo)' }}>
                                        {p.imagem_url ? <img src={p.imagem_url.startsWith('http') ? p.imagem_url : `${API_BASE}${p.imagem_url}`} alt={p.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--cor-primaria)', opacity: 0.3 }}>Sem Img</div>}
                                        {estoqueAtual <= 0 && (<Badge variant="destructive" className="absolute top-1 right-1 text-[9px] px-1" style={{ backgroundColor: '#ef4444' }}>0</Badge>)}
                                        {estoqueAtual > 0 && (<Badge className="absolute top-1 right-1 text-white border-none text-[9px] px-1.5" style={{ backgroundColor: 'var(--cor-primaria)' }}>{estoqueAtual}</Badge>)}
                                    </div>
                                    <div className="p-2">
                                        <h4 className="font-semibold text-xs truncate" style={{ color: 'var(--cor-texto)' }}>{p.nome}</h4>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="font-bold text-xs" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(preco)}</span>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {/* MOBILE CARRINHO IGUAL VENDA TAB */}
                    <div className="lg:hidden mt-4">
                        <h3 className="font-bold text-sm flex items-center gap-2 mb-2" style={{ color: 'var(--cor-texto)' }}><ShoppingCart size={16} /> Produtos {totalItens > 0 && `(${totalItens})`}</h3>
                        <div className="max-h-[180px] sm:max-h-none overflow-y-auto space-y-1 pb-[calc(120px+env(safe-area-inset-bottom))] rounded-lg py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ backgroundColor: 'var(--cor-card)', borderRadius: radius }}>
                            {carrinho.length === 0 && <p className="text-center text-xs py-6 opacity-70">Adicione produtos ao carrinho</p>}
                            {carrinho.map(i => {
                                const preco = getPreco(i);
                                return (
                                    <div key={i.id} className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-red-950/30 transition-colors" style={{ background: 'var(--cor-fundo)', borderRadius: radius }}>
                                        <span className="text-xs font-bold w-8 text-center">{i.qtd}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--cor-texto)' }}>{i.nome}</p>
                                            <p className="text-xs font-bold" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(preco)}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); alterarQtd(i.id, -1) }}><Minus size={12} /></Button>
                                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); removerDoCarrinho(i.id) }}><Trash2 size={12} /></Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>


                </div>

                {/* DESKTOP CARRINHO IGUAL VENDA TAB */}
                <div className="border-t lg:border-t-0 lg:border-l hidden lg:flex lg:flex-col h-[calc(100vh-57px)] sticky top-0" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-primaria)30' }}>
                    <h3 className="font-bold text-base flex items-center gap-2 p-3 border-b shrink-0" style={{ color: 'var(--cor-texto)', borderColor: 'var(--cor-primaria)30' }}>
                        <ShoppingCart size={18} /> Carrinho {totalItens > 0 && `(${totalItens})`}
                    </h3>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {carrinho.length === 0 && <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--cor-texto-sec)' }}><ShoppingCart size={32} /><p className="mt-2 text-xs">Vazio</p></div>}
                        {carrinho.map(i => {
                            const preco = getPreco(i);
                            return (
                                <div key={i.id} onClick={() => removerDoCarrinho(i.id)} className="p-2.5 rounded-lg cursor-pointer hover:bg-red-950/30 transition-colors" style={{ backgroundColor: 'var(--cor-fundo)', borderRadius: radius }}>
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-xs truncate" style={{ color: 'var(--cor-texto)' }}>{i.nome}</p>
                                            <p className="text-xs font-bold" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(preco)} x {i.qtd}</p>
                                        </div>
                                        <span className="text-sm font-bold">{i.qtd}</span>
                                    </div>
                                    <div className="flex justify-end mt-1"><p className="font-bold text-sm" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(preco * i.qtd)}</p></div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="border-t p-3 space-y-2 mt-auto" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-primaria)30' }}>
                        <div className="flex justify-between text-lg"><span className="font-bold">Total</span><span className="font-bold" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(totalCarrinho)}</span></div>
                        <Button onClick={handleSalvarFiado} disabled={!podeFinalizar} className="w-full h-11 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}>
                            {salvando ? <Loader2 size={18} className="animate-spin" /> : "Confirmar e Salvar Dívida [Enter]"}
                        </Button>
                    </div>
                </div>

            </div>

            {/* MOBILE RODAPE IGUAL VENDA TAB */}
            <div className="lg:hidden py-3 space-y-2 border-t sticky bottom-0 z-10" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-primaria)30', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
                <div className="flex justify-between items-center px-3">
                    <span className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Total da Dívida</span>
                    <span className="font-bold text-lg" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(totalCarrinho)}</span>
                </div>
                <div className="px-3">
                    <Button onClick={handleSalvarFiado} disabled={!podeFinalizar} className="w-full h-12 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}>
                        {salvando ? <Loader2 size={18} className="animate-spin" /> : "Confirmar e Salvar Dívida"}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !p-0 !flex !flex-col !border-0 !rounded-none !shadow-none !translate-x-0 !translate-y-0 [&>button]:hidden" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)' }}>

                    {abaAtiva === 'dividas' && (
                        <DialogHeader className="p-4 sm:p-5 border-b shrink-0 flex-row items-center justify-between gap-4 text-left" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)', backgroundColor: 'var(--cor-card)' }}>
                            <div className="min-w-0 flex-1 text-left">
                                <DialogTitle className="text-xl sm:text-2xl font-bold text-left">{cliente?.nome}</DialogTitle>
                                <div className="flex items-center gap-4 mt-1 flex-wrap justify-start">
                                    <DialogDescription className="text-sm" style={{ color: 'var(--cor-texto-sec)' }}>{cliente?.telefone}</DialogDescription>
                                    <div className="flex items-center gap-1 text-sm"><Wallet size={14} style={{ color: '#ef4444' }} /><span>Dívida: </span><span className="font-bold" style={{ color: '#ef4444' }}>{formatCurrency(cliente?.total_divida ?? 0)}</span></div>
                                    <div className="flex items-center gap-1 text-sm"><Calendar size={14} style={{ color: 'var(--cor-texto-sec)' }} /><span>Última: {cliente?.ultima_compra ? new Date(cliente.ultima_compra).toLocaleDateString('pt-AO') : 'Nunca'}</span></div>
                                </div>
                            </div>
                            <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-lg transition shrink-0" style={{ background: '#fee2e2', color: '#ef4444' }}><X size={22} strokeWidth={2.5} /></button>
                        </DialogHeader>
                    )}

                    {abaAtiva === 'dividas' && (
                        <div className="flex gap-1 px-2 sm:px-6 border-b shrink-0" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)', backgroundColor: 'var(--cor-card)' }}>
                            <TabButton label="Dívidas" icon={<FileText size={16} />} active={true} onClick={() => { }} count={dividasPendentes.length} />
                            <TabButton label="Lançar Fiado" icon={<ShoppingCart size={16} />} active={false} onClick={() => setAbaAtiva('fiado')} count={totalItens} />
                        </div>
                    )}

                    <div className="flex-1 min-h-0">
                        {loading ? (<div className="flex flex-col items-center justify-center h-full gap-3"><Loader2 className="animate-spin" size={32} style={{ color: 'var(--cor-primaria)' }} /><p className="text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Carregando...</p></div>) : (
                            <>
                                {abaAtiva === 'dividas' && dividasContent}
                                {abaAtiva === 'fiado' && fiadoContent}
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmarModal open={showConfirmFiado} onClose={() => setShowConfirmFiado(false)} onConfirm={executarSalvarFiado} titulo="Confirmar Lançamento Fiado" descricao={`Tem certeza que deseja lançar uma dívida de ${formatCurrency(totalCarrinho)} para ${cliente?.nome}?`} loading={salvando} tipo="venda" textoConfirmar="Sim, Lançar Dívida" />
        </>
    )
}
