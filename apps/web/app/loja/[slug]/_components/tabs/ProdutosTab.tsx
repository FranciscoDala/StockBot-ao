"use client";
import { Plus, Edit, Trash2, Package, TrendingUp, TrendingDown, AlertTriangle, Tag, ImageOff, QrCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1','') || "http://127.0.0.1:8000";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; // <-- ADICIONEI

interface Props {
    produtos: any[];
    isAdmin: boolean;
    isDono: boolean;
    onAdd: () => void;
    onEdit: (p: any) => void;
    onDelete: (p: any) => void;
    formatCurrency: (v: number) => string;
}

export function ProdutosTab({ produtos, isAdmin, isDono, onAdd, onEdit, onDelete, formatCurrency }: Props) {
    const [qrProduto, setQrProduto] = useState<any>(null);

    const getEstoqueStatus = (estoque: number, minimo: number) => {
        if (estoque === 0) return { color: "text-red-500", bg: "bg-red-500/10 border-red-500/20", label: "Sem Estoque", icon: <AlertTriangle size={12} /> };
        if (estoque <= minimo) return { color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", label: "Estoque Baixo", icon: <TrendingDown size={12} /> };
        return { color: "text-green-500", bg: "bg-green-500/10 border-green-500/20", label: "Em Estoque", icon: <TrendingUp size={12} /> };
    }

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
        <div className="bg-neutral-900 p-5 sm:p-6 rounded-xl border-neutral-800">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="font-bold text-lg">Catálogo de Produtos</h3>
                    <p className="text-sm text-gray-400">{produtos.length} {produtos.length === 1? 'produto' : 'produtos'} cadastrados</p>
                </div>
                {isAdmin && (
                    <Button size="sm" onClick={onAdd} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto font-semibold">
                        <Plus size={16} /> Novo Produto
                    </Button>
                )}
            </div>

            {produtos.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed border-neutral-800 rounded-xl">
                    <Package className="mx-auto text-gray-600 mb-3" size={48} />
                    <p className="text-gray-400 font-medium">Nenhum produto cadastrado</p>
                    <p className="text-sm text-gray-500">Comece adicionando seu primeiro produto</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {produtos.map(p => {
                    const preco = p.preco_venda || p.preco || 0;
                    const status = getEstoqueStatus(p.estoque, p.estoque_minimo);
                    const imgSrc = p.imagem_url?.startsWith('http')? p.imagem_url : `${API_BASE}${p.imagem_url}`;
                    const qrValue = `${APP_URL}/p/${p.sku || p.id}`; // <-- QR AGORA É LINK

                    return (
                        <div key={p.id} className={`bg-neutral-950 border-neutral-800 rounded-xl overflow-hidden flex flex-col transition-all hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10 group ${!p.is_active? 'opacity-50' : ''}`}>
                            <div className="relative w-full h-40 bg-neutral-900">
                                {p.imagem_url? (
                                    <img src={imgSrc} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><ImageOff className="text-gray-700" size={32} /></div>
                                )}

                                <div className="absolute top-2 right-2 flex gap-1.5">
                                    {/* BOTAO QR */}
                                    <button
                                        onClick={() => setQrProduto(p)}
                                        className="bg-black/60 backdrop-blur-sm p-1.5 rounded-lg hover:bg-green-600 transition-colors"
                                        title="Ver QR Code"
                                    >
                                        <QrCode size={30} className="text-white" />
                                    </button>
                                    {!p.is_active && (<Badge variant="destructive" className="text-xs h-6 px-2">Inativo</Badge>)}
                                </div>
                            </div>

                            <div className="p-4 flex flex-col flex-1">
                                {/* NOME */}
                                <h4 className="font-semibold text-base truncate group-hover:text-green-500 transition-colors mb-1">{p.nome}</h4>

                                {/* SKU */}
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3"><Tag size={12} /> {p.sku || 'N/A'}</div>

                                {/* INFO PRINCIPAL */}
                                <div className="space-y-2 text-sm flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Preço</span>
                                        <span className="font-bold text-green-400 text-base">{formatCurrency(preco)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Quantidade</span> {/* RENOMEADO */}
                                        <div className={`flex items-center gap-1.5 font-bold ${status.color}`}>
                                            {status.icon}
                                            <span>{p.estoque} {p.unidade}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* STATUS BADGE */}
                                <div className={`mt-3 mb-3 px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 w-fit ${status.bg} ${status.color}`}>
                                    {status.icon} {status.label}
                                </div>

                                {/* BOTOES */}
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

        {/* MODAL DO QR CODE - QR MAIOR */}
        <Dialog open={!!qrProduto} onOpenChange={() => setQrProduto(null)}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle>QR Code do Produto</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-5 py-4">
                    {qrProduto && (
                        <>
                            <div className="bg-white p-5 rounded-xl shadow-lg">
                                <QRCodeSVG id={`qr-${qrProduto.id}`} value={`${APP_URL}/p/${qrProduto.sku || qrProduto.id}`} size={150} level="H" /> {/* AUMENTEI PARA 200 */}
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
