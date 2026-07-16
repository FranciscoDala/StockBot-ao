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
            icon: <XCircle size={24} style={{color: '#ef4444'}} />,
            title: titulo || "Ação não permitida",
            color: "#ef444430",
            btnColor: "#ef4444"
        },
        sucesso: {
            icon: <CheckCircle size={24} style={{color: 'var(--cor-primaria)'}} />,
            title: titulo || "Sucesso!",
            color: "var(--cor-primaria)30",
            btnColor: "var(--cor-primaria)"
        },
        alerta: {
            icon: <AlertTriangle size={24} style={{color: 'var(--cor-primaria)'}} />,
            title: titulo || "Atenção",
            color: "var(--cor-primaria)30",
            btnColor: "var(--cor-primaria)"
        },
        info: {
            icon: <Info size={24} style={{color: 'var(--cor-primaria)'}} />,
            title: titulo || "Informação",
            color: "var(--cor-primaria)30",
            btnColor: "var(--cor-primaria)"
        }
    }
    const current = config[tipo];

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                className="sm:max-w-[425px] p-0 shadow-2xl border [&>button]:hidden"
                style={{
                    backgroundColor: 'var(--cor-fundo-card, #171717)',
                    color: 'var(--cor-texto)',
                    borderColor: current.color,
                    borderRadius: 'var(--radius)'
                }}
            >
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-start gap-3">
                        <div className="mt-1">{current.icon}</div>
                        <div>
                            <DialogTitle className="text-lg font-bold" style={{color: 'var(--cor-texto)'}}>{current.title}</DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed mt-2" style={{color: 'var(--cor-texto-sec)'}}>{mensagem}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <DialogFooter
                    className="p-4 border-t"
                    style={{
                        backgroundColor: 'var(--cor-fundo)',
                        borderColor: 'var(--cor-primaria)30'
                    }}
                >
                    <Button
                        onClick={onClose}
                        className="w-full font-semibold"
                        style={{
                            backgroundColor: current.btnColor,
                            color: tipo === 'erro'? '#fff' : '#fff',
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
