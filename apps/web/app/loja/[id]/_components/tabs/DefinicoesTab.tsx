"use client";
import { useState, useEffect } from "react";
import {
    Settings, Palette, LayoutGrid, Type, Bell, Shield,
    Save, RefreshCw, Sun, Moon
} from "lucide-react";

type TabDef = "aparencia" | "tema" | "cards" | "notificacoes" | "seguranca";

export function DefinicoesTab() {
    const [tabAtiva, setTabAtiva] = useState<TabDef>("aparencia");

    const [corPrimaria, setCorPrimaria] = useState("#16a34a");
    const [corFundo, setCorFundo] = useState("#0a0a0a");
    const [modoEscuro, setModoEscuro] = useState(true);
    const [arredondamento, setArredondamento] = useState("xl");
    const [estiloCard, setEstiloCard] = useState("padrao");
    const [fonteTamanho, setFonteTamanho] = useState("normal");

    // Carregar do localStorage ao abrir
    useEffect(() => {
        const saved = localStorage.getItem("loja_config");
        if(saved) {
            const config = JSON.parse(saved);
            setCorPrimaria(config.corPrimaria || "#16a34a");
            setCorFundo(config.corFundo || "#0a0a0a");
            setModoEscuro(config.modoEscuro ?? true);
            setArredondamento(config.arredondamento || "xl");
            setEstiloCard(config.estiloCard || "padrao");
            setFonteTamanho(config.fonteTamanho || "normal");
            aplicarTema(config);
        }
    }, [])

    const aplicarTema = (config: any) => {
        document.documentElement.style.setProperty('--cor-primaria', config.corPrimaria);
        document.documentElement.style.setProperty('--cor-fundo', config.corFundo);
        document.documentElement.style.setProperty('--arredondamento', config.arredondamento);
        document.documentElement.setAttribute('data-theme', config.modoEscuro ? 'dark' : 'light');
    }

    const handleSalvar = () => {
        const config = {
            corPrimaria, corFundo, modoEscuro, arredondamento, estiloCard, fonteTamanho
        }
        localStorage.setItem("loja_config", JSON.stringify(config));
        aplicarTema(config);
        alert("Configurações salvas e aplicadas!")
        // TODO: POST /api/lojas/{lojaId}/config
    }

    const handleRestaurar = () => {
        localStorage.removeItem("loja_config");
        window.location.reload();
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
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
                        <Settings size={22} />
                        Definições
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400">Personalize a aparência da sua loja</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={handleRestaurar} className="btn-secondary w-1/2 sm:w-auto">
                        <RefreshCw size={14} /> Restaurar
                    </button>
                    <button onClick={handleSalvar} className="btn-primary w-1/2 sm:w-auto">
                        <Save size={14} /> Salvar
                    </button>
                </div>
            </div>

            {/* TABS INTERNAS */}
            <div className="border-b border-neutral-800">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTabAtiva(t.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
                                tabAtiva === t.id
                                ? "text-[var(--cor-primaria)] border-b-2 border-[var(--cor-primaria)]"
                                : "text-gray-400 hover:text-white"
                            }`}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTEÚDO */}
            <div className="bg-neutral-900 p-4 sm:p-6 rounded-xl border-neutral-800">
                {tabAtiva === "aparencia" && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white">Cores da Marca</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-2 block">Cor Primária</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={corPrimaria} onChange={(e) => setCorPrimaria(e.target.value)} className="w-12 h-12 rounded-lg border-2 border-neutral-800 cursor-pointer"/>
                                    <input type="text" value={corPrimaria} onChange={(e) => setCorPrimaria(e.target.value)} className="flex-1 bg-neutral-800 border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"/>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-300 mb-2 block">Cor de Fundo</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={corFundo} onChange={(e) => setCorFundo(e.target.value)} className="w-12 h-12 rounded-lg border-2 border-neutral-800 cursor-pointer"/>
                                    <input type="text" value={corFundo} onChange={(e) => setCorFundo(e.target.value)} className="flex-1 bg-neutral-800 border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"/>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => aplicarTema({corPrimaria, corFundo, modoEscuro, arredondamento})} className="btn-primary">
                            Aplicar Preview
                        </button>
                    </div>
                )}

                {tabAtiva === "tema" && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white">Tema do App</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setModoEscuro(false)} className={`p-6 rounded-xl border-2 flex-col items-center gap-3 ${!modoEscuro ? "border-[var(--cor-primaria)] bg-[var(--cor-primaria)]/10" : "border-neutral-800 bg-neutral-800"}`}>
                                <Sun size={32} className="text-amber-500" /> <span className="font-medium text-white">Claro</span>
                            </button>
                            <button onClick={() => setModoEscuro(true)} className={`p-6 rounded-xl border-2 flex-col items-center gap-3 ${modoEscuro ? "border-[var(--cor-primaria)] bg-[var(--cor-primaria)]/10" : "border-neutral-800 bg-neutral-800"}`}>
                                <Moon size={32} className="text-purple-500" /> <span className="font-medium text-white">Escuro</span>
                            </button>
                        </div>
                    </div>
                )}

                {tabAtiva === "cards" && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white">Estilo dos Cards</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {["padrao", "glass", "borda"].map(c => (
                                <button key={c} onClick={() => setEstiloCard(c)} className={`p-4 rounded-xl border-2 text-left ${estiloCard === c ? "border-[var(--cor-primaria)] bg-[var(--cor-primaria)]/10" : "border-neutral-800 bg-neutral-800"}`}>
                                    <p className="font-bold text-white capitalize">{c}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {tabAtiva === "notificacoes" && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white">Notificações</h3>
                        {["Estoque Baixo", "Nova Venda", "Cliente Novo"].map(n => (
                            <div key={n} className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                                <p className="font-medium text-white">{n}</p>
                                <div className="w-12 h-6 bg-[var(--cor-primaria)] rounded-full relative"><div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div></div>
                            </div>
                        ))}
                    </div>
                )}

                {tabAtiva === "seguranca" && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white">Segurança</h3>
                        <div className="p-4 bg-neutral-800 rounded-lg">
                            <p className="font-medium text-white">Autenticação 2FA</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
