"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";

type TipoAcao = 'delete' | 'edit' | 'venda' | 'create';

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: (senha?: string) => void;
    titulo: string;
    descricao: string;
    loading: boolean;
    textoConfirmar?: string;
    tipo: TipoAcao;
}

export function ConfirmarModal({
    open,
    onClose,
    onConfirm,
    titulo,
    descricao,
    loading,
    textoConfirmar = "Confirmar Ação",
    tipo
}: Props) {
    const [senha, setSenha] = useState("");

    const precisaDeSenha = tipo === 'edit' || tipo === 'delete';

    useEffect(() => {
        if (!open) setSenha("");
    }, [open]);

    const handleConfirm = () => {
        if (precisaDeSenha && senha.length < 4) {
            return;
        }
        onConfirm(precisaDeSenha? senha : undefined);
        setSenha("");
    }

    const handleClose = () => {
        setSenha("");
        onClose();
    }

    const focusStyle = { outline: 'none', boxShadow: '0 0 0 1px var(--cor-primaria)' }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-[425px] bg-[#121212] text-white p-0 shadow-2xl shadow-black/50 border"
                style={{
                    borderColor: '#f59e0b30',
                    borderRadius: 'var(--radius)'
                }}
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >

                <DialogHeader className="p-4 pb-2">
                    <div className="flex items-center gap-3">
                        <Shield className="text-amber-500" size={20} />
                        <DialogTitle className="text-base font-bold text-white">{titulo}</DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-400 text-sm pt-2 text-left">
                        {descricao}
                    </DialogDescription>
                </DialogHeader>

                {precisaDeSenha && (
                    <div className="px-4 pb-2">
                        <div className="grid gap-2">
                            <Label htmlFor="senha-dono" className="text-xs text-gray-300">Digite a senha do Dono para confirmar</Label>
                            <Input
                                id="senha-dono"
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="bg-neutral-800 border-neutral-700 text-white h-9"
                                style={focusStyle}
                                placeholder="******"
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                <DialogFooter
                    className="p-4 border-t flex-row justify-end gap-3"
                    style={{
                        backgroundColor: '#171717',
                        borderColor: '#27272a'
                    }}
                >
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={loading}
                        className="h-9"
                        style={{borderRadius: 'var(--radius)'}}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading || (precisaDeSenha && senha.length < 4)}
                        className="btn-primary gap-2 font-bold h-9"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {textoConfirmar}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
