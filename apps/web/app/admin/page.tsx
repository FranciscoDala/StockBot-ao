import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminClient from "./_components/AdminClient";

const API_URL = "http://127.0.0.1:8000/api/v1";

async function getData(token: string) {
    const [lojasRes, donosRes] = await Promise.all([
        fetch(`${API_URL}/lojas`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
        fetch(`${API_URL}/lojas/donos`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    ]);
    if (lojasRes.status === 401 || donosRes.status === 401) redirect('/login');
    return {
        lojas: await lojasRes.json(),
        donos: await donosRes.json(),
    }
}

export default async function AdminDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) redirect('/login');

    const { lojas, donos } = await getData(token);

    return <AdminClient lojasIniciais={lojas} donosIniciais={donos} />;
}
