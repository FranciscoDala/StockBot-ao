export const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);

export const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-AO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

// NOVO: Mostra "Hoje", "Ontem" ou data normal
export const formatDataRelativa = (dateString: string): string => {
    if (!dateString) return '-';

    const data = new Date(dateString);
    const agora = new Date();

    // Zera as horas pra comparar só o dia
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    const dataDia = new Date(data.getFullYear(), data.getMonth(), data.getDate());

    const hora = data.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });

    if (dataDia.getTime() === hoje.getTime()) {
        return `Hoje, ${hora}`;
    }
    if (dataDia.getTime() === ontem.getTime()) {
        return `Ontem, ${hora}`;
    }

    // Se for mais antigo: mostra data normal
    const dataFormatada = data.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${dataFormatada}, ${hora}`;
}
