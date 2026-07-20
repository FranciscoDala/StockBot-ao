"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import type { Loja, Dono, DonoNovoForm, FormData } from "../AdminClient";

const focusStyle = { outline: 'none', boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.3)' }

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    editingLoja: Loja | null;
    donos: Dono[];
    formData: FormData;
    setFormData: (d: any) => void;
    onSave: (e: React.FormEvent) => void;
    saving: boolean;
    handleChange: (field: string, value: string | boolean) => void;
    handleDonoChange: (field: string, value: string) => void;
    handleDonoNovoChange: (field: string, value: string) => void;
}

export function LojaModal({ open, onOpenChange, editingLoja, donos, formData, setFormData, onSave, saving, handleChange, handleDonoChange, handleDonoNovoChange }: Props) {
    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange} // usa o que vem do pai
        >
            <DialogContent
                className="w-full max-w-full sm:max-w-[600px] p-0 flex-col border shadow-2xl"
                style={{
                    backgroundColor: 'var(--cor-card)',
                    color: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderRadius: 'var(--radius)',
                    height: '80vh',
                    maxHeight: '80vh',
                    backdropFilter: 'blur(10px)'
                }}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <form onSubmit={onSave} className="flex flex-col flex-1 min-h-0">
                    <DialogHeader className="p-4 sm:p-6 pb-0 shrink-0">
                        <DialogTitle className="text-base sm:text-lg" style={{ color: 'var(--cor-texto)' }}>{editingLoja? "Editar Loja" : "Criar Nova Loja"}</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm" style={{ color: 'var(--cor-texto-sec)' }}>{editingLoja? "Altere os dados abaixo." : `Preencha os dados. Slug: /${formData.slug || "minha-loja"}`}</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 sm:gap-4 py-4 px-4 sm:px-6 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
                        <p className="text-sm font-semibold -mb-2" style={{ color: 'var(--cor-texto-sec)' }}>Dados da Loja</p>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label htmlFor="nome" className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Nome *</Label>
                            <Input id="nome" value={formData.nome} onChange={e => handleChange('nome', e.target.value)} className="sm:col-span-3 text-xs h-9" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} required />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label htmlFor="slug" className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Slug</Label>
                            <Input id="slug" value={formData.slug} onChange={e => handleChange('slug', e.target.value)} className="sm:col-span-3 text-xs h-9" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} required disabled={!!editingLoja} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label htmlFor="endereco" className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Endereço</Label>
                            <Input id="endereco" value={formData.endereco} onChange={e => handleChange('endereco', e.target.value)} className="sm:col-span-3 text-xs h-9" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} placeholder="Rua, Bairro, Cidade" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                            <Label htmlFor="active" className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Ativa</Label>
                            <Switch id="active" checked={formData.is_active} onCheckedChange={v => handleChange('is_active', v)} className="sm:col-span-3 w-fit data-[state=checked]:bg-[var(--cor-primaria)]" />
                        </div>

                        {editingLoja && formData.dono && (
                            <>
                                <div className="border-t pt-4 mt-2"><p className="text-sm font-semibold -mb-2" style={{ color: 'var(--cor-texto-sec)' }}>Dados do Dono</p></div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4"><Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Nome</Label><Input value={formData.dono.nome} onChange={e => handleDonoChange('nome', e.target.value)} className="sm:col-span-3 text-xs h-9" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} /></div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4"><Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Email</Label><Input type="email" value={formData.dono.email} onChange={e => handleDonoChange('email', e.target.value)} className="sm:col-span-3 text-xs h-9" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} /></div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4"><Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Telefone</Label><Input value={formData.dono.telefone?? ""} onChange={e => handleDonoChange('telefone', e.target.value)} placeholder="Ex: 923456789" className="sm:col-span-3 text-xs h-9" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} /></div>
                            </>
                        )}

                        {!editingLoja && (
                            <>
                                <div className="border-t pt-4 mt-2"><p className="text-sm font-semibold -mb-2" style={{ color: 'var(--cor-texto-sec)' }}>Dono da Loja</p></div>
                                <div className="grid w-full grid-cols-2 gap-2">
                                    <Button type="button" variant={formData.modoDono === 'existente'? 'default' : 'outline'} onClick={() => handleChange('modoDono', 'existente')} className={formData.modoDono === 'existente'? 'bg-[var(--cor-primaria)] hover:bg-[var(--cor-primaria)] text-white' : ''}>Dono Existente</Button>
                                    <Button type="button" variant={formData.modoDono === 'novo'? 'default' : 'outline'} onClick={() => handleChange('modoDono', 'novo')} className={formData.modoDono === 'novo'? 'bg-[var(--cor-primaria)] hover:bg-[var(--cor-primaria)] text-white' : ''}>Criar Novo Dono</Button>
                                </div>
                                {formData.modoDono === 'existente' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4">
                                        <Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Selecionar</Label>
                                        <select value={formData.dono_existente_id} onChange={(e) => handleChange('dono_existente_id', e.target.value)} required={formData.modoDono === 'existente'} className="sm:col-span-3 flex h-9 w-full rounded-md px-3 py-2 text-xs" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }}>
                                            <option value="" disabled>{donos.length > 0? "Seleciona um dono..." : "Nenhum dono cadastrado"}</option>
                                            {donos.map(d => <option key={d.id} value={d.id}>{d.nome} - {d.email}</option>)}
                                        </select>
                                    </div>
                                )}
                                {formData.modoDono === 'novo' && (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4"><Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Nome *</Label><Input placeholder="Nome do Dono" value={formData.dono_novo.nome} onChange={e => handleDonoNovoChange('nome', e.target.value)} required={formData.modoDono === 'novo'} className="sm:col-span-3 text-xs h-9" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} /></div>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4"><Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Email *</Label><Input type="email" placeholder="Email do Dono" value={formData.dono_novo.email} onChange={e => handleDonoNovoChange('email', e.target.value)} required={formData.modoDono === 'novo'} className="sm:col-span-3 text-xs h-9" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} /></div>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4"><Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Senha *</Label><Input type="password" placeholder="Senha do Dono" value={formData.dono_novo.senha} onChange={e => handleDonoNovoChange('senha', e.target.value)} required={formData.modoDono === 'novo'} className="sm:col-span-3 text-xs h-9" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} /></div>
                                        <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-1 sm:gap-4"><Label className="text-xs sm:text-right" style={{ color: 'var(--cor-texto-sec)' }}>Telefone</Label><Input placeholder="Telefone Opcional" value={formData.dono_novo.telefone} onChange={e => handleDonoNovoChange('telefone', e.target.value)} className="sm:col-span-3 text-xs h-9" style={{ backgroundColor: 'var(--cor-fundo)', color: 'var(--cor-texto)', border: '1.5px solid var(--cor-primaria)', borderRadius: 'var(--radius-sm)',...focusStyle }} /></div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    <DialogFooter className="p-4 sm:p-6 pt-4 border-t shrink-0 flex-row gap-2" style={{ backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)' }}>
                        <DialogClose asChild>
                            <Button type="button" className="text-xs flex-1 sm:flex-initial font-semibold" style={{ backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--radius)' }}>Cancelar</Button>
                        </DialogClose>
                        <Button type="submit" disabled={saving} className="gap-2 text-xs flex-1 sm:flex-initial font-bold" style={{ background: 'var(--cor-primaria)', color: '#fff', borderRadius: 'var(--radius)' }}>
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingLoja? "Salvar Alterações" : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
