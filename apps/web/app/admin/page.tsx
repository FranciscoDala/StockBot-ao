"use client"; // <- MUDANÇA 1: vira client

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminClient from "./_components/AdminClient";


const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? "https://gentle-playfulness-production-d333.up.railway.app/api/v1" : "http://127.0.0.1:8000/api/v1");


const getCookie = (name: string): string | undefined => { // <- MUDANÇA 2: helper aqui
    if (typeof window === "undefined") return undefined;
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name? decodeURIComponent(parts[1]) : r;
    }, '');
};

export default function AdminDashboard() {
    const router = useRouter();
    const [data, setData] = useState<{lojas: any[], donos: any[]} | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { // <- MUDANÇA 3: busca no client
        const token = getCookie('token');
        if (!token) { router.replace('/login'); return; }

        const getData = async () => {
            try {
                const [lojasRes, donosRes] = await Promise.all([
                    fetch(`${API_URL}/lojas`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
                    fetch(`${API_URL}/lojas/donos`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
                ]);
                if (lojasRes.status === 401 || donosRes.status === 401) { router.replace('/login'); return; }

                const lojas = await lojasRes.json();
                const donos = await donosRes.json();
                setData({ lojas, donos });
            } catch {
                router.replace('/login');
            } finally {
                setLoading(false);
            }
        }
        getData();
    }, [router]);

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-black"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>;
    if (!data) return null;

    return <AdminClient lojasIniciais={data.lojas} donosIniciais={data.donos} />;
}
