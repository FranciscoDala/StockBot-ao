"use client"; // <- MUDANÇA 1: vira client

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminClient from "./_components/AdminClient";


const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? "http://127.0.0.1:8000/api/v1" // Local
  : "https://gentle-playfulness-production-d333.up.railway.app/api/v1"; // Produção HTTPS

const getCookie = (name: string): string | undefined => {
    if (typeof window === "undefined") return undefined;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match? decodeURIComponent(match[2]) : undefined;
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
