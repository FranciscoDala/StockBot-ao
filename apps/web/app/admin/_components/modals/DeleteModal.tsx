"use client";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
    // error?: string | null; 👈 REMOVIDO
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

    const focusStyle = { outline: 'none', boxShadow: '0 0 0 3px var(--cor-primaria)30' }
    // const errorStyle = { outline: 'none', boxShadow: '0 0 0 1px var(--cor-erro)' } 👈 REMOVIDO

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                // AJUSTE: largura com respiro + centralizada
                className="w-[95vw] max-w-[420px] p-0 flex-col border shadow-2xl overflow-hidden [&>button]:hidden mx-auto gap-0"
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
                {/* AJUSTE: header igual as outras */}
                <DialogHeader className="p-5 pb-3 shrink-0 text-left">
                    <div className="flex items-center gap-3">
                        <Trash2 size={24} style={{color: 'var(--cor-erro)'}} className="shrink-0" />
                        <DialogTitle className="text-lg font-bold break-words" style={{color: 'var(--cor-texto)'}}>
                            Apagar {loja?.nome}?
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm mt-1 break-words" style={{color: 'var(--cor-texto-sec)'}}>
                        Esta ação é irreversível. Digita a tua senha de ADMIN para confirmar.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-5 pb-2">
                    <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                        <Label htmlFor="senha-admin-delete" className="text-xs sm:text-right sm:justify-self-end" style={{color: 'var(--cor-texto-sec)'}}>Senha ADMIN *</Label>
                        <Input
                            id="senha-admin-delete"
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
                            disabled={deleting}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
                        />
                        {/* BLOCO DE ERRO REMOVIDO 👇 pq agora vem de outro modal */}
                        {/* {error && (
                            <div className="flex items-center gap-2 text-xs" style={{color: 'var(--cor-erro)'}}>
                                <AlertCircle size={14} />
                                {error === 'Failed to fetch'? 'Erro de conexão com o servidor' : error}
                            </div>
                        )} */}
                    </div>
                </div>

                {/* AJUSTE: Footer igual as outras modals */}
                <div
                    className="p-4 sm:p-6 pt-4 border-t shrink-0 flex-col sm:flex-row gap-2"
                    style={{
                        backgroundColor: 'var(--cor-card)',
                        borderColor: 'var(--cor-borda)',
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        borderBottomLeftRadius: 'var(--radius)',
                        borderBottomRightRadius: 'var(--radius)'
                    }}
                >
                    <Button
                        onClick={handleDelete}
                        disabled={deleting || adminSenha.length < 4}
                        className="gap-2 font-bold h-10 w-full sm:flex-1 text-sm pb-1"
                        style={{
                            background: deleting || adminSenha.length < 4? 'color-mix(in srgb, var(--cor-erro) 50%, transparent)' : 'var(--cor-erro)',
                            color: '#fff',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Apagar para sempre
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={deleting}
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
                </div>
            </DialogContent>
        </Dialog>
    )
}
