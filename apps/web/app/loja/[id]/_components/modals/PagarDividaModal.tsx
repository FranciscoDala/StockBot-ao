"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { type VendaPendente } from "./DetalhesClienteModal";

interface Props {
    open: boolean;
    onClose: () => void;
    venda: VendaPendente | null;
    valor: string;
    setValor: (v: string) => void;
    forma: string;
    setForma: (v: string) => void;
    onConfirmar: () => void;
    saving: boolean;
    formatCurrency: (v: number) => string;
}

export function PagarDividaModal({ open, onClose, venda, valor, setValor, forma, setForma, onConfirmar, saving, formatCurrency }: Props) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent style={{ backgroundColor: 'var(--cor-card)' }}>
                <DialogHeader>
                    <DialogTitle>Registrar Pagamento</DialogTitle>
                    <DialogDescription>
                        Dívida da venda de {venda? new Date(venda.data_venda).toLocaleDateString('pt-AO') : ''}: {formatCurrency(venda?.saldo_devedor?? 0)}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div><Label>Valor a pagar</Label><Input type="number" value={valor} onChange={e => setValor(e.target.value)} /></div>
                    <div>
                        <Label>Forma de pagamento</Label>
                        <Select value={forma} onValueChange={setForma}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                <SelectItem value="Transferencia">Transferência</SelectItem>
                                <SelectItem value="TPA">TPA</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={onConfirmar} disabled={saving} style={{ background: 'var(--cor-primaria)', color: '#fff' }}>
                        {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
                        Confirmar Pagamento
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
