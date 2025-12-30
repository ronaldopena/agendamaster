import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Building } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from 'lucide-react';
import { unitService } from '@/services/unitService';
import { Unidade } from '@/types';

export default function MainLayout() {
  const { session, loading, signOut, user, perfil, unidadeAtual, mudarUnidade, organizacao } = useAuth();
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unidade[]>([]);

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login');
    }
  }, [session, loading, navigate]);

  useEffect(() => {
    if (organizacao && (perfil?.tipo === 'admin' || perfil?.tipo === 'gerente')) {
      unitService.getUnits(organizacao.id).then(setUnits).catch(console.error);
    }
  }, [organizacao, perfil]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  const canChangeUnit = perfil?.tipo === 'admin' || perfil?.tipo === 'gerente';

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      
      <div className={cn("flex flex-col min-h-screen transition-all duration-300", isSidebarCollapsed ? "pl-16" : "pl-64")}>
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="mr-2"
            >
              {isSidebarCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>

            {organizacao && (
              <div className="flex items-center gap-2 mr-2 border-r pr-4 border-gray-200">
                <span className="font-semibold text-gray-700">{organizacao.nome}</span>
              </div>
            )}

            {canChangeUnit ? (
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-500" />
                <Select
                  value={unidadeAtual?.id || ''}
                  onValueChange={(value) => mudarUnidade(value)}
                >
                  <SelectTrigger className="w-[280px] h-9">
                    <SelectValue placeholder="Selecione uma unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              unidadeAtual ? (
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">{unidadeAtual.nome}</span>
                </div>
              ) : (
                <div className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200">
                  Nenhuma unidade selecionada
                </div>
              )
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-medium leading-none text-gray-900">{perfil?.nome || 'Usuário'}</span>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
            </div>
            
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
               <UserIcon className="w-4 h-4" />
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => signOut()}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 ml-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
