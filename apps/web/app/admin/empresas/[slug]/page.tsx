"use client"

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, FileText, BarChart3, ShieldAlert, Upload, Ban, CheckCircle2, Users, User, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/api";

type Company = {
  name: string;
  slug: string;
  status: "Ativa" | "Inativa" | "Pendente";
  logo_url: string | null;
  localizacao: string;
  ano_fundacao: number;
  total_funcionarios: number;
  total_vendas_30d: number;
  documentos: { id: number; nome: string; tipo: string }[];
  manager: { name: string; email: string; phone: string } | null;
};

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/login");
      return;
    }

    const fetchCompany = async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`/lojas/${slug}`); // <- 1. CORRIGIDO AQUI: /lojas em vez de /company
        setCompany(data);
      } catch (err: any) {
        setError(err.message);
        if (err.status === 401 || err.message.includes("Não autorizado")) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [slug, router]);

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-500" />
      </main>
    );
  }

  if (error) return <div className="p-8 text-center text-destructive">{error}</div>;
  if (!company) return null;

  const isActive = company.status === "Ativa";

  return (
    <div className="p-4 md:p-8 space-y-6 bg-background text-foreground min-h-screen">

      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-border">
            <AvatarImage src={company.logo_url || undefined} alt={company.name} />
            <AvatarFallback className="bg-muted text-lg md:text-2xl font-bold text-brand">
              {company.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight break-words">{company.name}</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {company.localizacao} • Fundada em {company.ano_fundacao}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Badge variant={isActive? "default" : "destructive"} className={isActive? "bg-green-600 text-white flex-shrink-0" : "flex-shrink-0"}>
            {isActive? <CheckCircle2 className="mr-1 h-3 w-3" /> : <Ban className="mr-1 h-3 w-3" />}
            {company.status}
          </Badge>
          <Button variant="outline" className="border-border flex-1 sm:flex-none">
            {isActive? <Ban className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {isActive? "Desativar" : "Ativar"}
          </Button>
        </div>
      </header>

      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="bg-muted border-border h-auto p-1 w-full justify-start overflow-x-auto scrollbar-none">
          <TabsTrigger value="dados" className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-none flex-shrink-0">
            <Building2 className="mr-2 h-4 w-4" /> Dados
          </TabsTrigger>
          <TabsTrigger value="documentos" className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-none flex-shrink-0">
            <FileText className="mr-2 h-4 w-4" /> Documentos
          </TabsTrigger>
          <TabsTrigger value="estatisticas" className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-none flex-shrink-0">
            <BarChart3 className="mr-2 h-4 w-4" /> Estatísticas
          </TabsTrigger>
          <TabsTrigger value="risco" className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-none flex-shrink-0">
            <ShieldAlert className="mr-2 h-4 w-4" /> Risco
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
          <Card className="bg-card border-border text-card-foreground">
            <CardHeader><CardTitle className="text-base">Informações Base</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Slug:</span> {company.slug}</p>
              <p><span className="text-muted-foreground">Ano Fundação:</span> {company.ano_fundacao}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border text-card-foreground">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User size={16}/> Gerente Responsável</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              {company.manager ? (
                <>
                  <p className="font-semibold">{company.manager.name}</p>
                  <p className="text-muted-foreground break-all">{company.manager.email}</p>
                  <p className="text-muted-foreground">{company.manager.phone}</p>
                </>
              ) : (
                <p className="text-muted-foreground">Nenhum gerente atribuído.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border text-card-foreground md:col-span-2 lg:col-span-1">
            <CardHeader><CardTitle className="text-base">Localização</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">{company.localizacao}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="mt-6">
          <Card className="bg-card border-border text-card-foreground">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <CardTitle>Documentos KYC</CardTitle>
                <CardDescription className="text-muted-foreground">PDFs que comprovam a empresa</CardDescription>
              </div>
              <Button className="bg-green-600 hover:bg-green-500 w-full sm:w-auto">
                <Upload className="mr-2 h-4 w-4" /> Enviar PDF
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {company.documentos.map(doc => (
                  <li key={doc.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg bg-muted/50 gap-2">
                    <span className="text-sm break-all">{doc.tipo}: {doc.nome}</span>
                    <Button variant="ghost" size="sm" className="w-full sm:w-auto">Ver PDF</Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estatisticas" className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          <Card className="bg-card border-border text-card-foreground">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 size={16}/> Status de Uso</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-500">Ativo</p><p className="text-xs text-muted-foreground">{company.total_vendas_30d} vendas nos últimos 30 dias</p></CardContent>
          </Card>
          <Card className="bg-card border-border text-card-foreground">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users size={16}/> Funcionários</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{company.total_funcionarios}</p><p className="text-xs text-muted-foreground">Total registados. Sem listar nomes.</p></CardContent>
          </Card>
          <Card className="bg-card border-border text-card-foreground sm:col-span-2 lg:col-span-1">
            <CardHeader><CardTitle className="text-base">Vendas 30 Dias</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{company.total_vendas_30d}</p></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risco" className="mt-6">
          <Card className="bg-card border-border text-card-foreground">
            <CardHeader><CardTitle>Risco & Compliance</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">Aqui vai status de pagamento, logs de acesso suspeitos, etc.</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}