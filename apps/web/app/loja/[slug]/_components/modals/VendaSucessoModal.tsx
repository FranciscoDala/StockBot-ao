"use client";
import { CheckCircle, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VendaSucessoModalProps {
    open: boolean;
    onClose: () => void;
    venda: any;
    formatCurrency: (v: number) => string;
}

export function VendaSucessoModal({ open, onClose, venda, formatCurrency }: VendaSucessoModalProps) {
    if (!open || !venda) return null; // <- Se não for true, nem renderiza

    const handleImprimir = () => {
        window.print();
        onClose();
    }

    return (
        <div className="fixed inset-0 z- z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-neutral-950 border-neutral-800 text-white max-w-md w-full mx-4 rounded-xl shadow-2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="flex items-center gap-2 text-green-500 text-xl font-bold">
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
                            <p className="text-3xl font-bold text-green-400">{formatCurrency(Number(venda.total))}</p>
                        </div>

                        <div className="bg-neutral-900 rounded-lg p-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Itens</span>
                                <span className="font-semibold">{venda.total_itens}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Pagamento</span>
                                <span className="font-semibold">{venda.forma_pagamento}</span>
                            </div>
                            {venda.forma_pagamento === "Dinheiro" && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Recebido</span>
                                        <span className="font-semibold">{formatCurrency(Number(venda.valor_recebido))}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Troco</span>
                                        <span className="font-semibold text-amber-400">{formatCurrency(Number(venda.troco))}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={onClose} className="flex-1 border-neutral-700 hover:bg-neutral-800">
                            Nova Venda
                        </Button>
                        <Button onClick={handleImprimir} className="flex-1 bg-green-600 hover:bg-green-700 gap-2">
                            <Printer size={16} /> Imprimir
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
