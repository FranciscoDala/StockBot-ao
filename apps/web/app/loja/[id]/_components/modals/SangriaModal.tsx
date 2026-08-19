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
        if (!valor || valorNumerico <= 0 ||!descricao) return;
        if (!API_URL) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/caixas/sangria`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    loja_id: lojaId,
                    valor: valorNumerico,
                    descricao
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
                className="w-[calc(100%-2rem)] max-w-[420px] p-0 flex-col border shadow-2xl overflow-hidden [&>button]:hidden" // <- PADRAO
                style={{ backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', borderColor: 'var(--cor-borda)', borderRadius: 'var(--radius)', maxHeight: '85vh' }}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <DialogHeader className="p-5 pb-3 shrink-0">
                        <DialogTitle className="text-lg font-bold text-center flex items-center justify-center gap-2" style={{ color: 'var(--cor-texto)' }}> {/* <- CENTRALIZADO */}
                            <Minus size={20} style={{ color: '#f97316' }} /> Fazer Sangria
                        </DialogTitle>
                        <DialogDescription className="text-sm text-center mt-1" style={{ color: 'var(--cor-texto-sec)' }}>
                            Retire dinheiro do caixa. Essa ação será registrada.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 px-5 overflow-y-auto flex-1 min-h-0">
                        <div className="grid gap-1.5"> {/* <- 1 COLUNA */}
                            <Label className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Valor *</Label>
                            <Input
                                {...numberInputProps}
                                value={valor}
                                onChange={e => handleNumberChange(e.target.value)}
                                className="text-sm h-10 w-full" // <- h-10 w-full
                                style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }}
                                placeholder="0,00" required autoFocus
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Motivo *</Label>
                            <Textarea
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                className="text-sm w-full" // <- text-sm w-full
                                style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }}
                                placeholder="Ex: Pagamento fornecedor" rows={3} required
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t shrink-0 flex flex-col gap-2" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)' }}> {/* <- BOTOES EMPILHADOS */}
                        <Button type="submit" disabled={loading} className="gap-2 text-sm w-full h-10 font-bold" style={{ background: '#f97316', color: '#fff', borderRadius: 'var(--radius)' }}>
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Confirmar Sangria
                        </Button>
                        <DialogClose asChild>
                            <Button type="button" className="text-sm w-full h-10 font-semibold" style={{ backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--radius)' }}>
                                Cancelar
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
