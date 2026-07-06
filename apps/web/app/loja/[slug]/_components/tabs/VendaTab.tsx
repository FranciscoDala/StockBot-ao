"use client";
import { useState, useMemo, useEffect, useCallback } from "react"; // <- 1. ADICIONEI useCallback
import { Search, ShoppingCart, CreditCard, Banknote, Smartphone, ArrowLeft, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ConfirmarModal } from "../modals/ConfirmacaoModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || "http://127.0.0.1:8000";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface Produto {
    id: number;
    nome: string;
    sku: string;
    preco_venda: number;
    preco: number;
    estoque: number;
    estoque_minimo: number;
    unidade: string;
    imagem_url: string;
    is_active: boolean;
}

interface CarrinhoItem extends Produto {
    quantidade: number;
}

interface Props {
    produtos: Produto[];
    carrinho: CarrinhoItem[];
    setCarrinho: React.Dispatch<React.SetStateAction<CarrinhoItem[]>>;
    formatCurrency: (v: number) => string;
    onFinalizarVenda: (venda: any) => void;
    onClose: () => void;
    onRemoverItem: (item: CarrinhoItem) => void;
    token: string | null;
    nomeLoja: string;
}

export function VendaTab({ produtos, carrinho, setCarrinho, formatCurrency, onFinalizarVenda, onClose, onRemoverItem, token, nomeLoja }: Props) {
    const [busca, setBusca] = useState("");
    const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
    const [valorRecebido, setValorRecebido] = useState("");
    const [loadingVenda, setLoadingVenda] = useState(false);

    const [showConfirmarModal, setShowConfirmarModal] = useState(false);
    const [itemParaRemover, setItemParaRemover] = useState<CarrinhoItem | null>(null);
    const [showConfirmarFinalizar, setShowConfirmarFinalizar] = useState(false);

    const getPreco = (item: CarrinhoItem) => item.preco_venda || item.preco || 0;
    const subtotal = carrinho.reduce((acc, item) => acc + (getPreco(item) * item.quantidade), 0);
    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    const troco = formaPagamento === "Dinheiro" && Number(valorRecebido) > subtotal ? Number(valorRecebido) - subtotal : 0;

    const podeFinalizar = useMemo(() => {
        if (carrinho.length === 0) return false;
        if (formaPagamento === "Dinheiro") {
            return Number(valorRecebido) >= subtotal && subtotal > 0;
        }
        return true;
    }, [carrinho, formaPagamento, valorRecebido, subtotal]);

    const handleFinalizar = useCallback(() => { // <- 2. VIROU useCallback E SUBIU PRA CIMA
        if (!podeFinalizar) return;
        setShowConfirmarFinalizar(true);
    }, [podeFinalizar]);

    useEffect(() => { // <- 3. AGORA PODE USAR handleFinalizar E podeFinalizar
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onClose();
            }
            if (e.key === 'Enter' && carrinho.length > 0 && podeFinalizar) {
                e.preventDefault();
                e.stopPropagation();
                handleFinalizar();
            }
            if (e.key === 'F2') {
                e.preventDefault();
                document.getElementById('busca-produto')?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [carrinho, onClose, handleFinalizar, podeFinalizar]);

    const produtosFiltrados = useMemo(() => {
        return produtos.filter(p =>
            p.is_active &&
            (p.nome.toLowerCase().includes(busca.toLowerCase()) ||
                p.sku.toLowerCase().includes(busca.toLowerCase()))
        );
    }, [produtos, busca]);

    const adicionarAoCarrinho = (produto: Produto) => {
        if (produto.estoque <= 0) { toast.error("Produto sem estoque"); return; }
        setCarrinho(prev => {
            const itemExistente = prev.find(item => item.id === produto.id);
            if (itemExistente) {
                if (itemExistente.quantidade >= produto.estoque) { toast.warning("Estoque máximo atingido"); return prev; }
                return prev.map(item => item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item);
            }
            return [...prev, { ...produto, quantidade: 1 }];
        });
    };

    const confirmarRemoverItemCarrinho = (item: CarrinhoItem) => { // <- 4. VOLTOU A ABRIR MODAL
        setItemParaRemover(item);
        setShowConfirmarModal(true);
    };


    const handleConfirmarRemocao = () => { // <- 5. AGORA CHAMA O PAI PRA REMOVER
        if (itemParaRemover) {
            onRemoverItem(itemParaRemover);
            toast.success("Produto removido do carrinho");
        }
        setShowConfirmarModal(false);
        setItemParaRemover(null);
    };

    const executarFinalizarVenda = async () => {
        if (!token) { toast.error("Sessão expirada. Faça login novamente"); return; }
        setLoadingVenda(true);
        setShowConfirmarFinalizar(false);

        const payload = {
            total: subtotal,
            total_itens: totalItens,
            forma_pagamento: formaPagamento,
            valor_recebido: Number(valorRecebido) || 0,
            troco: troco,
            itens: carrinho.map(item => ({
                produto_id: item.id,
                quantidade: item.quantidade,
                preco_unitario: getPreco(item),
                subtotal: getPreco(item) * item.quantidade
            }))
        };

        try {
            const res = await fetch(`${API_URL}/vendas/`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || "Erro ao salvar venda");
            }

            const vendaSalva = await res.json();
            setTimeout(() => {
                onFinalizarVenda(vendaSalva);
            }, 200);
            setCarrinho([]);
            setValorRecebido("");
        } catch (error: any) {
            toast.error(error.message);
            setShowConfirmarFinalizar(true);
        } finally {
            setLoadingVenda(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
            <div className="flex items-center justify-between p-3 bg-neutral-950 border-b border-neutral-800 sticky top-0 z-20">
                <Button variant="ghost" onClick={onClose} className="hover:bg-neutral-800 gap-2 h-9">
                    <ArrowLeft size={18} /> <span className="hidden sm:inline">Voltar</span>
                </Button>
                <h2 className="font-bold text-base truncate max-w-[200px]">{nomeLoja}</h2>
                <div className="text-xs text-gray-400 hidden lg:block">F2: Buscar | ESC: Sair</div>
            </div>
            <div className="flex flex-col lg:grid lg:grid-cols-3 flex-1">
                <div className="lg:col-span-2 p-3">
                    <div className="relative mb-3 sticky top-12 bg-[#0a0a0a] z-10 pb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <Input
                            id="busca-produto"
                            placeholder="Buscar produto... [F2]"
                            className="pl-9 bg-neutral-950 border-neutral-800 h-10 text-sm focus:border-green-500"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {produtosFiltrados.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <PackageX size={40} />
                            <p className="mt-2 text-sm">Nenhum produto encontrado</p>
                        </div>
                    )}

                    <div className="flex lg:grid gap-3 overflow-x-auto lg:overflow-x-visible lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-4">
                        {produtosFiltrados.map(p => {
                            const preco = p.preco_venda || p.preco || 0;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => adicionarAoCarrinho(p)}
                                    disabled={p.estoque <= 0}
                                    className="bg-neutral-950 border-neutral-800 rounded-xl overflow-hidden text-left transition-all hover:border-green-500/50 disabled:opacity-40 disabled:cursor-not-allowed group shrink-0 w-28 sm:w-32 lg:w-auto"
                                >
                                    <div className="relative w-full aspect-square bg-neutral-900">
                                        {p.imagem_url ? (
                                            <img src={p.imagem_url.startsWith('http') ? p.imagem_url : `${API_BASE}${p.imagem_url}`} alt={p.nome} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">Sem Img</div>
                                        )}
                                        {p.estoque <= 0 && (<Badge variant="destructive" className="absolute top-1 right-1 text-[9px] px-1">0</Badge>)}
                                        {p.estoque > 0 && (<Badge className="absolute top-1 right-1 bg-green-600 text-white border-none text-[9px] px-1.5">{p.estoque}</Badge>)}
                                    </div>
                                    <div className="p-2">
                                        <h4 className="font-semibold text-xs truncate">{p.nome}</h4>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="font-bold text-green-400 text-xs">{formatCurrency(preco)}</span>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    <div className="lg:hidden mt-4">
                        <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
                            <ShoppingCart size={16} /> Produtos {totalItens > 0 && `(${totalItens})`}
                        </h3>
                        <div className="max-h-[180px] sm:max-h-none overflow-y-auto space-y-1 pb-24 bg-neutral-950 rounded-lg py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {carrinho.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-24 text-gray-500">
                                    <ShoppingCart size={24} />
                                    <p className="mt-1 text-xs">Adiciona produtos na lista para fazer venda</p>
                                </div>
                            )}
                            {carrinho.map(item => {
                                const preco = getPreco(item);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => confirmarRemoverItemCarrinho(item)}
                                        className="flex items-center gap-2 p-2 bg-neutral-900 rounded-md cursor-pointer hover:bg-red-950/30 transition-colors"
                                    >
                                        <span className="text-xs font-bold w-8 text-center">{item.quantidade}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate">{item.nome}</p>
                                            <p className="text-xs font-bold text-green-400">{formatCurrency(preco)}</p>
                                        </div>
                                        <p className="text-xs font-bold text-green-400">{formatCurrency(preco * item.quantidade)}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="lg:hidden py-3 space-y-2 border-t border-neutral-800 bg-neutral-950 sticky bottom-0">
                        <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                            <SelectTrigger className="bg-neutral-900 border-neutral-800 h-10 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                                <SelectItem value="Dinheiro"><Banknote size={14} className="inline mr-2" />Dinheiro</SelectItem>
                                <SelectItem value="TPA"><CreditCard size={14} className="inline mr-2" />TPA</SelectItem>
                                <SelectItem value="Transferencia"><Smartphone size={14} className="inline mr-2" />Transferência</SelectItem>
                            </SelectContent>
                        </Select>

                        {formaPagamento === "Dinheiro" && (
                            <Input type="number" placeholder="Valor Recebido" className="bg-neutral-900 border-neutral-800 h-10 text-sm" value={valorRecebido} onChange={(e) => setValorRecebido(e.target.value)} />
                        )}
                        {formaPagamento === "Dinheiro" && troco > 0 && (
                            <div className="flex justify-between text-xs font-semibold text-amber-400"><span>Troco</span><span>{formatCurrency(troco)}</span></div>
                        )}

                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Total</span>
                            <span className="font-bold text-green-400 text-lg">{formatCurrency(subtotal)}</span>
                        </div>

                        <Button
                            onClick={handleFinalizar}
                            disabled={!podeFinalizar || loadingVenda}
                            className="bg-green-600 hover:bg-green-700 w-full h-12 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingVenda ? "Finalizando..." : "Finalizar Venda"}
                        </Button>
                    </div>
                </div>

                <div className="bg-neutral-950 border-t lg:border-t-0 lg:border-l border-neutral-800 hidden lg:flex lg:flex-col h-[calc(100vh-57px)] sticky top-">
                    <h3 className="font-bold text-base flex items-center gap-2 p-3 border-b border-neutral-800">
                        <ShoppingCart size={18} /> Carrinho {totalItens > 0 && `(${totalItens})`}
                    </h3>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {carrinho.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <ShoppingCart size={32} />
                                <p className="mt-2 text-xs">Vazio</p>
                            </div>
                        )}
                        {carrinho.map(item => {
                            const preco = getPreco(item);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => confirmarRemoverItemCarrinho(item)}
                                    className="bg-neutral-900 p-2.5 rounded-lg cursor-pointer hover:bg-red-950/30 transition-colors"
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-xs truncate">{item.nome}</p>
                                            <p className="text-xs font-bold text-green-400">{formatCurrency(preco)} x {item.quantidade}</p>
                                        </div>
                                        <span className="text-sm font-bold">{item.quantidade}</span>
                                    </div>
                                    <div className="flex justify-end mt-1">
                                        <p className="font-bold text-sm text-green-400">{formatCurrency(preco * item.quantidade)}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="border-t border-neutral-800 p-3 space-y-2 bg-neutral-950 mt-auto">
                        <div className="flex justify-between text-xs"><span className="text-gray-400">Subtotal</span><span className="font-semibold">{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between text-lg"><span className="font-bold">Total</span><span className="font-bold text-green-400">{formatCurrency(subtotal)}</span></div>

                        <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                            <SelectTrigger className="bg-neutral-900 border-neutral-800 h-9 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800">
                                <SelectItem value="Dinheiro"><Banknote size={14} className="inline mr-2" />Dinheiro</SelectItem>
                                <SelectItem value="TPA"><CreditCard size={14} className="inline mr-2" />TPA</SelectItem>
                                <SelectItem value="Transferencia"><Smartphone size={14} className="inline mr-2" />Transferência</SelectItem>
                            </SelectContent>
                        </Select>

                        {formaPagamento === "Dinheiro" && (
                            <Input type="number" placeholder="Valor Recebido" className="bg-neutral-900 border-neutral-800 h-9 text-sm" value={valorRecebido} onChange={(e) => setValorRecebido(e.target.value)} />
                        )}
                        {formaPagamento === "Dinheiro" && troco > 0 && (<div className="flex justify-between text-xs font-semibold text-amber-400"><span>Troco</span><span>{formatCurrency(troco)}</span></div>)}

                        <Button
                            onClick={handleFinalizar}
                            disabled={!podeFinalizar || loadingVenda}
                            className="bg-green-600 hover:bg-green-700 w-full h-11 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loadingVenda ? "Finalizando..." : "Finalizar [Enter]"}
                        </Button>
                    </div>
                </div>
            </div>

            <ConfirmarModal
                open={showConfirmarModal}
                onClose={() => setShowConfirmarModal(false)}
                onConfirm={handleConfirmarRemocao}
                titulo="Confirmar Remoção"
                descricao={`Tem certeza que deseja remover "${itemParaRemover?.nome}" do carrinho? Essa ação não pode ser desfeita.`}
                textoConfirmar="Remover"
                loading={false}
            />

            <ConfirmarModal
                open={showConfirmarFinalizar}
                onClose={() => setShowConfirmarFinalizar(false)}
                onConfirm={executarFinalizarVenda}
                titulo="Finalizar Venda"
                descricao={`Deseja finalizar a venda no valor de ${formatCurrency(subtotal)} via ${formaPagamento}?`}
                textoConfirmar="Sim, Finalizar"
                loading={loadingVenda}
            />
        </div>
    )
}
