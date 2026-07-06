import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rota para onde o usuário vai se não estiver logado
const LOGIN_ROUTE = '/login'

/**
 * Função principal do Middleware
 * Ela roda ANTES de qualquer página carregar
 * Serve como "porteiro" pra travar as rotas
 */
export function middleware(request: NextRequest) {
  // 1. PEGA OS COOKIES: Aqui pegamos os cookies que vem do browser
  // 'token' = usuário logado normal
  // 'temp_token' = usuário que ainda não trocou a senha
  // 'role' = papel do usuário: 'admin' ou 'dono'. Precisas salvar isso no login
  const token = request.cookies.get('token')?.value
  const temp_token = request.cookies.get('temp_token')?.value
  const role = request.cookies.get('role')?.value

  // 2. PEGA A URL: Pegamos qual rota o usuário está tentando acessar
  // Ex: /admin, /loja/minha-loja, /login
  const pathname = request.nextUrl.pathname

  /**
   * REGRA 1: PROTEGER PAINEL ADMIN
   * Se a rota começa com /admin
   * Só deixa entrar quem tem token ou temp_token
   */
  if (pathname.startsWith('/admin')) {
    // Se NÃO tem nenhum dos 2 tokens
    if (!token && !temp_token) {
      // Redireciona direto pro login. Nem renderiza a página
      return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url))
    }

    // REGRA 1.1: BLOQUEAR DONO DE ENTRAR NO ADMIN
    // Se tem token mas o role é 'dono', joga ele pra /loja
    if (role === 'dono') {
      // Pega a primeira loja dele. Se não tiver, cai no /login
      return NextResponse.redirect(new URL('/loja', request.url))
    }
  }

  /**
   * REGRA 2: PROTEGER PAINEL DA LOJA
   * Se a rota começa com /loja/
   * Só deixa entrar quem tem token ou temp_token
   */
  if (pathname.startsWith('/loja/')) {
    // Se NÃO tem nenhum dos 2 tokens
    if (!token && !temp_token) {
      // Redireciona direto pro login
      return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url))
    }
  }

  /**
   * REGRA 3: EVITAR VOLTAR PRO LOGIN ESTANDO LOGADO
   * Se o usuário já está logado e tenta acessar / ou /login
   * Jogamos ele direto pro painel correto
   */
  if (pathname === '/' || pathname === '/login') {
    // Se TEM token ou temp_token
    if (token || temp_token) {
      // Se for dono, manda pra /loja. Se for admin, manda pra /admin
      const redirectTo = role === 'dono' ? '/loja' : '/admin'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
  }

  /**
   * SE PASSOU EM TODAS AS REGRAS
   * Deixa o usuário seguir para a página que ele pediu
   */
  return NextResponse.next()
}

/**
 * CONFIGURAÇÃO DO MATCHER
 * Aqui dizemos para o Next: "Ei, roda esse middleware nessas rotas"
 *
 * '/admin/:path*' = Protege /admin e tudo dentro /admin/qualquer-coisa
 * '/loja/:path*' = Protege /loja e tudo dentro /loja/qualquer-coisa
 * '/' = Protege a página inicial
 * '/login' = Protege a página de login
 */
export const config = {
  matcher: ['/admin/:path*', '/loja/:path*', '/', '/login'],
}
