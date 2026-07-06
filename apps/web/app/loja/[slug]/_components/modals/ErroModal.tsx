"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle, CheckCircle, Info } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    mensagem: string;
    tipo?: 'erro' | 'sucesso' | 'alerta' | 'info';
    titulo?: string;
}

export function ErroModal({ open, onClose, mensagem, tipo = 'erro', titulo }: Props) {

    const config = {
        erro: {
            icon: <XCircle className="text-red-500" size={24} />,
            title: titulo || "Ação não permitida",
            color: "border-red-500/50",
            btn: "bg-red-600 hover:bg-red-700"
        },
        sucesso: {
            icon: <CheckCircle className="text-green-500" size={24} />,
            title: titulo || "Sucesso!",
            color: "border-green-500/50",
            btn: "bg-green-600 hover:bg-green-700"
        },
        alerta: {
            icon: <AlertTriangle className="text-yellow-500" size={24} />,
            title: titulo || "Atenção",
            color: "border-yellow-500/50",
            btn: "bg-yellow-600 hover:bg-yellow-700"
        },
        info: {
            icon: <Info className="text-blue-500" size={24} />,
            title: titulo || "Informação",
            color: "border-blue-500/50",
            btn: "bg-blue-600 hover:bg-blue-700"
        }
    }

    const current = config;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className={`sm:max-w-[425px] bg-neutral-950 border ${current.color} text-white p-0 shadow-2xl shadow-black/50`}>
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-start gap-3">
                        <div className="mt-1">{current.icon}</div>
                        <div>
                            <DialogTitle className="text-lg font-bold">{current.title}</DialogTitle>
                            <DialogDescription className="text-gray-300 text-sm leading-relaxed mt-2">
                                {mensagem}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <DialogFooter className="p-4 bg-neutral-900/50 border-t border-white/10">
                    <Button onClick={onClose} className={`w-full ${current.btn} text-white font-semibold`}>
                        Entendi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
