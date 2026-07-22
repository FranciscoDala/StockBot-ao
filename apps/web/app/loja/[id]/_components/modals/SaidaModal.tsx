"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type FormDataType = {
    valor: string;
    descricao: string;
};

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSave: () => void; // callback pra recarregar os KPIs
    token: string | null | undefined;
    lojaId: string | null | undefined;
    lojaNome?: string;
}

export function SaidaModal({ open, onOpenChange, onSave, token, lojaId, lojaNome }: Props) {
    const [formData, setFormData] = useState<FormDataType>({ valor: "", descricao: "" });
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const focusStyle = { outline: 'none', boxShadow: '0 0 0 3px var(--cor-primaria)30' }

    // Limpa o form quando abre
    useEffect(() => {
        if (open) {
            setFormData({ valor: "", descricao: "" });
            setErrorMsg("");
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (!token ||!lojaId) {
            setErrorMsg("Sessão expirada. Faça login novamente.");
            return;
        }
        if (!formData.valor || Number(formData.valor) <= 0) {
            setErrorMsg("Informe um valor válido maior que 0");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                loja_id: lojaId,
                valor: Number(formData.valor),
                descricao: formData.descricao || "Saída manual"
            }
            const res = await fetch(`${API_URL}/saidas/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Erro ao salvar saída");
            }

            toast.success("Saída registrada!");
            onSave(); // avisa o pai pra recarregar
            onOpenChange(false);
        } catch (err: any) {
            setErrorMsg(err.message || "Erro ao salvar");
            toast.error(err.message || "Erro ao salvar");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-full max-w-full sm:max-w-[500px] p-0 flex-col border shadow-2xl [&>button]:hidden"
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: 'var(--radius)',
                }}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                    <DialogHeader className="p-4 sm:p-6 pb-0 shrink-0">
                        <DialogTitle className="text-base sm:text-lg" style={{ color: 'var(--cor-texto)' }}>Registrar Saída</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>
                            {`Registre retiradas, pagamentos e outras saídas. Loja: ${lojaNome || "-"}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 sm:gap-4 py-4 px-4 sm:px-6 overflow-y-auto flex-1 min-h-0">
                        {errorMsg && (
                            <div className="border text-xs p-3" style={{ backgroundColor: 'var(--cor-erro)14', borderColor: 'var(--cor-erro)30', color: 'var(--cor-erro)', borderRadius: 'var(--radius)' }}>
                                {errorMsg}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Valor *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.valor}
                                onChange={e => setFormData({...formData, valor: e.target.value })}
                                className="sm:col-span-3 text-xs h-9"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)',
                                    color: 'var(--cor-texto)',
                                    border: '1.5px solid var(--cor-primaria)',
                                    borderRadius: 'var(--radius-sm)',
                                   ...focusStyle
                                }}
                                placeholder="0.00"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Descrição</Label>
                            <Input
                                value={formData.descricao}
                                onChange={e => setFormData({...formData, descricao: e.target.value })}
                                className="sm:col-span-3 text-xs h-9"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)',
                                    color: 'var(--cor-texto)',
                                    border: '1.5px solid var(--cor-primaria)',
                                    borderRadius: 'var(--radius-sm)',
                                   ...focusStyle
                                }}
                                placeholder="Ex: Retirada do dono, Pagamento fornecedor..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-4 sm:p-6 pt-4 border-t shrink-0 flex-row gap-2" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)' }}>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                className="text-xs flex-1 sm:flex-initial font-semibold"
                                style={{
                                    backgroundColor: 'var(--cor-card)',
                                    color: 'var(--cor-texto)',
                                    border: '1px solid var(--cor-borda)',
                                    borderRadius: 'var(--radius)'
                                }}
                            >
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="gap-2 text-xs flex-1 sm:flex-initial font-bold"
                            style={{
                                background: '#ef4444', // vermelho pra saída
                                color: '#fff',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Confirmar Saída
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
