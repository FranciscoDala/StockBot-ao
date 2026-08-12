"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export type Cliente = {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  total_divida: number;
  ultima_compra: string | null;
  status: 'com_divida' | 'em_dia';
}

export type VendaPendente = {
  id: string;
  data_venda: string;
  total: number;
  valor_recebido: number;
  saldo_devedor: number;
  status: string;
  total_itens: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
    cliente: Cliente | null;
    vendas: VendaPendente[];
    onPagar: (v: VendaPendente) => void;
    formatCurrency: (v: number) => string;
}

export function DetalhesClienteModal({ open, onClose, cliente, vendas, onPagar, formatCurrency }: Props) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent style={{ backgroundColor: 'var(--cor-card)', maxWidth: '600px' }}>
                <DialogHeader>
                    <DialogTitle>{cliente?.nome}</DialogTitle>
                    <DialogDescription>
                        Dívida total: <span style={{ color: '#ef4444', fontWeight: 600 }}>{formatCurrency(cliente?.total_divida?? 0)}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {vendas.length === 0? (
                        <p className="text-center text-sm py-4" style={{color: 'var(--cor-texto-sec)'}}>Nenhuma dívida pendente</p>
                    ) : (
                        vendas.map(v => (
                            <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg" style={{ borderColor: 'var(--cor-borda)' }}>
                                <div>
                                    <p className="text-sm font-semibold flex items-center gap-1"><Calendar size={12} />{new Date(v.data_venda).toLocaleDateString('pt-AO')}</p>
                                    <p className="text-xs opacity-70">Itens: {v.total_itens} | Saldo: {formatCurrency(v.saldo_devedor)}</p>
                                </div>
                                <Button size="sm" style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: '999px' }} onClick={() => onPagar(v)}>
                                    Pagar
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
