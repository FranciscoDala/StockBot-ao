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
            color: "#ef444430",
            btnColor: "#ef4444"
        },
        sucesso: {
            icon: <CheckCircle style={{color: 'var(--cor-primaria)'}} size={24} />,
            title: titulo || "Sucesso!",
            color: "var(--cor-primaria)30",
            btnColor: "var(--cor-primaria)"
        },
        alerta: {
            icon: <AlertTriangle className="text-yellow-500" size={24} />,
            title: titulo || "Atenção",
            color: "#eab30830",
            btnColor: "#eab308"
        },
        info: {
            icon: <Info className="text-blue-500" size={24} />,
            title: titulo || "Informação",
            color: "#3b82f630",
            btnColor: "#3b82f6"
        }
    }
    const current = config[tipo];

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                className="sm:max-w-[425px] bg-neutral-950 text-white p-0 shadow-2xl shadow-black/50 [&>button]:hidden border"
                style={{
                    borderColor: current.color,
                    borderRadius: 'var(--radius)'
                }}
            >
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-start gap-3">
                        <div className="mt-1">{current.icon}</div>
                        <div>
                            <DialogTitle className="text-lg font-bold">{current.title}</DialogTitle>
                            <DialogDescription className="text-gray-300 text-sm leading-relaxed mt-2">{mensagem}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <DialogFooter
                    className="p-4 border-t"
                    style={{
                        backgroundColor: '#171717',
                        borderColor: '#27272a'
                    }}
                >
                    <Button
                        onClick={onClose}
                        className="w-full font-semibold"
                        style={{
                            backgroundColor: current.btnColor,
                            color: tipo === 'sucesso'? 'white' : 'black',
                            borderRadius: 'var(--radius)'
                        }}
                    >
                        Entendi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
