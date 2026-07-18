"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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

    const focusStyle = { outline: 'none', boxShadow: '0 0 0 3px var(--cor-primaria)30' } // 1. ajustado

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                className="sm:max-w-[425px] p-0 shadow-2xl border [&>button]:hidden"
                style={{
                    backgroundColor: 'var(--cor-card)', // 2. trocado
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)', // 3. trocado
                    borderRadius: 'var(--radius)'
                }}
            >
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center gap-3">
                        <ShieldCheck size={24} style={{color: 'var(--cor-primaria)'}} />
                        <DialogTitle className="text-lg font-bold" style={{color: 'var(--cor-texto)'}}>{titulo}</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm pt-2" style={{color: 'var(--cor-texto-sec)'}}>
                        Esta é uma ação sensível. Para continuar, confirme com a senha do proprietário da loja.
                    </DialogDescription>
                </DialogHeader>
                <div className="px-6 pb-4">
                    <div className="grid gap-2">
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
                            className="h-10"
                            style={{
                                backgroundColor: 'var(--cor-fundo)', // 4. trocado
                                color: 'var(--cor-texto)',
                                border: '1.5px solid var(--cor-primaria)', // 5. borda primary obrigatoria
                                borderRadius: 'var(--radius-sm)', // 6. trocado
                              ...focusStyle
                            }}
                            autoFocus
                            disabled={loading}
                        />
                    </div>
                </div>
                <DialogFooter
                    className="p-4 border-t flex-row justify-end gap-2"
                    style={{
                        backgroundColor: 'var(--cor-card)', // 7. trocado
                        borderColor: 'var(--cor-borda)' // 8. trocado
                    }}
                >
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                        className="font-semibold"
                        style={{
                            backgroundColor: 'var(--cor-card)', // 9. trocado
                            color: 'var(--cor-texto)',
                            border: '1px solid var(--cor-borda)', // 10. trocado
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading ||!senha}
                        className="gap-2 font-bold"
                        style={{
                            background: 'var(--cor-primaria)',
                            color: '#fff',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Confirmar Ação
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
