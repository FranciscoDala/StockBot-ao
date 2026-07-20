"use client";
import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldAlert, AlertCircle } from "lucide-react"; // 👈 add AlertCircle

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    adminSenha: string;
    setAdminSenha: (v: string) => void;
    onConfirm: () => void;
    saving: boolean;
    error?: string | null; // 👈 add essa prop
}

export function ConfirmModal({ open, onOpenChange, adminSenha, setAdminSenha, onConfirm, saving, error }: Props) {

    useEffect(() => {
        if (!open) setAdminSenha("");
    }, [open, setAdminSenha]);

    const handleConfirm = () => {
        if (adminSenha.length < 4) return;
        onConfirm();
    }

    const focusStyle = { outline: 'none', boxShadow: '0 0 0 1px var(--cor-primaria)' }
    const errorStyle = { outline: 'none', boxShadow: '0 0 0 1px var(--cor-erro)' }

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent
                className="w- max-w-[425px] p-0 shadow-2xl border"
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
                    <div className="flex items-center gap-3 pr-8">
                        <ShieldAlert size={20} style={{color: 'var(--cor-primaria)'}} className="shrink-0" />
                        <DialogTitle className="text-base font-bold" style={{color: 'var(--cor-texto)'}}>
                            Confirmar Alterações
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-sm pt-2 text-left" style={{color: 'var(--cor-texto-sec)'}}>
                        Para salvar as alterações, digita a tua senha de ADMIN.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-4 pb-2">
                    <div className="grid gap-2">
                        <Label htmlFor="senha-admin" className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Digite a senha do ADMIN</Label>
                        <Input
                            id="senha-admin"
                            type="password"
                            value={adminSenha}
                            onChange={(e) => setAdminSenha(e.target.value)}
                            className="h-10 text-base"
                            style={{
                                backgroundColor: 'var(--cor-fundo)',
                                color: 'var(--cor-texto)',
                                border: `1.5px solid ${error? 'var(--cor-erro)' : 'var(--cor-primaria)'}`, // 👈 borda vermelha se erro
                                borderRadius: 'var(--radius-sm)',
                              ...(error? errorStyle : focusStyle)
                            }}
                            placeholder="******"
                            disabled={saving}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                        />
                        {error && ( // 👈 mostra erro
                            <div className="flex items-center gap-2 text-xs" style={{color: 'var(--cor-erro)'}}>
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter
                    className="p-4 border-t flex-col gap-2" // 👈 coluna no mobile
                    style={{
                        backgroundColor: 'var(--cor-card)',
                        borderColor: 'var(--cor-borda)'
                    }}
                >
                    <Button
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                        className="h-10 w-full font-semibold"
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
                        className="gap-2 font-bold h-10 w-full"
                        style={{
                            background: saving || adminSenha.length < 4? 'color-mix(in srgb, var(--cor-primaria) 50%, transparent)' : 'var(--cor-primaria)',
                            color: '#fff',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
