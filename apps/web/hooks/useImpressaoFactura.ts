const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export function useImpressaoFactura() {
    const imprimir = (vendaId: string | number) => {
        window.open(`${API_URL}/vendas/${vendaId}/imprimir`, '_blank');
    };

    return { imprimir };
}
