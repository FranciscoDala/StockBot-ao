"use client";
import { useMemo, useEffect, useCallback } from "react";
import { Search, ShoppingCart, CreditCard, Banknote, Smartphone, ArrowLeft, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmarModal } from "../modals/ConfirmacaoModal";
import { formatCurrency } from "../utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || "http://127.0.0.1:8000";

interface Produto {
    id: string;
    nome: string;
    sku: string;
    preco_venda?: number;
    preco: number;
    preco_custo: number;
    estoque: number;
    estoque_minimo: number;
    unidade: string;
    imagem_url?: string;
    is_active: boolean;
    loja_id: string;
    descricao?: string;
    codigo_barras?: string | null;
    marca?: string;
    categoria_id?: string | number | null;
    localizacao?: string;
    fornecedor_id?: string | number | null;
    data_validade?: string;
    ncm?: string;
    peso_kg?: number | null;
}

interface CarrinhoItem extends Produto {
    quantidade: number;
}

interface ItemVenda {
    id: string;
    nome_produto: string;
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
}

interface Props {
    produtos: Produto[];
    carrinho: CarrinhoItem[];
    busca: string;
    setBusca: (v: string) => void;
    formaPagamento: string;
    setFormaPagamento: (v: string) => void;
    valorRecebido: string;
    setValorRecebido: (v: string) => void;
    subtotal: number;
    totalItens: number;
    troco: number;
    podeFinalizar: boolean;
    adicionarAoCarrinho: (p: Produto) => void;
    confirmarRemoverItem: (item: CarrinhoItem) => void;
    handleFinalizar: () => void;
    showConfirmarModal: boolean;
    setShowConfirmarModal: (v: boolean) => void;
    itemParaRemover: CarrinhoItem | null;
    handleConfirmarRemocao: () => void;
    showConfirmarFinalizar: boolean;
    setShowConfirmarFinalizar: (v: boolean) => void;
    executarFinalizarVenda: () => void;
    loadingVenda: boolean;
    onClose: () => void;
    token: string | null;
    nomeLoja: string;
    nifLoja?: string;
    enderecoLoja?: string;
    lojaId?: string;
    vendaAtual?: {
        id: string;
        data: string;
        total: number;
        formaPagamento: string;
        itens: number;
        detalhes: ItemVenda[];
    } | null
    theme: string;
    cardStyle: string;
    cardSize: string;
}

export function VendaTab({
    produtos,
    carrinho,
    busca, setBusca,
    formaPagamento, setFormaPagamento,
    valorRecebido, setValorRecebido,
    subtotal, totalItens, troco, podeFinalizar,
    adicionarAoCarrinho,
    confirmarRemoverItem,
    handleFinalizar,
    showConfirmarModal, setShowConfirmarModal,
    itemParaRemover,
    handleConfirmarRemocao,
    showConfirmarFinalizar, setShowConfirmarFinalizar,
    executarFinalizarVenda,
    loadingVenda,
    onClose,
    nomeLoja,
    nifLoja = "NIF: 000",
    enderecoLoja = "Endereço: ---",
    vendaAtual,
    theme,
    cardStyle,
    cardSize
}: Props) {

    const radius = cardStyle === 'arredondado' ? '16px' : '8px';
    //const padding = cardSize === 'grande' ? '24px' : '16px';

    const getPreco = (item: CarrinhoItem) => item.preco_venda ?? item.preco ?? 0;

    const gerarHeaderFactura = useCallback(() => `
        <div class="header">
            <h1>${nomeLoja.toUpperCase()}</h1>
            <p>${nifLoja}</p>
            <p>${enderecoLoja}</p>
        </div>
        <hr>
    `, [nomeLoja, nifLoja, enderecoLoja])

    const handleImprimir = useCallback((venda: any) => {
        const itensHtml = venda.detalhes.map((item: ItemVenda) => `
            <tr>
                <td>${item.nome_produto}</td>
                <td style="text-align:center">${item.quantidade}</td>
                <td style="text-align:right">${formatCurrency(item.preco_unitario)}</td>
                <td style="text-align:right">${formatCurrency(item.subtotal)}</td>
            </tr>
        `).join('');

        const html = `
        <!DOCTYPE html>
        <html lang="pt-AO">
        <head>
            <meta charset="UTF-8">
            <title>Recibo #${venda.id.slice(0, 8)}</title>
            <style>
                @page { size: 80mm auto; margin: 5mm; }
                body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; font-size: 11px; color: #000; background: #fff; }
         .header { text-align: center; margin-bottom: 5px; }
         .header h1 { margin: 0; font-size: 14px; font-weight: bold; }
         .header p { margin: 1px 0; font-size: 10px; }
         .info p { margin: 1px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 5px; }
                th, td { padding: 2px 0; font-size: 11px; }
                hr { border: none; border-top: 1px dashed #000; margin: 3px 0; }
         .total { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-top: 5px; }
         .footer { text-align: center; margin-top: 8px; font-size: 10px; }
            </style>
        </head>
        <body onload="window.print()">
            ${gerarHeaderFactura()}
            <div class="info">
                <p>RECIBO: #${venda.id.slice(0, 8).toUpperCase()}</p>
                <p>DATA: ${new Date(venda.data).toLocaleString('pt-AO')}</p>
            </div>
            <hr>
            <table><tbody>${itensHtml}</tbody></table>
            <hr>
            <p>ITENS: ${venda.itens}</p>
            <div class="total"><span>TOTAL</span><span>${formatCurrency(venda.total)}</span></div>
            <hr>
            <p style="text-align:center">Tipo de Pagamento: ${venda.formaPagamento}</p>
            <div class="footer"><p>Obrigado e volte sempre!</p></div>
        </body>
        </html>
        `;

        const printWindow = window.open('', '_blank', 'width=400,height=700');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            printWindow.onafterprint = () => printWindow.close(); // <- fecha sozinha
        }
    }, [formatCurrency, gerarHeaderFactura]);

    useEffect(() => {
        if (formaPagamento !== "Dinheiro") {
            setValorRecebido("")
        }
    }, [formaPagamento, setValorRecebido])

    useEffect(() => {
        if (vendaAtual) {
            handleImprimir(vendaAtual)
        }
    }, [vendaAtual, handleImprimir]);

    useEffect(() => {
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
                if (window.innerWidth > 1024) { // <- só foca no desktop
                    document.getElementById('busca-produto')?.focus();
                }
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

    return (
        <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)' }}>
            <div className="flex items-center justify-between p-3 border-b sticky top-0 z-20" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-primaria)30' }}>
                <Button
                    variant="ghost"
                    onClick={() => {
                        setBusca(""); // limpa busca ao sair
                        onClose();
                    }}
                    className="gap-2 h-9 transition"
                    style={{
                        color: 'var(--cor-texto)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--cor-primaria)';
                        e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--cor-texto)';
                    }}
                >
                    <ArrowLeft size={18} /> <span className="hidden sm:inline">Voltar</span>
                </Button>

                <h2 className="font-bold text-base truncate max-w-[200px]">{nomeLoja}</h2>
                <div className="text-base hidden lg:block" style={{ color: 'var(--cor-texto-sec)' }}>F2: Buscar | ESC: Sair</div>
            </div>
            <div className="flex flex-col lg:grid lg:grid-cols-3 flex-1">
                <div className="lg:col-span-2 p-3">
                    <div className="relative mb-3 sticky top-12 z-10 pb-2" style={{ backgroundColor: 'var(--cor-fundo)' }}>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--cor-texto-sec)' }} />
                        <Input
                            id="busca-produto"
                            placeholder="Buscar produto... [F2]"
                            className="pl-9 h-10 text-base sm:text-sm" // <- text-base no mobile = 16px
                            style={{
                                backgroundColor: 'var(--cor-card)',
                                color: 'var(--cor-texto)',
                                border: '1px solid var(--cor-primaria)30',
                                borderRadius: radius,
                                fontSize: '16px' // <- força 16px pra não dar zoom no ios
                            }}
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        // autoFocus removido // <- TIRA ISSO
                        />
                    </div>

                    {produtosFiltrados.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64" style={{ color: 'var(--cor-texto-sec)' }}>
                            <PackageX size={40} />
                            <p className="mt-2 text-sm">Nenhum produto encontrado</p>
                        </div>
                    )}

                    <div className="flex lg:grid gap-3 overflow-x-auto lg:overflow-x-visible lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-4">
                        {produtosFiltrados.map(p => {
                            const preco = p.preco_venda ?? p.preco ?? 0;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => adicionarAoCarrinho(p)}
                                    disabled={p.estoque <= 0}
                                    className="border overflow-hidden text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed group shrink-0 w-28 sm:w-32 lg:w-auto"
                                    style={{
                                        backgroundColor: 'var(--cor-card)',
                                        borderColor: 'var(--cor-primaria)20',
                                        borderRadius: radius
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--cor-primaria)'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--cor-primaria)20'}
                                >
                                    <div className="relative w-full aspect-square" style={{ backgroundColor: 'var(--cor-fundo)' }}>
                                        {p.imagem_url ? (
                                            <img src={p.imagem_url.startsWith('http') ? p.imagem_url : `${API_BASE}${p.imagem_url}`} alt={p.nome} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-base" style={{ color: 'var(--cor-primaria)', opacity: 0.3 }}>Sem Img</div>
                                        )}
                                        {p.estoque <= 0 && (<Badge variant="destructive" className="absolute top-1 right-1 text-[9px] px-1" style={{ backgroundColor: '#ef4444' }}>0</Badge>)}
                                        {p.estoque > 0 && (<Badge className="absolute top-1 right-1 text-white border-none text-[9px] px-1.5" style={{ backgroundColor: 'var(--cor-primaria)' }}>{p.estoque}</Badge>)}
                                    </div>
                                    <div className="p-2">
                                        <h4 className="font-semibold text-base truncate" style={{ color: 'var(--cor-texto)' }}>{p.nome}</h4>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="font-bold text-base" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(preco)}</span>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                    {/* MOBILE CARRINHO */}
                    <div className="lg:hidden mt-4">
                        <h3 className="font-bold text-sm flex items-center gap-2 mb-2" style={{ color: 'var(--cor-texto)' }}>
                            <ShoppingCart size={16} /> Produtos {totalItens > 0 && `(${totalItens})`}
                        </h3>
                        <div className="max-h-[180px] sm:max-h-none overflow-y-auto space-y-1 pb-24 rounded-lg py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ backgroundColor: 'var(--cor-card)', borderRadius: radius }}>
                            {carrinho.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-24" style={{ color: 'var(--cor-texto-sec)' }}>
                                    <ShoppingCart size={24} />
                                    <p className="mt-1 text-base">Adiciona produtos na lista para fazer venda</p>
                                </div>
                            )}
                            {carrinho.map(item => {
                                const preco = getPreco(item);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => confirmarRemoverItem(item)}
                                        className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-red-950/30 transition-colors"
                                        style={{ backgroundColor: 'var(--cor-fundo)', borderRadius: radius }}
                                    >
                                        <span className="text-base font-bold w-8 text-center">{item.quantidade}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-semibold truncate" style={{ color: 'var(--cor-texto)' }}>{item.nome}</p>
                                            <p className="text-base font-bold" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(preco)}</p>
                                        </div>
                                        <p className="text-base font-bold" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(preco * item.quantidade)}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* MOBILE PAGAMENTO */}
                    <div className="lg:hidden py-3 space-y-2 border-t sticky bottom-0" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-primaria)30' }}>
                        <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                            <SelectTrigger className="h-10 text-sm" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1px solid var(--cor-primaria)30', borderRadius: radius }}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent style={{ backgroundColor: 'var(--cor-card)', border: '1px solid var(--cor-primaria)30' }}>
                                <SelectItem value="Dinheiro" style={{ color: 'var(--cor-texto)' }}><Banknote size={14} className="inline mr-2" />Dinheiro</SelectItem>
                                <SelectItem value="TPA" style={{ color: 'var(--cor-texto)' }}><CreditCard size={14} className="inline mr-2" />TPA</SelectItem>
                                <SelectItem value="Transferencia" style={{ color: 'var(--cor-texto)' }}><Smartphone size={14} className="inline mr-2" />Transferência</SelectItem>
                            </SelectContent>
                        </Select>

                        {formaPagamento === "Dinheiro" && (
                            <Input
                                type="text" // <- troca number por text
                                inputMode="decimal" // <- abre teclado numérico no mobile
                                placeholder="Valor Recebido"
                                className="h-10 text-base sm:text-sm" // <- 16px no mobile
                                style={{
                                    backgroundColor: 'var(--cor-fundo)',
                                    color: 'var(--cor-texto)',
                                    border: '1px solid var(--cor-primaria)30',
                                    borderRadius: radius,
                                    fontSize: '16px' // <- impede zoom no ios
                                }}
                                value={valorRecebido}
                                onChange={(e) => {
                                    let val = e.target.value.replace(/[^0-9.,]/g, '') // só aceita número
                                    val = val.replace(/,/g, '.') // transforma vírgula em ponto
                                    val = val.replace(/(\..*)\./g, '$1') // só deixa 1 ponto
                                    setValorRecebido(val)
                                }}
                            />
                        )}
                        {formaPagamento === "Dinheiro" && troco > 0 && (
                            <div className="flex justify-between text-base font-semibold" style={{ color: '#fbbf24' }}>
                                <span>Troco</span>
                                <span>{formatCurrency(troco)}</span>
                            </div>
                        )}



                        <div className="flex justify-between items-center">
                            <span className="text-base" style={{ color: 'var(--cor-texto-sec)' }}>Total</span>
                            <span className="font-bold text-lg" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(subtotal)}</span>
                        </div>

                        <Button
                            onClick={handleFinalizar}
                            disabled={!podeFinalizar || loadingVenda}
                            className="w-full h-12 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}
                        >
                            {loadingVenda ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : "Finalizar Venda"}
                        </Button>
                    </div>
                </div>












                {/* DESKTOP CARRINHO */}
                <div className="border-t lg:border-t-0 lg:border-l hidden lg:flex lg:flex-col h-[calc(100vh-57px)] sticky top-0" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-primaria)30' }}>
                    <h3 className="font-bold text-base flex items-center gap-2 p-3 border-b" style={{ color: 'var(--cor-texto)', borderColor: 'var(--cor-primaria)30' }}>
                        <ShoppingCart size={18} /> Carrinho {totalItens > 0 && `(${totalItens})`}
                    </h3>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {carrinho.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--cor-texto-sec)' }}>
                                <ShoppingCart size={32} />
                                <p className="mt-2 text-base">Vazio</p>
                            </div>
                        )}
                        {carrinho.map(item => {
                            const preco = getPreco(item);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => confirmarRemoverItem(item)}
                                    className="p-2.5 rounded-lg cursor-pointer hover:bg-red-950/30 transition-colors"
                                    style={{ backgroundColor: 'var(--cor-fundo)', borderRadius: radius }}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-base truncate" style={{ color: 'var(--cor-texto)' }}>{item.nome}</p>
                                            <p className="text-base font-bold" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(preco)} x {item.quantidade}</p>
                                        </div>
                                        <span className="text-sm font-bold">{item.quantidade}</span>
                                    </div>
                                    <div className="flex justify-end mt-1">
                                        <p className="font-bold text-sm" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(preco * item.quantidade)}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="border-t p-3 space-y-2 mt-auto" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-primaria)30' }}>
                        <div className="flex justify-between text-base"><span style={{ color: 'var(--cor-texto-sec)' }}>Subtotal</span><span className="font-semibold">{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between text-lg"><span className="font-bold">Total</span><span className="font-bold" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(subtotal)}</span></div>

                        <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                            <SelectTrigger className="h-9 text-sm" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1px solid var(--cor-primaria)30', borderRadius: radius }}><SelectValue /></SelectTrigger>
                            <SelectContent style={{ backgroundColor: 'var(--cor-card)', border: '1px solid var(--cor-primaria)30' }}>
                                <SelectItem value="Dinheiro" style={{ color: 'var(--cor-texto)' }}><Banknote size={14} className="inline mr-2" />Dinheiro</SelectItem>
                                <SelectItem value="TPA" style={{ color: 'var(--cor-texto)' }}><CreditCard size={14} className="inline mr-2" />TPA</SelectItem>
                                <SelectItem value="Transferencia" style={{ color: 'var(--cor-texto)' }}><Smartphone size={14} className="inline mr-2" />Transferência</SelectItem>
                            </SelectContent>
                        </Select>

                        {formaPagamento === "Dinheiro" && (
                            <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="Valor Recebido"
                                className="h-9 text-base sm:text-sm"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)',
                                    color: 'var(--cor-texto)',
                                    border: '1px solid var(--cor-primaria)30',
                                    borderRadius: radius,
                                    fontSize: '16px'
                                }}
                                value={valorRecebido}
                                onChange={(e) => {
                                    let val = e.target.value.replace(/[^0-9.,]/g, '') // só aceita número
                                    val = val.replace(/,/g, '.') // transforma vírgula em ponto
                                    val = val.replace(/(\..*)\./g, '$1') // só deixa 1 ponto
                                    setValorRecebido(val)
                                }}
                            />
                        )}
                        {formaPagamento === "Dinheiro" && troco > 0 && (
                            <div className="flex justify-between text-base font-semibold" style={{ color: '#fbbf24' }}>
                                <span>Troco</span>
                                <span>{formatCurrency(troco)}</span>
                            </div>
                        )}




                        <Button
                            onClick={handleFinalizar}
                            disabled={!podeFinalizar || loadingVenda}
                            className="w-full h-11 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: radius }}
                        >
                            {loadingVenda ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : "Finalizar [Enter]"}
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
                tipo="venda"
            />

            <ConfirmarModal
                open={showConfirmarFinalizar}
                onClose={() => setShowConfirmarFinalizar(false)}
                onConfirm={executarFinalizarVenda}
                titulo="Finalizar Venda"
                descricao={`Deseja finalizar a venda no valor de ${formatCurrency(subtotal)} via ${formaPagamento}?`}
                textoConfirmar="Sim, Finalizar"
                loading={loadingVenda}
                tipo="venda"
            />
        </div>
    )
}
