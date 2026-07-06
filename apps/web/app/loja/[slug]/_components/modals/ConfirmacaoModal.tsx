"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    titulo: string;
    descricao: string;
    loading: boolean;
}

export function ConfirmacaoModal({ open, onClose, onConfirm, titulo, descricao, loading }: Props) {
    return (
        <Dialog open={open} onOpenChange={loading? undefined : onClose}>
            <DialogContent className="sm:max-w-[425px] bg-neutral-950 border-red-500/50 text-white p-0 shadow-2xl shadow-black/50">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center gap-3">
                        <Trash2 className="text-red-500" size={24} />
                        <DialogTitle className="text-lg font-bold">{titulo}</DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-400 text-sm pt-2">
                        {descricao}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="p-4 bg-neutral-900/50 border-t border-white/10 flex-row justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="text-white hover:bg-neutral-800">Cancelar</Button>
                    <Button onClick={onConfirm} disabled={loading} className="gap-2 bg-red-600 hover:bg-red-700 text-white font-bold">
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Sim, Excluir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
