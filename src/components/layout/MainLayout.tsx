import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Building } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
      <Sidebar />
      
      <div className="pl-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                   <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                     <UserIcon className="w-4 h-4" />
                   </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{perfil?.nome || 'Usuário'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs text-primary mt-1 capitalize">{perfil?.tipo}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
