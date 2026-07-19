"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminClient from "./_components/AdminClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  (typeof window!== 'undefined' && window.location.hostname === 'localhost'
   ? "http://127.0.0.1:8000/api/v1"
    : "https://gentle-playfulness-production-d333.up.railway.app/api/v1");

const LOGIN_ROUTE = "/login";

const getCookie = (name: string): string | undefined => {
    if (typeof document === "undefined") return undefined;
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name? decodeURIComponent(parts[1]) : r;
    }, '');
};

const deleteCookie = (name: string) => {
    const isProd = process.env.NODE_ENV === 'production';
    const secure = isProd? '; Secure' : '';
    const sameSite = isProd? '; SameSite=None' : '; SameSite=Lax';
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${secure}${sameSite}`;
};

const clearAllAuth = () => {
    ['token', 'user', 'role'].forEach(deleteCookie);
}

export default function AdminDashboard() {
    const router = useRouter();
    const [data, setData] = useState<{lojas: any[], donos: any[]} | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = getCookie('token');
        if (!token) {
            clearAllAuth();
            router.replace(LOGIN_ROUTE);
            return;
        }

        let timeout = setTimeout(() => { // 👈 ANTI-TRAVAMENTO 4s
            clearAllAuth();
            router.replace(LOGIN_ROUTE);
        }, 4000);

        const getData = async () => {
            try {
                const [lojasRes, donosRes] = await Promise.all([
                    fetch(`${API_URL}/lojas`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
                    fetch(`${API_URL}/lojas/donos`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
                ]);

                clearTimeout(timeout);

                if (lojasRes.status === 401 || donosRes.status === 401) {
                    clearAllAuth();
                    router.replace(LOGIN_ROUTE);
                    return;
                }
                if(!lojasRes.ok ||!donosRes.ok) throw new Error("Erro ao buscar");

                const lojas = await lojasRes.json();
                const donos = await donosRes.json();
                setData({ lojas, donos });
            } catch {
                clearAllAuth();
                router.replace(LOGIN_ROUTE);
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
