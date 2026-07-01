import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react'; // npm i lucide-react

export function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Apaga o token e dados do user
    localStorage.removeItem('access_token');
    localStorage.removeItem('user'); 
    
    // 2. Manda pra tela de login e limpa o histórico pra não voltar com "voltar" do browser
    navigate('/login', { replace: true });
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition"
    >
      <LogOut size={18} />
      Terminar Sessão
    </button>
  );
}