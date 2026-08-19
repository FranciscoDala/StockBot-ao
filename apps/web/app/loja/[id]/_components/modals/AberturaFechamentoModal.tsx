"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Unlock, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { formatCurrency } from "../utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const focusStyle = { outline: 'none', boxShadow: '0 0 0 3px var(--cor-primaria)30' }

// PADRÃO PRA NUMERICO
const numberInputProps = {
    type: "text",
    inputMode: "decimal" as const,
    pattern: "[0-9]*[.,]?[0-9]*",
    step: "0.01"
}

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSave: () => void;
    token: string;
    lojaId: string;
    statusAtual?: 'aberto' | 'fechado'
    valorEsperado?: number
    caixaId?: string
}

export function AberturaFechamentoModal({ open, onOpenChange, onSave, token, lojaId, statusAtual, valorEsperado = 0, caixaId }: Props) {
    const [saldoInicial, setSaldoInicial] = useState('');
    const [saldoContado, setSaldoContado] = useState('');
    const [loading, setLoading] = useState(false);
    const isAbrir = statusAtual!== 'aberto';

    const diferenca = Number(saldoContado.replace(',', '.') || 0) - Number(valorEsperado || 0);

    const handleNumberChange = (val: string, setter: (v: string) => void) => {
        setter(val.replace(/[^0-9.,]/g, ''))
    }

    useEffect(() => {
        if (!open) {
            setSaldoInicial('');
            setSaldoContado('');
        }
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!API_URL ||!token) return;
        setLoading(true);
        try {
            if (isAbrir) {
                const res = await fetch(`${API_URL}/caixas/abrir`, {
                    method: 'POST',
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ loja_id: lojaId, saldo_abertura: Number(saldoInicial.replace(',', '.')) })
                });
                if (!res.ok) throw new Error((await res.json()).detail || "Erro ao abrir caixa");
            } else {
                if (!caixaId) throw new Error("Nenhum caixa aberto para fechar");
                const res = await fetch(`${API_URL}/caixas/fechar/${caixaId}`, {
                    method: 'POST',
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ saldo_contado: Number(saldoContado.replace(',', '.')) })
                });
                if (!res.ok) throw new Error((await res.json()).detail || "Erro ao fechar caixa");
            }
            onSave();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Erro ao processar caixa");
        }
        finally { setLoading(false); }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-[calc(100%-2rem)] max-w-[420px] p-0 flex-col border shadow-2xl overflow-hidden [&>button]:hidden"
                style={{ backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', borderColor: 'var(--cor-borda)', borderRadius: 'var(--radius)', maxHeight: '85vh' }}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <DialogHeader className="p-5 pb-3 shrink-0">
                        <DialogTitle className="text-lg font-bold flex items-center justify-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                            {isAbrir? <Unlock size={24} style={{ color: '#22c55e' }} /> : <Lock size={24} style={{ color: '#ef4444' }} />}
                            {isAbrir? 'Abrir Caixa' : 'Fechar Caixa'}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-center mt-1" style={{ color: 'var(--cor-texto-sec)' }}>
                            {isAbrir? 'Informe o valor inicial em dinheiro no caixa.' : 'Conte o dinheiro e informe o total para conferir.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 px-5 overflow-y-auto flex-1 min-h-0">
                        {!isAbrir && (
                            <div className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'color-mix(in srgb, var(--cor-info) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--cor-info) 30%, transparent)' }}>
                                <div className="flex items-center gap-2">
                                    <Wallet size={16} style={{ color: 'var(--cor-info)' }} />
                                    <p className="text-xs font-medium" style={{ color: 'var(--cor-texto-sec)' }}>Valor Esperado</p>
                                </div>
                                <p className="text-sm font-bold" style={{ color: 'var(--cor-info)' }}>{formatCurrency(valorEsperado)}</p>
                            </div>
                        )}

                        <div className="grid gap-1.5">
                            <Label className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>
                                {isAbrir? 'Saldo Inicial *' : 'Saldo Contado *'}
                            </Label>
                            <Input
                                {...numberInputProps}
                                value={isAbrir? saldoInicial : saldoContado}
                                onChange={e => handleNumberChange(e.target.value, isAbrir? setSaldoInicial : setSaldoContado)}
                                className="text-sm h-10 w-full"
                                style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }}
                                placeholder="0,00" required autoFocus
                            />
                        </div>

                        {!isAbrir && saldoContado && (
                            <div className="grid gap-1.5">
                                <Label className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>
                                    Diferença
                                </Label>
                                <p className={`text-sm font-bold ${diferenca === 0? 'text-[var(--cor-sucesso)]' : diferenca > 0? 'text-[var(--cor-info)]' : 'text-[var(--cor-erro)]'}`}>
                                    {diferenca > 0? '+' : ''}{formatCurrency(diferenca)}
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-4 border-t shrink-0 flex-col sm:flex-row gap-2" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)' }}> {/* <- AJUSTADO */}
                        <Button
                          type="submit"
                          disabled={loading}
                          className="gap-2 text-sm w-full sm:flex-1 h-10 font-bold" // <- AJUSTADO
                          style={{ background: isAbrir? '#22c55e' : '#ef4444', color: '#fff', borderRadius: 'var(--radius)' }}
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />} {isAbrir? 'Abrir Caixa' : 'Fechar Caixa'}
                        </Button>
                        <DialogClose asChild>
                            <Button
                              type="button"
                              className="text-sm w-full sm:flex-1 h-10 font-semibold" // <- AJUSTADO
                              style={{ backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--radius)' }}
                            >
                                Cancelar
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
