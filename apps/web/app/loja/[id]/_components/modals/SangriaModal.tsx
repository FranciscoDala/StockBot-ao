"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Minus } from "lucide-react";
import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const focusStyle = { outline: 'none', boxShadow: '0 0 0 3px var(--cor-primaria)30' }

// PADRÃO NUMERICO REUTILIZAVEL
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
}

export function SangriaModal({ open, onOpenChange, onSave, token, lojaId }: Props) {
    const [valor, setValor] = useState('');
    const [descricao, setDescricao] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            setValor('');
            setDescricao('');
        }
    }, [open])

    const handleNumberChange = (val: string) => {
        setValor(val.replace(/[^0-9.,]/g, '')) // só número,. e,
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const valorNumerico = Number(valor.replace(',', '.'));
        if (!valor || valorNumerico <= 0 || !descricao) return;
        if (!API_URL) return;
        setLoading(true);
        try {
            // 1. REMOVE essa busca do caixa. Não precisa mais

            // 2. Faz a sangria direto passando loja_id
            const res = await fetch(`${API_URL}/caixas/sangria`, { // <- CORRIGIDO: caixas com S
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    loja_id: lojaId, // <- CORRIGIDO: é loja_id e não caixa_id
                    valor: valorNumerico,
                    descricao
                    // <- REMOVE tipo. Sua rota não pede
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Erro ao fazer sangria");
            }
            onSave();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Erro ao registrar sangria");
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
                            <Minus size={18} style={{ color: '#f97316' }} /> Fazer Sangria
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>
                            Retire dinheiro do caixa. Essa ação será registrada.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 px-4 sm:px-6">
                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Valor *</Label>
                            <Input
                                {...numberInputProps} // <- TECLADO NUMERICO
                                value={valor}
                                onChange={e => handleNumberChange(e.target.value)}
                                className="sm:col-span-3 text-xs h-9"
                                style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)', ...focusStyle }}
                                placeholder="0,00" required autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Motivo *</Label>
                            <Textarea
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                className="sm:col-span-3 text-xs"
                                style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)', ...focusStyle }}
                                placeholder="Ex: Pagamento fornecedor" rows={3} required
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-4 sm:p-6 pt-4 border-t shrink-0 flex-row gap-2" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)' }}>
                        <DialogClose asChild>
                            <Button type="button" className="text-xs flex-1 sm:flex-initial font-semibold" style={{ backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--radius)' }}>
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={loading} className="gap-2 text-xs flex-1 sm:flex-initial font-bold" style={{ background: '#f97316', color: '#fff', borderRadius: 'var(--radius)' }}>
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Confirmar Sangria
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
