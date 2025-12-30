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

interface SidebarProps {
  isCollapsed: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const location = useLocation();

  return (
    <aside 
      className={cn(
        "bg-white border-r h-screen flex flex-col fixed left-0 top-0 z-10 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("h-16 flex items-center border-b", isCollapsed ? "justify-center" : "px-6")}>
        {isCollapsed ? (
             <span className="text-xl font-bold text-primary">AM</span>
        ) : (
            <h1 className="text-xl font-bold text-primary whitespace-nowrap overflow-hidden">Agenda Master</h1>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("p-4 border-t text-xs text-muted-foreground text-center", isCollapsed && "hidden")}>
        v0.1.0
      </div>
    </aside>
  );
}
