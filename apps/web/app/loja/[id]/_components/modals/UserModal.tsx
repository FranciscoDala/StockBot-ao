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
  senha?: string; // senha nova do usuario
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
    onSave: (e: React.FormEvent) => void;
    saving: boolean;
    errorMsg: string;
    lojaNome: string | undefined;
}

export function UserModal({ open, onOpenChange, editingUser, formData, setFormData, onSave, saving, errorMsg, lojaNome }: Props) {
    const focusStyle = { outline: 'none', boxShadow: '0 0 0 3px var(--cor-primaria)30' } // 1. ajustado

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-full sm:max-w-[600px] p-0 flex flex-col border shadow-2xl [&>button]:hidden"
                style={{
                    backgroundColor: 'var(--cor-card)', // 2. trocado
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)', // 3. trocado
                    borderRadius: 'var(--radius)',
                    height: '90vh',
                    maxHeight: '90vh'
                }}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <form onSubmit={onSave} className="flex flex-col flex-1 min-h-0">
                    <DialogHeader className="p-4 sm:p-6 pb-0 shrink-0">
                        <DialogTitle className="text-base sm:text-lg" style={{color: 'var(--cor-texto)'}}>{editingUser? "Editar" : "Adicionar"} Membro</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm" style={{color: 'var(--cor-texto-sec)'}}>{`Preencha os dados. Loja: ${lojaNome || "-"}`}</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 sm:gap-4 py-4 px-4 sm:px-6 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
                        {errorMsg && (
                            <div
                                className="border text-xs p-3"
                                style={{
                                    backgroundColor: 'var(--cor-erro)14', // 4. trocado
                                    borderColor: 'var(--cor-erro)30', // 5. trocado
                                    color: 'var(--cor-erro)', // 6. trocado
                                    borderRadius: 'var(--radius)'
                                }}
                            >
                                {errorMsg}
                            </div>
                        )}

                        <p className="text-sm font-semibold -mb-2" style={{color: 'var(--cor-texto-sec)'}}>Dados do Membro</p>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{color: 'var(--cor-texto-sec)'}}>Nome *</Label>
                            <Input
                                value={formData.nome}
                                onChange={e => setFormData({...formData, nome: e.target.value})}
                                className="sm:col-span-3 text-xs h-9"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)', // 7. trocado
                                    color: 'var(--cor-texto)',
                                    border: '1.5px solid var(--cor-primaria)', // 8. borda primary
                                    borderRadius: 'var(--radius-sm)', // 9. trocado
                               ...focusStyle
                                }}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{color: 'var(--cor-texto-sec)'}}>Email</Label>
                            {editingUser? (
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="sm:col-span-3 text-xs h-9"
                                    style={{
                                        backgroundColor: 'var(--cor-fundo)', // 10
                                        color: 'var(--cor-texto)',
                                        border: '1.5px solid var(--cor-primaria)', // 11
                                        borderRadius: 'var(--radius-sm)', // 12
                                   ...focusStyle
                                    }}
                                />
                            ) : (
                                <p className="sm:col-span-3 text-xs" style={{color: 'var(--cor-texto-sec)'}}>Será gerado automaticamente: nome@loja.ao</p>
                            )}
                        </div>

                        {!editingUser && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                                <Label className="text-xs sm:text-right" style={{color: 'var(--cor-texto-sec)'}}>Senha Temp *</Label>
                                <Input
                                    type="password"
                                    value={formData.senha || ""}
                                    onChange={e => setFormData({...formData, senha: e.target.value})}
                                    className="sm:col-span-3 text-xs h-9"
                                    style={{
                                        backgroundColor: 'var(--cor-fundo)', // 13
                                        color: 'var(--cor-texto)',
                                        border: '1.5px solid var(--cor-primaria)', // 14
                                        borderRadius: 'var(--radius-sm)', // 15
                                   ...focusStyle
                                    }}
                                    required
                                    placeholder="mínimo 6 caracteres"
                                />
                            </div>
                        )}

                        {editingUser && (
                            <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                                <Label className="text-xs sm:text-right" style={{color: 'var(--cor-texto-sec)'}}>Nova Senha</Label>
                                <Input
                                    type="password"
                                    value={formData.senha || ""}
                                    onChange={e => setFormData({...formData, senha: e.target.value})}
                                    className="sm:col-span-3 text-xs h-9"
                                    style={{
                                        backgroundColor: 'var(--cor-fundo)', // 16
                                        color: 'var(--cor-texto)',
                                        border: '1.5px solid var(--cor-primaria)', // 17
                                        borderRadius: 'var(--radius-sm)', // 18
                                   ...focusStyle
                                    }}
                                    placeholder="deixe em branco para não alterar"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{color: 'var(--cor-texto-sec)'}}>Telefone</Label>
                            <Input
                                value={formData.telefone || ""}
                                onChange={e => setFormData({...formData, telefone: e.target.value})}
                                className="sm:col-span-3 text-xs h-9"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)', // 19
                                    color: 'var(--cor-texto)',
                                    border: '1.5px solid var(--cor-primaria)', // 20
                                    borderRadius: 'var(--radius-sm)', // 21
                               ...focusStyle
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label className="text-xs sm:text-right" style={{color: 'var(--cor-texto-sec)'}}>Cargo</Label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                                className="sm:col-span-3 flex h-9 w-full rounded-md px-3 py-2 text-xs"
                                style={{
                                    backgroundColor: 'var(--cor-fundo)', // 22
                                    color: 'var(--cor-texto)',
                                    border: '1.5px solid var(--cor-primaria)', // 23
                                    borderRadius: 'var(--radius-sm)', // 24
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
                            <Label className="text-xs sm:text-right" style={{color: 'var(--cor-texto-sec)'}}>Ativo</Label>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={v => setFormData({...formData, is_active: v})}
                                className="sm:col-span-3 w-fit data-[state=checked]:bg-[var(--cor-primaria)]"
                            />
                        </div>

                    </div>

                    <DialogFooter className="p-4 sm:p-6 pt-4 border-t shrink-0 flex-col sm:flex-row gap-2" style={{backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)'}}>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                className="text-xs w-full sm:w-auto font-semibold"
                                style={{
                                    backgroundColor: 'var(--cor-card)', // 27
                                    color: 'var(--cor-texto)',
                                    border: '1px solid var(--cor-borda)', // 28
                                    borderRadius: 'var(--radius)'
                                }}
                            >
                                Cancelar
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="gap-2 text-xs w-full sm:w-auto font-bold"
                            style={{
                                background: 'var(--cor-primaria)',
                                color: '#fff',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingUser? "Salvar Alterações" : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
