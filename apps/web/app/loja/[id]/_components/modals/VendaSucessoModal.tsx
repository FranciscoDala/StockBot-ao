"use client";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { CheckCircle, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReciboTermico } from "../venda/ReciboTermico";

interface VendaSucessoModalProps {
    open: boolean;
    onClose: () => void;
    venda: any;
    formatCurrency: (v: number) => string;
    loja_nome?: string
    loja_nif?: string
    loja_endereco?: string
    loja_telefone?: string
    loja_logo?: string
}

export function VendaSucessoModal({
    open,
    onClose,
    venda,
    formatCurrency,
    loja_nome = "MINHA LOJA",
    loja_nif = "",
    loja_endereco = "",
    loja_telefone = "",
    loja_logo = ""
}: VendaSucessoModalProps) {
    const componentRef = useRef<HTMLDivElement>(null);

    const handleImprimir = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Recibo-${venda?.id}`,
        onAfterPrint: () => onClose()
    });

    if (!open || !venda) return null;

    const totalItens = venda.total_itens ?? venda.itens?.reduce((acc: number, i: any) => acc + (i.quantidade || i.qtd), 0) ?? 0;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div
                    className="bg-neutral-950 border-neutral-800 text-white max-w-md w-full mx-4 shadow-2xl"
                    style={{borderRadius: 'var(--radius)'}}
                >
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2
                                className="flex items-center gap-2 text-xl font-bold"
                                style={{color: 'var(--cor-primaria)'}}
                            >
                                <CheckCircle size={24} />
                                Venda Concluída!
                            </h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-3 py-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-400">Total da Venda</p>
                                <p
                                    className="text-3xl font-bold"
                                    style={{color: 'var(--cor-primaria)'}}
                                >
                                    {formatCurrency(Number(venda.total) || 0)}
                                </p>
                            </div>

                            <div
                                className="p-3 space-y-1 text-sm border"
                                style={{
                                    backgroundColor: '#171717',
                                    borderColor: '#27272a',
                                    borderRadius: 'var(--radius)'
                                }}
                            >
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Itens</span>
                                    <span className="font-semibold">{totalItens}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Pagamento</span>
                                    <span className="font-semibold">{venda.forma_pagamento}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 border-neutral-700 hover:bg-neutral-800"
                                style={{borderRadius: 'var(--radius)'}}
                            >
                                Nova Venda
                            </Button>
                            <Button
                                onClick={handleImprimir}
                                className="btn-primary flex-1 gap-2"
                            >
                                <Printer size={16} /> Imprimir
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RECIBO ESCONDIDO PRA IMPRESSORA */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <ReciboTermico
                    ref={componentRef}
                    loja_nome={loja_nome}
                    loja_nif={loja_nif}
                    loja_endereco={loja_endereco}
                    loja_telefone={loja_telefone}
                    loja_logo={loja_logo}
                    venda_id={venda.id}
                    data={new Date().toLocaleString('pt-AO')}
                    itens={venda.itens}
                    total={Number(venda.total) || 0}
                    forma_pagamento={venda.forma_pagamento}
                    formatCurrency={formatCurrency}
                />
            </div>
        </>
    )
}
