"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, FileText, ShoppingCart, Calendar, Plus, Minus, Trash2, Loader2, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Produto } from "./ProdutoModal";

// BATE 100% COM ClienteOut DO BACKEND
export type Cliente = {
  id: string;
  loja_id: string;
  nome: string;
  nome_empresa: string | null;
  bi: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  cidade: string | null;
  provincia: string | null;
  observacoes: string | null;
  is_active: boolean;
  created_at: string;
  total_divida: number;
  ultima_compra: string | null;
  status: 'com_divida' | 'em_dia';
}

export type VendaPendente = {
  id: string;
  data_venda: string;
  total: number;
  valor_recebido: number;
  saldo_devedor: number;
  status: string;
  total_itens: number;
}

type ProdutoCarrinho = Omit<Produto, 'unidade'> & { qtd: number };

interface Props {
    open: boolean;
    onClose: () => void;
    cliente: Cliente | null;
    vendas: VendaPendente[];
    produtos: Produto[];
    onPagar: (v: VendaPendente) => void;
    onAdicionarFiado: (carrinho: ProdutoCarrinho[]) => void;
    formatCurrency: (v: number) => string;
    loading: boolean;
}

function TabButton({ label, icon, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="relative flex flex-1 items-center justify-center gap-2 px-3 sm:px-4 py-3 font-semibold text-sm transition rounded-t-lg sm:flex-initial"
            style={{
                color: active? 'var(--cor-primaria)' : 'var(--cor-texto-sec)',
                backgroundColor: active? 'color-mix(in srgb, var(--cor-primaria) 8%, transparent)' : 'transparent'
            }}
        >
            {icon} {label}
            {active && <div className="absolute -bottom-px left-0 right-0 h-0.5" style={{ background: 'var(--cor-primaria)' }} />}
        </button>
    )
}

export function DetalhesClienteModal({ open, onClose, cliente, vendas, produtos, onPagar, onAdicionarFiado, formatCurrency, loading }: Props) {
    const [abaAtiva, setAbaAtiva] = useState<'dividas' | 'produtos'>('dividas');
    const [carrinho, setCarrinho] = useState<ProdutoCarrinho[]>([]);
    const [buscaProduto, setBuscaProduto] = useState("");

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            setAbaAtiva('dividas');
            setCarrinho([]);
        }
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; }
    }, [open]);

    const adicionarAoCarrinho = (p: Produto) => {
        setCarrinho(prev => {
            const item = prev.find(i => i.id === p.id);
            if (item) return prev.map(i => i.id === p.id? {...i, qtd: i.qtd + 1 } : i);
            const { unidade,...resto } = p as any;
            return [...prev, {...resto, qtd: 1 }];
        })
    }
    const removerDoCarrinho = (id: string) => setCarrinho(prev => prev.filter(i => i.id!== id));
    const alterarQtd = (id: string, delta: number) => {
        setCarrinho(prev => prev.map(i => i.id === id? {...i, qtd: Math.max(1, i.qtd + delta)} : i));
    }
    const totalCarrinho = carrinho.reduce((acc, i) => acc + i.preco * i.qtd, 0);

    const handleSalvarFiado = () => {
        if(carrinho.length === 0) return;
        onAdicionarFiado(carrinho);
        setCarrinho([]);
        onClose();
    }

    const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(buscaProduto.toLowerCase()));

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="!fixed!inset-0!w-screen!h-screen!max-w-none!max-h-none!p-0!flex!flex-col!border-0!rounded-none!shadow-none!translate-x-0!translate-y-0 [&>button]:hidden"
                style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)' }}
            >
                <DialogHeader className="p-4 sm:p-6 border-b shrink-0 flex-row items-center justify-between" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)', backgroundColor: 'var(--cor-card)' }}>
                    <div>
                        <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                            {cliente?.nome}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>
                            {cliente?.telefone || cliente?.email || "Sem contato"} |
                            Dívida total: <span style={{ color: '#ef4444', fontWeight: 600 }}>{formatCurrency(cliente?.total_divida?? 0)}</span>
                        </DialogDescription>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-lg transition hover:opacity-90 shrink-0" style={{ background: 'var(--cor-erro)', color: '#fff' }}>
                        <X size={22} strokeWidth={3} />
                    </button>
                </DialogHeader>

                <div className="flex gap-1 px-4 sm:px-6 border-b shrink-0 overflow-x-auto" style={{ borderColor: 'color-mix(in srgb, var(--cor-borda) 20%, transparent)' }}>
                    <TabButton label="Dívidas Pendentes" icon={<FileText size={16} />} active={abaAtiva === 'dividas'} onClick={() => setAbaAtiva('dividas')} />
                    <TabButton label="Adicionar Produto Fiado" icon={<ShoppingCart size={16} />} active={abaAtiva === 'produtos'} onClick={() => setAbaAtiva('produtos')} />
                </div>

                <div className="flex-1 overflow-y-auto px-4 sm:p-6 min-h-0 pb-8">
                    {loading? (
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--cor-primaria)' }} />
                        </div>
                    ) : (
                        <>
                            {abaAtiva === 'dividas' && (
                                <div className="space-y-2">
                                    {vendas.length === 0? (
                                        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center mt-4" style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-card)' }}>
                                            <Inbox size={32} style={{ color: 'var(--cor-texto-sec)' }} />
                                            <p>Nenhuma dívida pendente</p>
                                        </div>
                                    ) : (
                                        vendas.map(v => (
                                            <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg" style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-card)' }}>
                                                <div>
                                                    <p className="text-sm font-semibold flex items-center gap-1"><Calendar size={12} />{new Date(v.data_venda).toLocaleDateString('pt-AO')}</p>
                                                    <p className="text-xs opacity-70">Itens: {v.total_itens} | Saldo: {formatCurrency(v.saldo_devedor)}</p>
                                                </div>
                                                <Button size="sm" style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: '8px' }} onClick={() => onPagar(v)}>
                                                    Pagar
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {abaAtiva === 'produtos' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Input placeholder="Buscar produto..." value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} className="mb-3 h-9" />
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                            {produtosFiltrados.map(p => (
                                                <div key={p.id} className="flex items-center justify-between p-2 border rounded-lg" style={{ borderColor: 'var(--cor-borda)', background: 'var(--cor-card)' }}>
                                                    <div>
                                                        <p className="text-sm font-semibold">{p.nome}</p>
                                                        <p className="text-xs">{formatCurrency(p.preco)} | Estoque: {p.estoque?? 0}</p>
                                                    </div>
                                                    <Button size="sm" style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: '8px' }} onClick={() => adicionarAoCarrinho(p)}>
                                                        <Plus size={14} />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)', borderRadius: '8px', padding: '12px' }}>
                                        <p className="font-bold mb-2">Carrinho Fiado</p>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto mb-3">
                                            {carrinho.length === 0 && <p className="text-xs opacity-70">Nenhum item</p>}
                                            {carrinho.map(i => (
                                                <div key={i.id} className="flex items-center justify-between">
                                                    <p className="text-xs">{i.nome} x{i.qtd}</p>
                                                    <div className="flex items-center gap-1">
                                                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => alterarQtd(i.id, -1)}><Minus size={12} /></Button>
                                                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => removerDoCarrinho(i.id)}><Trash2 size={12} /></Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="font-bold">Total: {formatCurrency(totalCarrinho)}</p>
                                        <Button className="w-full mt-3" style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: '8px' }} onClick={handleSalvarFiado}>
                                            Salvar como Dívida
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
