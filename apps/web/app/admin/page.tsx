"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminClient from "./_componente/AdminClient"; // 👈 CORRIGIDO: _componente com E

const getCookie = (name: string): string | undefined => {
    if (typeof document === "undefined") return undefined;
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name? decodeURIComponent(parts[1]) : r;
    }, '');
};

const clearAllAuth = () => {
    const isProd = process.env.NODE_ENV === 'production';
    const secure = isProd? '; Secure' : '';
    const sameSite = isProd? '; SameSite=None' : '; SameSite=Lax';
    ['token', 'user', 'role'].forEach(name => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${secure}${sameSite}`;
    });
}

export default function AdminDashboard() {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const token = getCookie('token');
        if (!token) {
            clearAllAuth();
            router.replace('/login');
            return;
        }
        setChecking(false); // Tem token, libera o AdminClient buscar os dados
    }, [router]);

    if (checking) return <div className="flex items-center justify-center min-h-screen bg-black"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>;

    return <AdminClient />; // 👈 SEM PROPS
}
