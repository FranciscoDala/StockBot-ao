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

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSave: () => void;
    token: string;
    lojaId: string;
    statusAtual?: 'aberto' | 'fechado'
    valorEsperado?: number
}

export function AberturaFechamentoModal({ open, onOpenChange, onSave, token, lojaId, statusAtual, valorEsperado = 0 }: Props) {
    const [saldoInicial, setSaldoInicial] = useState('');
    const [saldoContado, setSaldoContado] = useState('');
    const [loading, setLoading] = useState(false);
    const isAbrir = statusAtual!== 'aberto';

    const diferenca = Number(saldoContado || 0) - Number(valorEsperado || 0); // <- garante number

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
                const res = await fetch(`${API_URL}/caixa/abrir`, {
                    method: 'POST',
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ loja_id: lojaId, saldo_abertura: Number(saldoInicial) })
                });
                if (!res.ok) throw new Error((await res.json()).detail || "Erro ao abrir caixa");
            } else {
                const resumoRes = await fetch(`${API_URL}/caixas/resumo?loja_id=${lojaId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (!resumoRes.ok) throw new Error("Erro ao buscar caixa aberto");
                const resumo = await resumoRes.json();

                if (!resumo.id) throw new Error("Nenhum caixa aberto para fechar");

                const res = await fetch(`${API_URL}/caixa/fechar/${resumo.id}`, {
                    method: 'POST',
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ saldo_contado: Number(saldoContado) })
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
                className="w-full max-w-full sm:max-w-[500px] p-0 flex-col border shadow-2xl [&>button]:hidden"
                style={{ backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', borderColor: 'var(--cor-borda)', borderRadius: 'var(--radius)' }}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col">
                    <DialogHeader className="p-4 sm:p-6 pb-0 shrink-0">
                        <DialogTitle className="text-base sm:text-lg flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                            {isAbrir? <Unlock size={18} style={{ color: '#22c55e' }} /> : <Lock size={18} style={{ color: '#ef4444' }} />}
                            {isAbrir? 'Abrir Caixa' : 'Fechar Caixa'}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>
                            {isAbrir? 'Informe o valor inicial em dinheiro no caixa.' : 'Conte o dinheiro e informe o total para conferir.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 px-4 sm:px-6">
                        {!isAbrir && ( // <- SÓ MOSTRA SE FOR FECHAR
                            <div className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'color-mix(in srgb, var(--cor-info) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--cor-info) 30%, transparent)' }}>
                                <div className="flex items-center gap-2">
                                    <Wallet size={16} style={{ color: 'var(--cor-info)' }} />
                                    <p className="text-xs font-medium" style={{ color: 'var(--cor-texto-sec)' }}>Valor Esperado</p>
                                </div>
                                <p className="text-sm font-bold" style={{ color: 'var(--cor-info)' }}>{formatCurrency(valorEsperado)}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>
                                {isAbrir? 'Saldo Inicial *' : 'Saldo Contado *'}
                            </Label>
                            <Input
                                type="number" step="0.01"
                                value={isAbrir? saldoInicial : saldoContado}
                                onChange={e => isAbrir? setSaldoInicial(e.target.value) : setSaldoContado(e.target.value)}
                                className="sm:col-span-3 text-xs h-9"
                                style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }}
                                placeholder="0,00" required autoFocus
                            />
                        </div>

                        {!isAbrir && saldoContado && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                                <Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>
                                    Diferença
                                </Label>
                                <p className={`sm:col-span-3 text-sm font-bold ${diferenca === 0? 'text-[var(--cor-sucesso)]' : diferenca > 0? 'text-[var(--cor-info)]' : 'text-[var(--cor-erro)]'}`}>
                                    {diferenca > 0? '+' : ''}{formatCurrency(diferenca)}
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-4 sm:p-6 pt-4 border-t shrink-0 flex-row gap-2" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)' }}>
                        <DialogClose asChild>
                            <Button type="button" className="text-xs flex-1 sm:flex-initial font-semibold" style={{ backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--radius)' }}>
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={loading} className="gap-2 text-xs flex-1 sm:flex-initial font-bold" style={{ background: isAbrir? '#22c55e' : '#ef4444', color: '#fff', borderRadius: 'var(--radius)' }}>
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />} {isAbrir? 'Abrir Caixa' : 'Fechar Caixa'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
