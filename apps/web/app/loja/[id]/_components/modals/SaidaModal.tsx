"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Props = {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    token: string | null | undefined;
    lojaId: string | null | undefined;
}

export function SaidaModal({ open, onClose, onSave, token, lojaId }: Props) {
    const [valor, setValor] = useState("");
    const [descricao, setDescricao] = useState("");
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token ||!lojaId) { toast.error("Sessão expirada"); return; }
        if (!valor || Number(valor) <= 0) { toast.error("Informe um valor válido"); return; }

        setLoading(true);
        try {
            const payload = {
                loja_id: lojaId,
                valor: Number(valor),
                descricao: descricao || "Saída manual"
            }
            const res = await fetch(`${API_URL}/saidas/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Erro ao salvar saída");

            toast.success("Saída registrada!");
            setValor("");
            setDescricao("");
            onSave(); // avisa o pai pra recarregar
        } catch (err: any) {
            toast.error(err.message || "Erro ao salvar");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl" style={{ background: 'var(--cor-card)', border: '1px solid var(--cor-borda)' }}>
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--cor-borda)' }}>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--cor-texto)' }}>Registrar Saída</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="text-sm font-medium" style={{ color: 'var(--cor-texto-sec)' }}>Valor da Saída</label>
                        <input
                            type="number"
                            step="0.01"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            placeholder="0.00"
                            required
                            className="w-full mt-1 p-2 rounded-lg border outline-none focus:ring-2"
                            style={{ background: 'var(--cor-fundo)', borderColor: 'var(--cor-borda)', color: 'var(--cor-texto)' }}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium" style={{ color: 'var(--cor-texto-sec)' }}>Descrição</label>
                        <textarea
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Ex: Retirada do dono, Pagamento fornecedor..."
                            rows={3}
                            className="w-full mt-1 p-2 rounded-lg border outline-none focus:ring-2"
                            style={{ background: 'var(--cor-fundo)', borderColor: 'var(--cor-borda)', color: 'var(--cor-texto)' }}
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={onClose} disabled={loading} className="w-full h-10 rounded-lg font-semibold" style={{ background: 'var(--cor-borda)', color: 'var(--cor-texto)' }}>Cancelar</button>
                        <button type="submit" disabled={loading} className="w-full h-10 rounded-lg font-semibold" style={{ background: '#ef4444', color: '#fff' }}>{loading? "Salvando..." : "Confirmar Saída"}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
