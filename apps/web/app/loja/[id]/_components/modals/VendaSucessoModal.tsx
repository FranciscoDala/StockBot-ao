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

    if (!open ||!venda) return null;

    const totalItens = venda.total_itens?? venda.itens?.reduce((acc: number, i: any) => acc + (i.quantidade || i.qtd), 0)?? 0;

    return (
        <>
            {/* AJUSTE 1 e 2: padrão das outras modals com respiro + centralizado */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" style={{backgroundColor: 'rgba(0,0,0,0.8)'}}>
                <div
                    // overflow-hidden + max-w + mx-auto igual DialogContent
                    className="border shadow-2xl max-w-[420px] w-[calc(100%-2rem)] mx-auto overflow-hidden flex flex-col"
                    style={{
                        backgroundColor: 'var(--cor-card)',
                        color: 'var(--cor-texto)',
                        borderColor: 'var(--cor-sucesso)',
                        borderRadius: 'var(--radius)',
                        maxHeight: '85vh'
                    }}
                >
                    {/* AJUSTE 4: text-left no header */}
                    <div className="p-5 pb-3 shrink-0 text-left border-b" style={{borderColor: 'var(--cor-borda)'}}>
                        <div className="flex items-center justify-between">
                            <h2
                                className="flex items-center gap-2 text-lg font-bold"
                                style={{color: 'var(--cor-sucesso)'}}
                            >
                                <CheckCircle size={24} />
                                Venda Concluída!
                            </h2>
                            <button onClick={onClose} className="hover:opacity-70" style={{color: 'var(--cor-texto-sec)'}}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4">
                        <div className="text-center">
                            <p className="text-sm" style={{color: 'var(--cor-texto-sec)'}}>Total da Venda</p>
                            <p
                                className="text-3xl font-bold"
                                style={{color: 'var(--cor-sucesso)'}}
                            >
                                {formatCurrency(Number(venda.total) || 0)}
                            </p>
                        </div>

                        <div
                            className="p-3 space-y-1 text-sm border"
                            style={{
                                backgroundColor: 'var(--cor-fundo)',
                                borderColor: 'var(--cor-sucesso)30',
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

                    {/* AJUSTE: footer padrão flex-col sm:flex-row */}
                    <div className="p-4 border-t shrink-0 flex flex-col sm:flex-row gap-2" style={{backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)'}}>
                        <Button
                            onClick={onClose}
                            className="w-full sm:flex-1 font-semibold h-10 text-sm"
                            style={{
                                backgroundColor: 'var(--cor-card)',
                                color: 'var(--cor-texto)',
                                border: '1px solid var(--cor-borda)',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            Nova Venda
                        </Button>
                        <Button
                            onClick={handleImprimir}
                            className="w-full sm:flex-1 gap-2 font-bold h-10 text-sm"
                            style={{
                                background: 'var(--cor-sucesso)',
                                color: '#fff',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            <Printer size={16} /> Imprimir
                        </Button>
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
