import { Link, useLocation } from "wouter";
import { LayoutDashboard, Menu, Shield, Activity, FileText, Settings, HeartPulse, UserRoundCheck, BookOpen, CalendarClock, ListTodo, Home, BarChart3, ClipboardCheck, Users, RefreshCw, Loader2, AlertCircle, LogOut, Microscope, AlertOctagon, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { APP_ROLE_LABELS, convertLogoUrl } from "@/lib/types";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { settings, isLoading, error, refreshData } = useActivities();
  const { user, logout, hasRouteAccess } = useAuth();

  const allNavItems = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/dashboard", label: "Dashboard Comité", icon: LayoutDashboard },
    { href: "/pendientes", label: "Alertas y Pendientes", icon: ListTodo },
    { href: "/indicadores", label: "Indicadores de Calidad", icon: BarChart3 },
    { href: "/seguridad_paciente", label: "Seguridad del Paciente", icon: HeartPulse },
    { href: "/iaas", label: "Vigilancia IAAS", icon: Activity },
    { href: "/investigacion-iaas", label: "Investigación IAAS", icon: Microscope },
    { href: "/eventos-adversos", label: "Eventos Adversos", icon: AlertOctagon },
    { href: "/reclamos", label: "Gestión de Reclamos", icon: FileText },
    { href: "/documentos", label: "Gestión Documental", icon: BookOpen },
    { href: "/tareas", label: "Tareas Periódicas", icon: CalendarClock },
    { href: "/planes-accion", label: "Planes de Acción", icon: ClipboardCheck },
    { href: "/colaboradores", label: "Formación y Accesos", icon: Users },
    { href: "/indicadores-auto", label: "Indicadores Automáticos", icon: TrendingUp },
  ];

  const navItems = allNavItems.filter(item => hasRouteAccess(item.href));
  const showAdmin = user?.role === 'administrador';
  const adminItem = { href: "/admin", label: "Administración", icon: Settings };

  const displayName = user?.name || settings.userName;
  const displayRole = user ? APP_ROLE_LABELS[user.role] : settings.userRole;
  const displayInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : settings.userInitials;

  const NavLinks = () => (
    <>
      <div className="space-y-1.5 mb-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}>
              <Icon className={`h-5 w-5 mr-3 ${isActive ? "text-primary-foreground" : "text-slate-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
      
      {showAdmin && (
        <div>
          <h4 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Configuración</h4>
          <Link href={adminItem.href} className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            location.startsWith(adminItem.href) 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}>
            <adminItem.icon className={`h-5 w-5 mr-3 ${location.startsWith(adminItem.href) ? "text-primary-foreground" : "text-slate-400"}`} />
            {adminItem.label}
          </Link>
        </div>
      )}
    </>
  );

  const resolvedLogoUrl = settings.logoUrl ? convertLogoUrl(settings.logoUrl) : '';

  const LogoArea = () => (
    <div className="flex items-center justify-center gap-3 w-full">
      {resolvedLogoUrl ? (
        <img src={resolvedLogoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <div className="flex items-center justify-center bg-primary rounded-md p-1.5 shadow-sm">
          <UserRoundCheck className="h-5 w-5 text-primary-foreground" />
        </div>
      )}
      <span className="font-bold text-lg text-slate-900 tracking-tight truncate">{settings.appName}</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50/50">
      <aside className="w-64 bg-white border-r border-slate-200 flex-col hidden lg:flex">
        <div className="h-16 flex items-center px-4 border-b border-slate-200 shrink-0">
          <LogoArea />
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-slate-200 shrink-0 space-y-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Actualizando...' : 'Actualizar Datos'}
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                {displayInitials}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-slate-900 leading-tight truncate">{displayName}</p>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{displayRole}</Badge>
                </div>
              </div>
            </div>
            <Button
              data-testid="button-logout"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-600 shrink-0"
              onClick={logout}
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:hidden shrink-0">
          <div className="flex items-center flex-1 pr-4">
            <LogoArea />
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col">
              <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
              <div className="h-16 flex items-center px-4 border-b border-slate-200 shrink-0">
                <LogoArea />
              </div>
              <nav className="flex-1 overflow-y-auto p-4">
                <NavLinks />
              </nav>
              <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                    {displayInitials}
                  </div>
                  <div className="ml-2 overflow-hidden">
                    <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{displayRole}</Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-600 shrink-0"
                  onClick={logout}
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto h-full">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-slate-500 text-lg">Cargando datos desde Google Sheets...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
                <AlertCircle className="h-10 w-10 text-red-500" />
                <p className="text-red-600 text-lg font-medium">Error al cargar datos</p>
                <p className="text-slate-500 text-sm max-w-md text-center">{error}</p>
                <Button onClick={refreshData} variant="outline" className="gap-2 mt-2">
                  <RefreshCw className="h-4 w-4" />
                  Reintentar
                </Button>
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
