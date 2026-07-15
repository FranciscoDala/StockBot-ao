"use client";
import { Plus, Edit, Trash2, Package, TrendingUp, TrendingDown, AlertTriangle, Tag, ImageOff, QrCode, Download, DollarSign, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1','') || "http://127.0.0.1:8000";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface Props {
    produtos: any[];
    isAdmin: boolean;
    isDono: boolean;
    lojaId?: string;
    onAdd: () => void;
    onEdit: (p: any) => void;
    onDelete: (p: any) => void;
    formatCurrency: (v: number) => string;
}

export function ProdutosTab({ produtos, isAdmin, isDono, lojaId, onAdd, onEdit, onDelete, formatCurrency }: Props) {
    const [qrProduto, setQrProduto] = useState<any>(null);

    const getEstoqueStatus = (estoque: number, minimo: number) => {
        if (estoque === 0) return { color: "text-red-500", bg: "bg-red-500/10 border-red-500/20", label: "Sem Estoque", icon: <AlertTriangle size={12} /> };
        if (estoque <= minimo) return { color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", label: "Estoque Baixo", icon: <TrendingDown size={12} /> };
        return { color: "text-green-500", bg: "bg-green-500/10 border-green-500/20", label: "Em Estoque", icon: <TrendingUp size={12} /> };
    }

    const kpis = useMemo(() => {
        const totalProdutos = produtos.length;
        const totalEmEstoque = produtos.filter(p => p.estoque > p.estoque_minimo).length;
        const estoqueBaixo = produtos.filter(p => p.estoque > 0 && p.estoque <= p.estoque_minimo).length;
        const semEstoque = produtos.filter(p => p.estoque === 0).length;
        const valorTotalEstoque = produtos.reduce((acc, p) => acc + ((p.preco_custo || 0) * (p.estoque || 0)), 0);
        return { totalProdutos, totalEmEstoque, estoqueBaixo, semEstoque, valorTotalEstoque };
    }, [produtos]);

    const handleDownloadQR = (p: any) => {
        const svg = document.getElementById(`qr-${p.id}`);
        if (!svg) return;
        const serializer = new XMLSerializer();
        const svgBlob = new Blob([serializer.serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `QR-${p.sku || p.id}.svg`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
        <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        <div className="space-y-6">
            {/* HEADER PADRONIZADO */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <Package size={22} />
                        Produtos
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400">{kpis.totalProdutos} produtos cadastrados</p>
                </div>
                {isAdmin && (
                    <Button onClick={onAdd} className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                        <Plus size={16} /> Novo Produto
                    </Button>
                )}
            </div>

            {/* CARDS KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-neutral-900 p-4 rounded-xl border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Valor em Estoque</p>
                        <DollarSign size={16} className="text-green-500" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-green-500">{formatCurrency(kpis.valorTotalEstoque)}</p>
                </div>

                <div className="bg-neutral-900 p-4 rounded-xl border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Em Estoque</p>
                        <TrendingUp size={16} className="text-green-500" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold">{kpis.totalEmEstoque}</p>
                </div>

                <div className="bg-neutral-900 p-4 rounded-xl border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Estoque Baixo</p>
                        <AlertTriangle size={16} className="text-amber-500" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-amber-500">{kpis.estoqueBaixo}</p>
                </div>

                <div className="bg-neutral-900 p-4 rounded-xl border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400">Sem Estoque</p>
                        <TrendingDown size={16} className="text-red-500" />
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-red-500">{kpis.semEstoque}</p>
                </div>
            </div>

            {/* GRID DE PRODUTOS COM SCROLL */}
            <div className="bg-neutral-900 p-4 sm:p-6 rounded-xl border-neutral-800">
                {produtos.length === 0? (
                    <div className="text-center py-16 border-2 border-dashed border-neutral-800 rounded-xl">
                        <Package className="mx-auto text-gray-600 mb-3" size={48} />
                        <p className="text-gray-400 font-medium">Nenhum produto cadastrado</p>
                        <p className="text-sm text-gray-500">Comece adicionando seu primeiro produto</p>
                    </div>
                ) : (
                    // MOBILE: 1 card 100% + scroll | TABLET: 2 cards | DESKTOP: grid
                    <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
                        <div className="flex gap-4 w-max sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 sm:w-full">
                            {produtos.map(p => {
                                const preco = p.preco_venda || p.preco || 0;
                                const status = getEstoqueStatus(p.estoque, p.estoque_minimo);
                                const imgSrc = p.imagem_url?.startsWith('http')? p.imagem_url : `${API_BASE}${p.imagem_url}`;
                                const qrValue = `${APP_URL}/p/${p.sku || p.id}`;

                                return (
                                    <div key={p.id} className={`bg-neutral-950 border-neutral-800 rounded-xl overflow-hidden flex-col transition-all hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10 group ${!p.is_active? 'opacity-50' : ''} w-[calc(100vw-3rem)] sm:w-auto shrink-0`}>
                                        <div className="relative w-full h-48 bg-neutral-900">
                                            {p.imagem_url? (
                                                <img src={imgSrc} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><ImageOff className="text-gray-700" size={32} /></div>
                                            )}

                                            <div className="absolute top-2 right-2 flex gap-1.5">
                                                <button onClick={() => setQrProduto(p)} className="bg-black/60 backdrop-blur-sm p-1.5 rounded-lg hover:bg-green-600 transition-colors" title="Ver QR Code">
                                                    <QrCode size={16} className="text-white" />
                                                </button>
                                                {!p.is_active && (<Badge variant="destructive" className="text-xs h-6 px-2">Inativo</Badge>)}
                                            </div>
                                        </div>

                                        <div className="p-4 flex-col flex-1">
                                            <h4 className="font-semibold text-base truncate group-hover:text-green-500 transition-colors mb-1">{p.nome}</h4>
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3"><Tag size={12} /> {p.sku || 'N/A'}</div>

                                            <div className="space-y-2 text-sm flex-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400">Preço</span>
                                                    <span className="font-bold text-green-400 text-base">{formatCurrency(preco)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-400">Qtd</span>
                                                    <div className={`flex items-center gap-1.5 font-bold ${status.color}`}>
                                                        {status.icon}
                                                        <span>{p.estoque} {p.unidade}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`mt-3 mb-3 px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 w-fit ${status.bg} ${status.color}`}>
                                                {status.icon} {status.label}
                                            </div>

                                            {isAdmin && (
                                                <div className="flex gap-2 mt-auto pt-3 border-t border-neutral-800">
                                                    <Button size="sm" variant="secondary" onClick={() => onEdit(p)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 h-9">
                                                        <Edit size={14}/> Editar
                                                    </Button>
                                                    {isDono && (
                                                        <Button size="sm" variant="destructive" onClick={() => onDelete(p)} className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white h-9 px-3">
                                                            <Trash2 size={14}/>
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>

        <Dialog open={!!qrProduto} onOpenChange={() => setQrProduto(null)}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle>QR Code do Produto</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-5 py-4">
                    {qrProduto && (
                        <>
                            <div className="bg-white p-5 rounded-xl shadow-lg">
                                <QRCodeSVG id={`qr-${qrProduto.id}`} value={`${APP_URL}/p/${qrProduto.sku || qrProduto.id}`} size={150} level="H" />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-lg">{qrProduto.nome}</p>
                                <p className="text-sm text-gray-400">SKU: {qrProduto.sku || 'N/A'}</p>
                            </div>
                            <Button onClick={() => handleDownloadQR(qrProduto)} className="bg-green-600 hover:bg-green-700 w-full h-11">
                                <Download size={16} /> Baixar QR em SVG
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
        </>
    )
}
