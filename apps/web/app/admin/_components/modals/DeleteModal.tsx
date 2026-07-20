"use client";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import type { Loja } from "../AdminClient";

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    loja: Loja | null;
    adminSenha: string;
    setAdminSenha: (v: string) => void;
    onDelete: () => void;
    deleting: boolean;
}

export function DeleteModal({ open, onOpenChange, loja, adminSenha, setAdminSenha, onDelete, deleting }: Props) {

    useEffect(() => {
        if (!open) setAdminSenha("");
    }, [open, setAdminSenha]);

    const handleClose = () => {
        setAdminSenha("");
        onOpenChange(false);
    }

    const handleDelete = () => {
        if (adminSenha.length < 4) return;
        onDelete();
    }

    const focusStyle = { outline: 'none', boxShadow: '0 0 0 1px var(--cor-primaria)' }

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent
                className="w-[95vw] max-w-[425px] p-0 shadow-2xl border" // 👈 95vw pra mobile
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: 'var(--radius)',
                    backdropFilter: 'blur(10px)'
                }}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="p-4 pb-2">
                    <div className="flex items-center gap-3 pr-2">
                        <Trash2 size={20} style={{color: 'var(--cor-erro)'}} className="shrink-0" />
                        <DialogTitle className="text-base font-bold break-words" style={{color: 'var(--cor-texto)'}}> {/* 👈 quebra texto longo */}
                            Apagar {loja?.nome}?
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm pt-2 text-left break-words" style={{color: 'var(--cor-texto-sec)'}}> {/* 👈 quebra texto */}
                        Esta ação é irreversível. Digita a tua senha de ADMIN para confirmar.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-4 pb-2">
                    <div className="grid gap-2">
                        <Label htmlFor="senha-admin-delete" className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Digite a senha do ADMIN para confirmar</Label>
                        <Input
                            id="senha-admin-delete"
                            type="password"
                            value={adminSenha}
                            onChange={(e) => setAdminSenha(e.target.value)}
                            className="h-10 text-base" // 👈 h-10 e text-base pra mobile não dar zoom
                            style={{
                                backgroundColor: 'var(--cor-fundo)',
                                color: 'var(--cor-texto)',
                                border: '1.5px solid var(--cor-primaria)',
                                borderRadius: 'var(--radius-sm)',
                             ...focusStyle
                            }}
                            placeholder="******"
                            disabled={deleting}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
                        />
                    </div>
                </div>

                <DialogFooter
                    className="p-4 border-t flex-col sm:flex-row justify-end gap-2" // 👈 coluna no mobile
                    style={{
                        backgroundColor: 'var(--cor-card)',
                        borderColor: 'var(--cor-borda)'
                    }}
                >
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={deleting}
                        className="h-10 w-full sm:w-auto font-semibold" // 👈 w-full no mobile
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
                        onClick={handleDelete}
                        disabled={deleting || adminSenha.length < 4}
                        className="gap-2 font-bold h-10 w-full sm:w-auto" // 👈 w-full no mobile
                        style={{
                            background: 'var(--cor-erro)',
                            color: '#fff',
                            borderRadius: 'var(--radius)',
                            opacity: (deleting || adminSenha.length < 4)? 0.5 : 1 // 👈 feedback de disabled
                        }}
                    >
                        {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Apagar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
