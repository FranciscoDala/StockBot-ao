"use client";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { CheckCircle, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReciboTermico } from "../venda/ReciboTermico";
import { formatCurrency } from "../utils";

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
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{backgroundColor: 'rgba(0,0,0,0.8)'}}>
                <div
                    className="border shadow-2xl max-w-md w-full mx-4"
                    style={{
                        backgroundColor: 'var(--cor-fundo-card, #171717)',
                        color: 'var(--cor-texto)',
                        borderColor: 'var(--cor-primaria)30',
                        borderRadius: 'var(--radius)'
                    }}
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
                            <button onClick={onClose} className="hover:opacity-70" style={{color: 'var(--cor-texto-sec)'}}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-3 py-4">
                            <div className="text-center">
                                <p className="text-sm" style={{color: 'var(--cor-texto-sec)'}}>Total da Venda</p>
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
                                    backgroundColor: 'var(--cor-fundo)',
                                    borderColor: 'var(--cor-primaria)30',
                                    borderRadius: 'var(--radius)'
                                }}
                            >
                                <div className="flex justify-between">
                                    <span style={{color: 'var(--cor-texto-sec)'}}>Itens</span>
                                    <span className="font-semibold">{totalItens}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{color: 'var(--cor-texto-sec)'}}>Pagamento</span>
                                    <span className="font-semibold">{venda.forma_pagamento}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                onClick={onClose}
                                className="flex-1 font-semibold"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)',
                                    color: 'var(--cor-texto)',
                                    border: '1px solid var(--cor-primaria)30',
                                    borderRadius: 'var(--radius)'
                                }}
                            >
                                Nova Venda
                            </Button>
                            <Button
                                onClick={handleImprimir}
                                className="flex-1 gap-2 font-bold"
                                style={{
                                    background: 'var(--cor-primaria)',
                                    color: '#fff',
                                    borderRadius: 'var(--radius)'
                                }}
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
