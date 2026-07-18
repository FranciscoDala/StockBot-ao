"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, X } from "lucide-react";

interface ProdutoBaixoEstoque {
    id: string;
    nome: string;
    estoque: number;
    estoque_minimo: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
    produtos: ProdutoBaixoEstoque[];
}

export function AlertaEstoqueModal({ open, onClose, produtos }: Props) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                className="sm:max-w-[500px] p-0 border shadow-2xl [&>button]:hidden"
                style={{ backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', borderColor: 'var(--cor-erro)', borderRadius: 'var(--radius)' }}
            >
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={24} style={{color: 'var(--cor-erro)'}} />
                            <DialogTitle className="text-lg font-bold" style={{color: 'var(--cor-erro)'}}>Alerta de Estoque Baixo</DialogTitle>
                        </div>
                        <button onClick={onClose} style={{color: 'var(--cor-texto-sec)'}}><X size={20} /></button>
                    </div>
                    <DialogDescription className="text-sm pt-2" style={{color: 'var(--cor-texto-sec)'}}>
                        {produtos.length} produto(s) estão abaixo do estoque mínimo
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-4 max-h-80 overflow-y-auto space-y-2">
                    {produtos.map(prod => (
                        <div key={prod.id} className="flex items-center justify-between p-3 border" style={{backgroundColor: 'var(--cor-fundo)', borderColor: 'var(--cor-borda)', borderRadius: 'var(--radius)'}}>
                            <div className="flex items-center gap-2">
                                <Package size={16} style={{color: 'var(--cor-texto-sec)'}} />
                                <div>
                                    <p className="font-semibold text-sm">{prod.nome}</p>
                                    <p className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Mínimo: {prod.estoque_minimo}</p>
                                </div>
                            </div>
                            <span className="font-bold text-sm" style={{color: 'var(--cor-erro)'}}>Estoque: {prod.estoque}</span>
                        </div>
                    ))}
                </div>

                <DialogFooter className="p-4 border-t" style={{backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)'}}>
                    <Button onClick={onClose} className="w-full font-bold" style={{background: 'var(--cor-primaria)', color: '#fff', borderRadius: 'var(--radius)'}}>
                        Entendi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
