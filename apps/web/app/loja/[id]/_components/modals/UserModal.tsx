"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import type { UsuarioLoja, UserRole } from "../../page";

type FormDataType = {
    nome: string;
    email: string;
    senha?: string;
    telefone: string;
    role: UserRole;
    is_active: boolean
};

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    editingUser: UsuarioLoja | null;
    formData: FormDataType;
    setFormData: (d: any) => void;
    onSave: (payload: any, e: React.FormEvent) => void; // <- MUDA AQUI
    saving: boolean;
    errorMsg: string;
    lojaNome: string | undefined;
}

export function UserModal({ open, onOpenChange, editingUser, formData, setFormData, onSave, saving, errorMsg, lojaNome }: Props) {
    const focusStyle = { outline: 'none', boxShadow: '0 0 0 3px var(--cor-primaria)30' }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-full max-w-full sm:max-w-[600px] p-0 flex-col border shadow-2xl [&>button]:hidden"
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: 'var(--radius)',
                    height: '80vh',
                    maxHeight: '80vh'
                }}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >

                <form onSubmit={(e) => onSave(formData, e)} className="flex flex-col flex-1 min-h-0">
                    <DialogHeader className="p-4 sm:p-6 pb-0 shrink-0">
                        <DialogTitle className="text-base sm:text-lg" style={{ color: 'var(--cor-texto)' }}>{editingUser ? "Editar" : "Adicionar"} Membro</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>{`Preencha os dados. Loja: ${lojaNome || "-"}`}</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 sm:gap-4 py-4 px-4 sm:px-6 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
                        {errorMsg && (
                            <div className="border text-xs p-3" style={{ backgroundColor: 'var(--cor-erro)14', borderColor: 'var(--cor-erro)30', color: 'var(--cor-erro)', borderRadius: 'var(--radius)' }}>
                                {errorMsg}
                            </div>
                        )}

                        <p className="text-sm font-semibold -mb-2" style={{ color: 'var(--cor-texto-sec)' }}>Dados do Membro</p>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Nome *</Label>
                            <Input
                                value={formData.nome}
                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                className="sm:col-span-3 text-xs h-9"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)',
                                    color: 'var(--cor-texto)',
                                    border: '1.5px solid var(--cor-primaria)',
                                    borderRadius: 'var(--radius-sm)',
                                    ...focusStyle
                                }}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Email</Label>
                            {editingUser ? (
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="sm:col-span-3 text-xs h-9"
                                    style={{
                                        backgroundColor: 'var(--cor-fundo)',
                                        color: 'var(--cor-texto)',
                                        border: '1.5px solid var(--cor-primaria)',
                                        borderRadius: 'var(--radius-sm)',
                                        ...focusStyle
                                    }}
                                />
                            ) : (
                                <p className="sm:col-span-3 text-xs" style={{ color: 'var(--cor-texto-sec)' }}>Será gerado automaticamente: nome@loja.ao</p>
                            )}
                        </div>

                        {!editingUser && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                                <Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Senha Temp *</Label>
                                <Input
                                    type="password"
                                    value={formData.senha || ""}
                                    onChange={e => setFormData({ ...formData, senha: e.target.value })}
                                    className="sm:col-span-3 text-xs h-9"
                                    style={{
                                        backgroundColor: 'var(--cor-fundo)',
                                        color: 'var(--cor-texto)',
                                        border: '1.5px solid var(--cor-primaria)',
                                        borderRadius: 'var(--radius-sm)',
                                        ...focusStyle
                                    }}
                                    required
                                    placeholder="mínimo 6 caracteres"
                                />
                            </div>
                        )}

                        {editingUser && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                                <Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Nova Senha</Label>
                                <Input
                                    type="password"
                                    value={formData.senha || ""}
                                    onChange={e => setFormData({ ...formData, senha: e.target.value })}
                                    className="sm:col-span-3 text-xs h-9"
                                    style={{
                                        backgroundColor: 'var(--cor-fundo)',
                                        color: 'var(--cor-texto)',
                                        border: '1.5px solid var(--cor-primaria)',
                                        borderRadius: 'var(--radius-sm)',
                                        ...focusStyle
                                    }}
                                    placeholder="deixe em branco para não alterar"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Telefone</Label>
                            <Input
                                value={formData.telefone || ""}
                                onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                className="sm:col-span-3 text-xs h-9"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)',
                                    color: 'var(--cor-texto)',
                                    border: '1.5px solid var(--cor-primaria)',
                                    borderRadius: 'var(--radius-sm)',
                                    ...focusStyle
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Cargo</Label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                className="sm:col-span-3 flex h-9 w-full rounded-md px-3 py-2 text-xs"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)',
                                    color: 'var(--cor-texto)',
                                    border: '1.5px solid var(--cor-primaria)',
                                    borderRadius: 'var(--radius-sm)',
                                    ...focusStyle
                                }}
                            >
                                <option value="GERENTE">Gerente</option>
                                <option value="VENDEDOR">Vendedor</option>
                                <option value="CAIXA">Caixa</option>
                                <option value="ESTOQUISTA">Estoquista</option>
                                <option value="ADMIN">Admin</option>
                                {!editingUser && <option value="DONO">Dono</option>}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Ativo</Label>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={v => setFormData({ ...formData, is_active: v })}
                                className="sm:col-span-3 w-fit data-[state=checked]:bg-[var(--cor-primaria)]"
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
                                background: 'var(--cor-primaria)',
                                color: '#fff',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingUser ? "Salvar Alterações" : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>


            </DialogContent>
        </Dialog>
    )
}
