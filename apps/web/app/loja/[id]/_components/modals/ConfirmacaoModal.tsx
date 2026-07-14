"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";

type TipoAcao = 'delete' | 'edit' | 'venda' | 'create'; // <- ADICIONEI

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: (senha?: string) => void; // <- AGORA SENHA É OPCIONAL
    titulo: string;
    descricao: string;
    loading: boolean;
    textoConfirmar?: string;
    tipo: TipoAcao; // <- PRECISAMOS SABER O TIPO DA AÇÃO
}

export function ConfirmarModal({
    open,
    onClose,
    onConfirm,
    titulo,
    descricao,
    loading,
    textoConfirmar = "Confirmar Ação",
    tipo // <- RECEBE O TIPO
}: Props) {
    const [senha, setSenha] = useState("");

    // 1. SÓ PRECISA DE SENHA PRA EDITAR E DELETAR
    const precisaDeSenha = tipo === 'edit' || tipo === 'delete';

    // limpa senha ao abrir/fechar
    useEffect(() => {
        if (!open) setSenha("");
    }, [open]);

    const handleConfirm = () => {
        if (precisaDeSenha && senha.length < 4) {
            return; // não deixa confirmar sem senha
        }
        onConfirm(precisaDeSenha? senha : undefined); // <- só manda senha se precisar
        setSenha("");
    }

    const handleClose = () => {
        setSenha("");
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="sm:max-w-[425px] bg-[#121212] border-amber-500/30 text-white p-0 shadow-2xl shadow-black/50 rounded-xl"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >

                {/* HEADER */}
                <DialogHeader className="p-4 pb-2">
                    <div className="flex items-center gap-3">
                        <Shield className="text-amber-500" size={20} />
                        <DialogTitle className="text-base font-bold text-white">{titulo}</DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-400 text-sm pt-2 text-left">
                        {descricao}
                    </DialogDescription>
                </DialogHeader>

                {/* BODY - INPUT SENHA SÓ APARECE SE PRECISAR */}
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
                                placeholder="******"
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                {/* FOOTER */}
                <DialogFooter className="p-4 bg-neutral-900/30 border-t border-neutral-800 flex-row justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        disabled={loading}
                        className="text-white hover:bg-neutral-800 h-9"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading || (precisaDeSenha && senha.length < 4)} // <- só valida senha se precisar
                        className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold h-9"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {textoConfirmar}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
