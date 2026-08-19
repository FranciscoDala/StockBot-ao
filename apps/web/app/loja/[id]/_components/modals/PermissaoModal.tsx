"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, KeyRound } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: (senha: string) => void;
    titulo: string;
    loading: boolean;
}

export function PermissaoModal({ open, onClose, onConfirm, titulo, loading }: Props) {
    const [senha, setSenha] = useState("");

    useEffect(() => {
        if (!open) setSenha("");
    }, [open]);

    const handleSubmit = () => {
        if(!senha.trim()) return;
        onConfirm(senha);
    }

    const focusStyle = { outline: 'none', boxShadow: '0 0 0 3px var(--cor-primaria)30' }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                className="w-[calc(100%-2rem)] max-w-[420px] p-0 flex flex-col border shadow-2xl overflow-hidden [&>button]:hidden"
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: 'var(--radius)',
                    maxHeight: '85vh'
                }}
            >
                <DialogHeader className="p-5 pb-3 shrink-0">
                    <div className="flex items-center justify-center gap-3">
                        <ShieldCheck size={24} style={{color: 'var(--cor-primaria)'}} />
                        <DialogTitle className="text-lg font-bold" style={{color: 'var(--cor-texto)'}}>{titulo}</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm text-center mt-1" style={{color: 'var(--cor-texto-sec)'}}>
                        Esta é uma ação sensível. Para continuar, confirme com a senha do proprietário da loja.
                    </DialogDescription>
                </DialogHeader>
                <div className="px-5 pb-4 flex-1">
                    <div className="grid gap-1.5">
                        <Label htmlFor="senha" className="flex items-center gap-2 text-xs" style={{color: 'var(--cor-texto-sec)'}}>
                            <KeyRound size={14}/> Senha do Proprietário
                        </Label>
                        <Input
                            id="senha"
                            type="password"
                            placeholder="Digite a senha para confirmar"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            className="h-10 w-full text-sm"
                            style={{
                                backgroundColor: 'var(--cor-fundo)',
                                color: 'var(--cor-texto)',
                                border: '1.5px solid var(--cor-primaria)',
                                borderRadius: 'var(--radius-sm)',
                           ...focusStyle
                            }}
                            autoFocus
                            disabled={loading}
                        />
                    </div>
                </div>
                <DialogFooter
                    className="p-4 border-t shrink-0 flex-col sm:flex-row gap-2" // <- AJUSTADO
                    style={{
                        backgroundColor: 'var(--cor-card)',
                        borderColor: 'var(--cor-borda)'
                    }}
                >
                    <Button
                        onClick={handleSubmit}
                        disabled={loading ||!senha}
                        className="gap-2 font-bold w-full sm:flex-1 h-10 text-sm whitespace-nowrap" // <- AJUSTADO
                        style={{
                            background: 'var(--cor-primaria)',
                            color: '#fff',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Confirmar Ação
                    </Button>
                    <DialogClose asChild>
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                            className="font-semibold w-full sm:flex-1 h-10 text-sm" // <- AJUSTADO
                            style={{
                                backgroundColor: 'var(--cor-card)',
                                color: 'var(--cor-texto)',
                                border: '1px solid var(--cor-borda)',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            Cancelar
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
