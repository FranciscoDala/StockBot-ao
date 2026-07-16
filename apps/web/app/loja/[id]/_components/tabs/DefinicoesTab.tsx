"use client";
import { useState, useEffect } from "react";
import {
    Settings, Palette, LayoutGrid, Type, Bell, Shield,
    Save, RefreshCw, Sun, Moon
} from "lucide-react";
import { toast } from "sonner";

type TabDef = "aparencia" | "tema" | "cards" | "notificacoes" | "seguranca";

type Props = {
  onSaveTheme: (data: {theme?: string, card_style?: string, card_size?: string, font_size?: string}) => void;
  theme: string;
  cardStyle: string;
  cardSize: string;
  fontSize: string;
}

export function DefinicoesTab({ onSaveTheme, theme, cardStyle, cardSize, fontSize }: Props) {
    const [tabAtiva, setTabAtiva] = useState<TabDef>("aparencia");

    // AGORA VEM DO DB E NÃO DO LOCALSTORAGE
    const [modoEscuro, setModoEscuro] = useState(theme === 'dark');
    const [estiloCard, setEstiloCard] = useState(cardStyle); // padrao | glass | borda
    const [tamanhoCard, setTamanhoCard] = useState(cardSize); // pequeno | medio | grande
    const [fonteTamanho, setFonteTamanho] = useState(fontSize); // pequeno | medio | grande

    // Atualiza os states quando o DB carrega
    useEffect(() => {
        setModoEscuro(theme === 'dark');
        setEstiloCard(cardStyle);
        setTamanhoCard(cardSize);
        setFonteTamanho(fontSize);
        aplicarTema(theme, cardStyle, cardSize, fontSize);
    }, [theme, cardStyle, cardSize, fontSize])

    const aplicarTema = (t: string, cs: string, csz: string, fsz: string) => {
        // 1. Cores - já vem do --cor-primaria global
        document.documentElement.style.setProperty('--cor-primaria', t === 'dark'? '#10b981' : '#059669');

        // 2. Tema claro/escuro
        document.documentElement.setAttribute('data-theme', t);

        // 3. Estilo e tamanho do card
        document.documentElement.setAttribute('data-card-style', cs);
        document.documentElement.setAttribute('data-card-size', csz);

        // 4. Fonte
        document.documentElement.style.setProperty('--font-size', fsz === 'grande'? '16px' : fsz === 'pequeno'? '12px' : '14px');
    }

    const handleSalvar = () => {
        const newTheme = modoEscuro ? 'dark' : 'light';
        onSaveTheme({
            theme: newTheme,
            card_style: estiloCard,
            card_size: tamanhoCard,
            font_size: fonteTamanho
        });
        toast.success("Configurações salvas!")
    }

    const handleRestaurar = () => {
        setModoEscuro(true);
        setEstiloCard("padrao");
        setTamanhoCard("medio");
        setFonteTamanho("medio");
        onSaveTheme({
            theme: 'dark',
            card_style: 'padrao',
            card_size: 'medio',
            font_size: 'medio'
        });
        toast.info("Configurações restauradas para o padrão")
    }

    const tabs = [
        { id: "aparencia" as TabDef, label: "Aparência", icon: <Palette size={16} /> },
        { id: "tema" as TabDef, label: "Tema", icon: <Sun size={16} /> },
        { id: "cards" as TabDef, label: "Cards", icon: <LayoutGrid size={16} /> },
        { id: "notificacoes" as TabDef, label: "Notificações", icon: <Bell size={16} /> },
        { id: "seguranca" as TabDef, label: "Segurança", icon: <Shield size={16} /> },
    ]

    return (
        <div className="space-y-6">
            {/* HEADER PADRONIZADO */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{color: 'var(--cor-texto)'}}>
                        <Settings size={22} />
                        Definições
                    </h2>
                    <p className="text-xs sm:text-sm" style={{color: 'var(--cor-texto-sec)'}}>Personalize a aparência da sua loja</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={handleRestaurar} className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition hover:opacity-90" style={{backgroundColor: 'var(--cor-card)', color: 'var(--cor-texto)', borderRadius: 'var(--radius-sm)'}}>
                        <RefreshCw size={14} /> Restaurar
                    </button>
                    <button onClick={handleSalvar} className="px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition hover:opacity-90" style={{backgroundColor: 'var(--cor-primaria)', color: 'white', borderRadius: 'var(--radius-sm)'}}>
                        <Save size={14} /> Salvar
                    </button>
                </div>
            </div>

            {/* TABS INTERNAS */}
            <div className="card">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTabAtiva(t.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition whitespace-nowrap`}
                            style={tabAtiva === t.id
                                ? {color: 'var(--cor-primaria)', borderBottom: '2px solid var(--cor-primaria)'}
                                : {color: 'var(--cor-texto-sec)'}}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTEÚDO */}
            <div className="card border" style={{borderColor: 'var(--cor-borda)'}}>
                {tabAtiva === "aparencia" && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold" style={{color: 'var(--cor-texto)'}}>Cores da Marca</h3>
                        <p className="text-sm" style={{color: 'var(--cor-texto-sec)'}}>
                            A cor primária muda automaticamente com o tema. Dark = Verde, Light = Verde Escuro
                        </p>
                        <div className="p-4 rounded-lg" style={{backgroundColor: 'var(--cor-card)', borderRadius: 'var(--radius)'}}>
                            Cor atual: <span className="font-bold" style={{color: 'var(--cor-primaria)'}}>{modoEscuro ? 'Verde #10b981' : 'Verde #059669'}</span>
                        </div>
                    </div>
                )}

                {tabAtiva === "tema" && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold" style={{color: 'var(--cor-texto)'}}>Tema do App</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setModoEscuro(false)}
                                className="p-6 border-2 flex flex-col items-center gap-3"
                                style={{
                                    borderColor: !modoEscuro ? 'var(--cor-primaria)' : 'var(--cor-borda)',
                                    backgroundColor: !modoEscuro ? 'var(--cor-primaria)20' : 'var(--cor-card)',
                                    borderRadius: 'var(--radius)'
                                }}
                            >
                                <Sun size={32} className="text-amber-500" /> <span className="font-medium" style={{color: 'var(--cor-texto)'}}>Claro</span>
                            </button>
                            <button
                                onClick={() => setModoEscuro(true)}
                                className="p-6 border-2 flex flex-col items-center gap-3"
                                style={{
                                    borderColor: modoEscuro ? 'var(--cor-primaria)' : 'var(--cor-borda)',
                                    backgroundColor: modoEscuro ? 'var(--cor-primaria)20' : 'var(--cor-card)',
                                    borderRadius: 'var(--radius)'
                                }}
                            >
                                <Moon size={32} className="text-purple-500" /> <span className="font-medium" style={{color: 'var(--cor-texto)'}}>Escuro</span>
                            </button>
                        </div>
                    </div>
                )}

                {tabAtiva === "cards" && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold" style={{color: 'var(--cor-texto)'}}>Estilo dos Cards</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                {id: "padrao", nome: "Padrão", desc: "Sólido"},
                                {id: "glass", nome: "Glass", desc: "Com desfoque"},
                                {id: "borda", nome: "Com Borda", desc: "Contorno visível"}
                            ].map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setEstiloCard(c.id)}
                                    className="p-4 border-2 text-left transition"
                                    style={{
                                        borderColor: estiloCard === c.id ? 'var(--cor-primaria)' : 'var(--cor-borda)',
                                        backgroundColor: estiloCard === c.id ? 'var(--cor-primaria)20' : 'var(--cor-card)',
                                        borderRadius: 'var(--radius)'
                                    }}
                                >
                                    <p className="font-bold" style={{color: 'var(--cor-texto)'}}>{c.nome}</p>
                                    <p className="text-xs" style={{color: 'var(--cor-texto-sec)'}}>{c.desc}</p>
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block" style={{color: 'var(--cor-texto-sec)'}}>Tamanho dos Cards</label>
                            <select
                                value={tamanhoCard}
                                onChange={e => setTamanhoCard(e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-sm"
                                style={{backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: 'var(--radius-sm)'}}
                            >
                                <option value="pequeno">Pequeno</option>
                                <option value="medio">Médio</option>
                                <option value="grande">Grande</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block" style={{color: 'var(--cor-texto-sec)'}}>Tamanho da Fonte</label>
                            <select
                                value={fonteTamanho}
                                onChange={e => setFonteTamanho(e.target.value)}
                                className="w-full rounded-lg px-3 py-2 text-sm"
                                style={{backgroundColor: 'var(--cor-card)', borderColor: 'var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: 'var(--radius-sm)'}}
                            >
                                <option value="pequeno">Pequena</option>
                                <option value="medio">Média</option>
                                <option value="grande">Grande</option>
                            </select>
                        </div>
                    </div>
                )}

                {tabAtiva === "notificacoes" && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold" style={{color: 'var(--cor-texto)'}}>Notificações</h3>
                        {["Estoque Baixo", "Nova Venda", "Cliente Novo"].map(n => (
                            <div key={n} className="flex items-center justify-between p-4" style={{backgroundColor: 'var(--cor-card)', borderRadius: 'var(--radius)'}}>
                                <p className="font-medium" style={{color: 'var(--cor-texto)'}}>{n}</p>
                                <div className="w-12 h-6 rounded-full relative" style={{backgroundColor: 'var(--cor-primaria)'}}><div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div></div>
                            </div>
                        ))}
                    </div>
                )}

                {tabAtiva === "seguranca" && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold" style={{color: 'var(--cor-texto)'}}>Segurança</h3>
                        <div className="p-4" style={{backgroundColor: 'var(--cor-card)', borderRadius: 'var(--radius)'}}>
                            <p className="font-medium" style={{color: 'var(--cor-texto)'}}>Autenticação 2FA</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
