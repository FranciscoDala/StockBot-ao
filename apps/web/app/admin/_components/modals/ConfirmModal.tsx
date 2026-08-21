"use client";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldAlert } from "lucide-react";

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    adminSenha: string;
    setAdminSenha: (v: string) => void;
    onConfirm: () => void;
    saving: boolean;
}

export function ConfirmModal({ open, onOpenChange, adminSenha, setAdminSenha, onConfirm, saving }: Props) {

    useEffect(() => {
        if (!open) setAdminSenha("");
    }, [open, setAdminSenha]);

    const handleConfirm = () => {
        if (adminSenha.length < 4) return;
        onConfirm();
    }

    const handleClose = () => {
        setAdminSenha("");
        onOpenChange(false);
    }

    const focusStyle = { outline: 'none', boxShadow: '0 0 0 3px var(--cor-primaria)30' }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                // AJUSTE 1: largura com respiro + centralizada
                className="w-[95vw] max-w-[420px] p-0 flex-col border shadow-2xl overflow-hidden [&>button]:hidden mx-auto"
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: 'var(--radius)',
                    maxHeight: '85vh'
                }}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                {/* AJUSTE 2: header text-left + padding igual */}
                <DialogHeader className="p-5 pb-3 shrink-0 text-left">
                    <div className="flex items-center gap-3">
                        <ShieldAlert size={24} style={{color: 'var(--cor-primaria)'}} className="shrink-0" />
                        <DialogTitle className="text-lg font-bold" style={{color: 'var(--cor-texto)'}}>
                            Confirmar Alterações
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm mt-1" style={{color: 'var(--cor-texto-sec)'}}>
                        Para salvar as alterações, digita a tua senha de ADMIN.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-5 pb-2">
                    <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                        <Label htmlFor="senha-admin" className="text-xs sm:text-right sm:justify-self-end" style={{color: 'var(--cor-texto-sec)'}}>Senha ADMIN *</Label>
                        <Input
                            id="senha-admin"
                            type="password"
                            value={adminSenha}
                            onChange={(e) => setAdminSenha(e.target.value)}
                            className="sm:col-span-3 h-10 text-sm"
                            style={{
                                backgroundColor: 'var(--cor-fundo)',
                                color: 'var(--cor-texto)',
                                border: '1.5px solid var(--cor-primaria)',
                                borderRadius: 'var(--radius-sm)',
                            ...focusStyle
                            }}
                            placeholder="******"
                            disabled={saving}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                        />
                    </div>
                </div>

                {/* AJUSTE 3: Footer igual a outra modal */}
                <DialogFooter
                    className="p-4 sm:p-6 pt-4 border-t shrink-0 flex-col sm:flex-row gap-2"
                    style={{
                        backgroundColor: 'var(--cor-card)',
                        borderColor: 'var(--cor-borda)'
                    }}
                >
                    <Button
                        onClick={handleConfirm}
                        disabled={saving || adminSenha.length < 4}
                        className="gap-2 font-bold h-10 w-full sm:flex-1 text-sm"
                        style={{
                            background: saving || adminSenha.length < 4? 'color-mix(in srgb, var(--cor-primaria) 50%, transparent)' : 'var(--cor-primaria)',
                            color: '#fff',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={saving}
                        className="h-10 w-full sm:flex-1 text-sm font-semibold"
                        style={{
                            backgroundColor: 'var(--cor-card)',
                            color: 'var(--cor-texto)',
                            border: '1px solid var(--cor-borda)',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        Cancelar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
