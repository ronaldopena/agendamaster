import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Stethoscope, Building2, Settings, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'Agenda', path: '/agenda' },
  { icon: Users, label: 'Pacientes', path: '/pacientes' },
  { icon: Stethoscope, label: 'Médicos', path: '/medicos' },
  { icon: Building2, label: 'Unidades', path: '/unidades' },
  { icon: UserCog, label: 'Perfis', path: '/perfis' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r h-screen flex flex-col fixed left-0 top-0 z-10">
      <div className="h-16 flex items-center px-6 border-b">
        <h1 className="text-xl font-bold text-primary">Agenda Master</h1>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t text-xs text-gray-500 text-center">
        v0.1.0
      </div>
    </aside>
  );
}
