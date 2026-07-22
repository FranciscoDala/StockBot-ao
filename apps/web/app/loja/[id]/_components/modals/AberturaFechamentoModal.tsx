"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Unlock } from "lucide-react";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const focusStyle = { outline: 'none', boxShadow: '0 0 0 3px var(--cor-primaria)30' }

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSave: () => void;
    token: string;
    lojaId: string;
    statusAtual?: 'aberto' | 'fechado'
}

export function AberturaFechamentoModal({ open, onOpenChange, onSave, token, lojaId, statusAtual }: Props) {
    const [saldoInicial, setSaldoInicial] = useState('');
    const [saldoContado, setSaldoContado] = useState('');
    const [loading, setLoading] = useState(false);
    const isAbrir = statusAtual!== 'aberto';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!API_URL) return;
        setLoading(true);
        try {
            const endpoint = isAbrir? '/caixa/abrir' : '/caixa/fechar';
            const body = isAbrir? { loja_id: lojaId, saldo_abertura: Number(saldoInicial) } : { loja_id: lojaId, saldo_contado: Number(saldoContado) }
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error("Erro na operação de caixa");
            setSaldoInicial(''); setSaldoContado('');
            onSave();
        } catch (error) { console.error(error); alert("Erro ao processar caixa"); }
        finally { setLoading(false); }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-full max-w-full sm:max-w-[500px] p-0 flex-col border shadow-2xl [&>button]:hidden"
                style={{ backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', borderColor: 'var(--cor-borda)', borderRadius: 'var(--radius)' }}
                onInteractOutside={(e) => e.preventDefault()} // <- TRAVA
                onEscapeKeyDown={(e) => e.preventDefault()} // <- TRAVA
            >
                <form onSubmit={handleSubmit} className="flex flex-col">
                    <DialogHeader className="p-4 sm:p-6 pb-0 shrink-0">
                        <DialogTitle className="text-base sm:text-lg flex items-center gap-2" style={{ color: 'var(--cor-texto)' }}>
                            {isAbrir? <Unlock size={18} style={{ color: '#22c55e' }} /> : <Lock size={18} style={{ color: '#ef4444' }} />}
                            {isAbrir? 'Abrir Caixa' : 'Fechar Caixa'}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>
                            {isAbrir? 'Informe o valor inicial em dinheiro no caixa.' : 'Conte o dinheiro e informe o total para fechar.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 px-4 sm:px-6">
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
                                placeholder="0,00" required
                            />
                        </div>
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
