"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wallet } from "lucide-react";
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
    const focusStyle = { outline: 'none', boxShadow: '0 0 0 3px var(--cor-primaria)30' }
    const inputStyle = {
        backgroundColor: 'var(--cor-fundo)',
        color: 'var(--cor-texto)',
        border: '1.5px solid var(--cor-primaria)',
        borderRadius: 'var(--radius-sm)',
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="w-[calc(100%-2rem)] max-w-[420px] p-0 flex flex-col border shadow-2xl overflow-hidden [&>button]:hidden" // <- PADRAO
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: 'var(--radius)',
                    maxHeight: '85vh'
                }}
            >
                <DialogHeader className="p-5 pb-3 shrink-0">
                    <div className="flex items-center justify-center gap-3"> {/* <- CENTRALIZADO */}
                        <Wallet size={24} style={{color: 'var(--cor-primaria)'}} />
                        <DialogTitle className="text-lg font-bold" style={{color: 'var(--cor-texto)'}}>Registrar Pagamento</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm text-center mt-1" style={{color: 'var(--cor-texto-sec)'}}> {/* <- CENTRALIZADO */}
                        Dívida da venda de {venda? new Date(venda.data_venda).toLocaleDateString('pt-AO') : ''}: {formatCurrency(venda?.saldo_devedor?? 0)}
                    </DialogDescription>
                </DialogHeader>

                <div className="px-5 py-4 grid gap-4 overflow-y-auto flex-1 min-h-0"> {/* <- PADRAO */}
                    <div className="grid gap-1.5">
                        <Label className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Valor a pagar</Label>
                        <Input
                            type="number"
                            value={valor}
                            onChange={e => setValor(e.target.value)}
                            className="h-10 w-full text-sm"
                            style={{...inputStyle,...focusStyle}}
                            placeholder="0,00"
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>Forma de pagamento</Label>
                        <Select value={forma} onValueChange={setForma}>
                            <SelectTrigger
                                className="h-10 w-full text-sm"
                                style={{...inputStyle,...focusStyle}}
                            >
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent style={{backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)'}}>
                                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                <SelectItem value="Transferencia">Transferência</SelectItem>
                                <SelectItem value="TPA">TPA</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t shrink-0 flex-col gap-2" style={{backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)'}}> {/* <- BOTOES EMPILHADOS */}
                    <Button
                        onClick={onConfirmar}
                        disabled={saving ||!valor ||!forma}
                        className="gap-2 font-bold w-full h-10 text-sm"
                        style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: 'var(--radius)' }}
                    >
                        {saving && <Loader2 size={16} className="animate-spin" />}
                        Confirmar Pagamento
                    </Button>
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="font-semibold w-full h-10 text-sm"
                            style={{backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--radius)'}}
                        >
                            Cancelar
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
