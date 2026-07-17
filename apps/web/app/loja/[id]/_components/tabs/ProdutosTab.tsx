"use client";
import { Plus, Edit, Trash2, Package, TrendingUp, TrendingDown, AlertTriangle, Tag, ImageOff, QrCode, Download, DollarSign, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || "http://127.0.0.1:8000";
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
    theme: string;
    cardStyle: string;
    cardSize: string;
}

export function ProdutosTab({
    produtos,
    isAdmin,
    isDono,
    lojaId,
    onAdd,
    onEdit,
    onDelete,
    formatCurrency,
    theme,
    cardStyle,
    cardSize
}: Props) {
    const [qrProduto, setQrProduto] = useState<any>(null);

    const getEstoqueStatus = (estoque: number, minimo: number) => {
        if (estoque === 0) return { color: "#ef4444", bg: "#ef444414", border: "#ef444430", label: "Sem Estoque", icon: <AlertTriangle size={12} /> };
        if (estoque <= minimo) return { color: "#f59e0b", bg: "#f59e0b14", border: "#f59e0b30", label: "Estoque Baixo", icon: <TrendingDown size={12} /> };
        return { color: "var(--cor-primaria)", bg: "var(--cor-primaria)14", border: "var(--cor-primaria)30", label: "Em Estoque", icon: <TrendingUp size={12} /> };
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
 .snap-x { scroll-snap-type: x mandatory; }
 .snap-center { scroll-snap-align: center; }
        `}</style>
            <div
                className="space-y-6"
                data-theme={theme}
                data-card-style={cardStyle}
                data-card-size={cardSize}
            >

                {/* HEADER PADRONIZADO */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                            Produtos
                            <Package size={16} style={{ color: 'var(--cor-primaria)' }} />
                        </h2>
                        <p className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>{kpis.totalProdutos} produtos cadastrados</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={onAdd}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition hover:brightness-110 text-xs"
                            style={{ background: 'var(--cor-primaria)', color: '#fff' }}
                        >
                            <Plus size={14} /> Adicionar Produto
                        </button>
                    )}
                </div>

                {/* CARDS KPI PADRONIZADOS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div
                        className="card p-3 md:p-4 transition hover:scale-[1.02] min-w-0"
                        style={{
                            background: 'var(--cor-primaria)',
                            color: '#fff',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs md:text-sm font-medium truncate" style={{ opacity: 0.9 }}>Valor em Estoque</p>
                            <DollarSign size={16} className="opacity-90 shrink-0" />
                        </div>
                        <p className="text-xl md:text-2xl lg:text-3xl font-bold truncate" title={formatCurrency(kpis.valorTotalEstoque)}>
                            {formatCurrency(kpis.valorTotalEstoque)}
                        </p>
                        <p className="text-xs md:text-xs mt-1 truncate" style={{ opacity: 0.8 }}>Total do estoque atual</p>
                    </div>

                    <div
                        className="card p-3 md:p-4 transition hover:scale-[1.02] min-w-0"
                        style={{
                            background: 'var(--cor-fundo-card, #18181b)',
                            border: '1px solid var(--cor-primaria)30',
                            color: 'var(--cor-primaria)',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs md:text-sm font-medium truncate" style={{ color: 'var(--cor-texto-sec)' }}>Em Estoque</p>
                            <TrendingUp size={16} className="opacity-80 shrink-0" />
                        </div>
                        <p className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--cor-texto)' }}>{kpis.totalEmEstoque}</p>
                        <p className="text-xs md:text-xs mt-1 truncate" style={{ color: 'var(--cor-texto-sec)' }}>Produtos com estoque ok</p>
                    </div>

                    <div
                        className="card p-3 md:p-4 transition hover:scale-[1.02] min-w-0"
                        style={{
                            background: 'var(--cor-fundo-card, #18181b)',
                            border: '1px solid var(--cor-primaria)30',
                            color: 'var(--cor-primaria)',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs md:text-sm font-medium truncate" style={{ color: 'var(--cor-texto-sec)' }}>Estoque Baixo</p>
                            <AlertTriangle size={16} className="opacity-80 shrink-0" />
                        </div>
                        <p className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--cor-texto)' }}>{kpis.estoqueBaixo}</p>
                        <p className="text-xs md:text-xs mt-1 truncate" style={{ color: 'var(--cor-texto-sec)' }}>Abaixo do mínimo</p>
                    </div>

                    <div
                        className="card p-3 md:p-4 transition hover:scale-[1.02] min-w-0"
                        style={{
                            background: 'var(--cor-fundo-card, #18181b)',
                            border: '1px solid var(--cor-primaria)30',
                            color: 'var(--cor-primaria)',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs md:text-sm font-medium truncate" style={{ color: 'var(--cor-texto-sec)' }}>Sem Estoque</p>
                            <TrendingDown size={16} className="opacity-80 shrink-0" />
                        </div>
                        <p className="text-xl md:text-2xl lg:text-3xl font-bold" style={{ color: 'var(--cor-texto)' }}>{kpis.semEstoque}</p>
                        <p className="text-xs md:text-xs mt-1 truncate" style={{ color: 'var(--cor-texto-sec)' }}>Produtos zerados</p>
                    </div>
                </div>
                {/* GRID DE PRODUTOS - SEM BORDA E SEM PADDING NO PAI */}
                <div className="">
                    {produtos.length === 0? (
                        <div
                            className="text-center py-16 border-2 border-dashed mt-4"
                            style={{ borderColor: 'var(--cor-primaria)30', borderRadius: 'var(--radius)' }}
                        >
                            <Package className="mx-auto mb-3" size={48} style={{ color: 'var(--cor-primaria)', opacity: 0.5 }} />
                            <p className="font-medium" style={{ color: 'var(--cor-texto)' }}>Nenhum produto cadastrado</p>
                            <p className="text-sm" style={{ color: 'var(--cor-texto-sec)' }}>Comece adicionando seu primeiro produto</p>
                        </div>
                    ) : (
                        // MOBILE: SCROLL 100% LARGURA | DESKTOP: GRID
                        <div className="overflow-x-auto scrollbar-hide snap-x">
                            <div className="flex w-max gap- sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 sm:w-full sm:gap-4">
                                {produtos.map(p => {
                                    const preco = p.preco_venda || p.preco || 0;
                                    const status = getEstoqueStatus(p.estoque, p.estoque_minimo);
                                    const imgSrc = p.imagem_url?.startsWith('http')? p.imagem_url : `${API_BASE}${p.imagem_url}`;

                                    return (
                                        <div
                                            key={p.id}
                                            className={`overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group ${!p.is_active? 'opacity-50' : ''}
                                            w-[100vw] snap-center shrink-0
                                            sm:w-auto`} // 100% DA TELA NO MOBILE
                                            style={{
                                                backgroundColor: 'var(--cor-fundo-card, #18181b)',
                                                border: '1px solid var(--cor-primaria)', // BORDA AGORA AQUI
                                                borderRadius: 'var(--radius)',
                                                boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            {/* IMAGEM */}
                                            <div className="relative w-full h-52 overflow-hidden" style={{ backgroundColor: 'var(--cor-fundo)' }}>
                                                {p.imagem_url? (
                                                    <img src={imgSrc} alt={p.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center"><ImageOff size={36} style={{ color: 'var(--cor-primaria)', opacity: 0.3 }} /></div>
                                                )}

                                                {/* BADGES TOPO */}
                                                <div className="absolute top-3 right-3 flex gap-2">
                                                    <button
                                                        onClick={() => setQrProduto(p)}
                                                        className="backdrop-blur-md p-2 rounded-xl hover:scale-110 transition-all"
                                                        title="Ver QR Code"
                                                        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                                                    >
                                                        <QrCode size={18} className="text-white" />
                                                    </button>
                                                    {!p.is_active && (<Badge className="text-xs h-7 px-3 font-semibold" style={{ backgroundColor: '#ef4444' }}>Inativo</Badge>)}
                                                </div>
                                            </div>

                                            {/* CONTEUDO */}
                                            <div className="p-4 flex-col flex-1">
                                                <h4 className="font-bold text-base mb-1.5 truncate" style={{ color: 'var(--cor-texto)' }}>
                                                    {p.nome}
                                                </h4>
                                                <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: 'var(--cor-texto-sec)' }}>
                                                    <Tag size={12} /> {p.sku || 'N/A'}
                                                </div>

                                                <div className="space-y-2.5 text-sm flex-1 mb-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Preço</span>
                                                        <span className="font-bold text-lg" style={{ color: 'var(--cor-primaria)' }}>{formatCurrency(preco)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Estoque</span>
                                                        <div className="flex items-center gap-1.5 font-bold" style={{ color: status.color }}>
                                                            {status.icon}
                                                            <span>{p.estoque} {p.unidade}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* TAG STATUS */}
                                                <div
                                                    className="mb-4 px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 w-fit rounded-lg"
                                                    style={{
                                                        backgroundColor: status.bg,
                                                        border: `1px solid ${status.border}`,
                                                        color: status.color
                                                    }}
                                                >
                                                    {status.icon} {status.label}
                                                </div>

                                                {/* BOTOES */}
                                                {isAdmin && (
                                                    <div className="flex gap-2 mt-auto pt-3 border-t" style={{ borderColor: 'var(--cor-primaria)30' }}>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => onEdit(p)}
                                                            className="flex-1 h-10 font-semibold"
                                                            style={{ backgroundColor: 'var(--cor-primaria)', color: '#fff', borderRadius: 'var(--radius)' }}
                                                        >
                                                            <Edit size={14} /> Editar
                                                        </Button>
                                                        {isDono && (
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => onDelete(p)}
                                                                className="h-10 px-3"
                                                                style={{ backgroundColor: '#ef4444', color: '#fff', borderRadius: 'var(--radius)' }}
                                                            >
                                                                <Trash2 size={14} />
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
                <DialogContent
                    className="border-0 max-w-sm w-full p-0 overflow-hidden flex-col h-[80dvh] [&>button]:hidden"
                    style={{ backgroundColor: 'var(--cor-fundo)' }}
                >
                    <div className="flex items-center justify-between p-4 shrink-0">
                        <button onClick={() => setQrProduto(null)} className="p-2 hover:bg-neutral-900 rounded-full transition" style={{ color: 'var(--cor-texto)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                        <DialogTitle className="text-base font-semibold" style={{ color: 'var(--cor-texto)' }}>Código QR</DialogTitle>
                        <button onClick={() => handleDownloadQR(qrProduto)} className="p-2 hover:bg-neutral-900 rounded-full transition" style={{ color: 'var(--cor-texto)' }}>
                            <Download size={20} />
                        </button>
                    </div>

                    <div className="px-4 pb-6 overflow-y-auto scrollbar-hide flex-1 flex-col items-center min-h-0">
                        <div
                            className="w-full p-6 flex-col items-center justify-center gap-5 text-center"
                            style={{ backgroundColor: 'var(--cor-fundo-card, #171717)', borderRadius: 'var(--radius)' }}
                        >
                            {qrProduto?.imagem_url && (
                                <img
                                    src={qrProduto.imagem_url.startsWith('http')? qrProduto.imagem_url : `${API_BASE}${qrProduto.imagem_url}`}
                                    alt={qrProduto.nome}
                                    className="w-16 h-16 rounded-full object-cover border-2 mx-auto"
                                    style={{ borderColor: 'var(--cor-primaria)30' }}
                                />
                            )}

                            <div className="space-y-1 w-full">
                                <p className="font-bold text-xl" style={{ color: 'var(--cor-texto)' }}>{qrProduto?.nome}</p>
                                <p className="text-sm" style={{ color: 'var(--cor-texto-sec)' }}>SKU: {qrProduto?.sku || 'N/A'}</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl shadow-2xl w-full max-w-[280px] mx-auto">
                                <QRCodeSVG
                                    id={`qr-${qrProduto?.id}`}
                                    value={`${APP_URL}/p/${qrProduto?.sku || qrProduto?.id}`}
                                    size={256}
                                    level="H"
                                    fgColor="#000"
                                    bgColor="#FFFFFF"
                                    className="w-full h-auto"
                                />
                            </div>
                        </div>

                        <p className="text-center text-sm mt-6 px-4 leading-relaxed max-w-xs">
                            Este é o QR do seu produto. Qualquer pessoa pode escanear para ver a página e comprar direto.
                            <span className="font-medium" style={{ color: 'var(--cor-primaria)' }}> Manter em segurança</span>
                        </p>

                        <div className="mt-6 space-y-3 w-full max-w-sm">
                            <Button
                                onClick={() => handleDownloadQR(qrProduto)}
                                className="w-full h-12 font-bold text-base flex items-center justify-center gap-2"
                                style={{ backgroundColor: 'var(--cor-primaria)', color: '#fff', borderRadius: 'var(--radius)' }}
                            >
                                <Download size={18} /> Baixar QR Code
                            </Button>

                            <button
                                onClick={() => toast.info("Função em breve")}
                                className="font-semibold text-sm w-full text-center hover:underline"
                                style={{ color: 'var(--cor-primaria)' }}
                            >
                                Gerar novo código
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </>
    )
}
