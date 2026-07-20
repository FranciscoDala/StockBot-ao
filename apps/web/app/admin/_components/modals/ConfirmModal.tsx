"use client";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Shield } from "lucide-react";

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

    const handleClose = () => {
        setAdminSenha("");
        onOpenChange(false);
    }

    const handleConfirm = () => {
        if (adminSenha.length < 4) return;
        onConfirm();
    }

    const focusStyle = { outline: 'none', boxShadow: '0 0 0 1px var(--cor-primaria)' }

    return (
        <Dialog open={open} onOpenChange={() => {}}> {/* trava: não fecha clicando fora */}
            <DialogContent
                className="sm:max-w-[425px] p-0 shadow-2xl border"
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: 'var(--radius)',
                    backdropFilter: 'blur(10px)'
                }}
                onInteractOutside={(e) => e.preventDefault()} // trava clique fora
                onEscapeKeyDown={(e) => e.preventDefault()} // trava tecla ESC
            >
                <DialogHeader className="p-4 pb-2">
                    <div className="flex items-center gap-3">
                        <Shield size={20} style={{color: 'var(--cor-primaria)'}} />
                        <DialogTitle className="text-base font-bold" style={{color: 'var(--cor-texto)'}}>Confirmar Edição</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm pt-2 text-left" style={{color: 'var(--cor-texto-sec)'}}>
                        Para editar esta loja, digite a sua senha de ADMIN.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-4 pb-2">
                    <div className="grid gap-2">
                        <Label htmlFor="senha-admin" className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Digite a senha do ADMIN para confirmar</Label>
                        <Input
                            id="senha-admin"
                            type="password"
                            value={adminSenha}
                            onChange={(e) => setAdminSenha(e.target.value)}
                            className="h-9"
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

                <DialogFooter
                    className="p-4 border-t flex-row justify-end gap-3"
                    style={{
                        backgroundColor: 'var(--cor-card)',
                        borderColor: 'var(--cor-borda)'
                    }}
                >
                    <Button
                        variant="secondary"
                        onClick={handleClose} // só aqui fecha
                        disabled={saving}
                        className="h-9"
                        style={{
                            backgroundColor: 'var(--cor-card)',
                            color: 'var(--cor-texto)',
                            border: '1px solid var(--cor-borda)',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={saving || adminSenha.length < 4}
                        className="gap-2 font-bold h-9"
                        style={{
                            background: 'var(--cor-primaria)',
                            color: '#fff',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Confirmar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
