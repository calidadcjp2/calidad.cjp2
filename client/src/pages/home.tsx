import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, HeartPulse, Activity as ActivityIcon, FileText, BookOpen, CalendarClock, ListTodo, Users, Settings, ClipboardCheck, BarChart3, Microscope, AlertOctagon, TrendingUp } from "lucide-react";
import { useActivities } from "@/context/ActivityContext";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { APP_ROLE_LABELS } from "@/lib/types";

export default function Home() {
  const { activities, settings } = useActivities();
  const { user, hasRouteAccess } = useAuth();

  const moduleLinks = [
    {
      title: "Panel de Calidad",
      description: "Auditorías, protocolos y mejora continua.",
      icon: Shield,
      href: "/calidad",
      color: "bg-blue-50 text-blue-600 border-blue-200"
    },
    {
      title: "Seguridad del Paciente",
      description: "Eventos adversos y eventos centinela.",
      icon: HeartPulse,
      href: "/seguridad_paciente",
      color: "bg-amber-50 text-amber-600 border-amber-200"
    },
    {
      title: "Vigilancia IAAS",
      description: "Sospechas y brotes confirmados.",
      icon: ActivityIcon,
      href: "/iaas",
      color: "bg-emerald-50 text-emerald-600 border-emerald-200"
    },
    {
      title: "Investigación IAAS",
      description: "Análisis causa-raíz de IAAS confirmadas.",
      icon: Microscope,
      href: "/investigacion-iaas",
      color: "bg-lime-50 text-lime-600 border-lime-200"
    },
    {
      title: "Eventos Adversos",
      description: "Registro tipo MINSAL de eventos adversos.",
      icon: AlertOctagon,
      href: "/eventos-adversos",
      color: "bg-orange-50 text-orange-600 border-orange-200"
    },
    {
      title: "Gestión de Reclamos",
      description: "Reclamos OIRS, plazos y resoluciones.",
      icon: FileText,
      href: "/reclamos",
      color: "bg-purple-50 text-purple-600 border-purple-200"
    },
    {
      title: "Gestión Documental",
      description: "Control de versiones y vigencias.",
      icon: BookOpen,
      href: "/documentos",
      color: "bg-indigo-50 text-indigo-600 border-indigo-200"
    },
    {
      title: "Tareas Periódicas",
      description: "Recordatorios de reportes y reuniones.",
      icon: CalendarClock,
      href: "/tareas",
      color: "bg-rose-50 text-rose-600 border-rose-200"
    },
    {
      title: "Planes de Acción",
      description: "Acciones correctivas y plazos.",
      icon: ClipboardCheck,
      href: "/planes-accion",
      color: "bg-teal-50 text-teal-600 border-teal-200"
    },
    {
      title: "Formación y Accesos",
      description: "Colaboradores y plataformas.",
      icon: Users,
      href: "/colaboradores",
      color: "bg-cyan-50 text-cyan-600 border-cyan-200"
    },
    {
      title: "Indicadores Automáticos",
      description: "KPIs calculados desde datos del sistema.",
      icon: TrendingUp,
      href: "/indicadores-auto",
      color: "bg-violet-50 text-violet-600 border-violet-200"
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 max-w-5xl mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bienvenido, {user?.name || settings.userName}</h1>
          <p className="text-slate-500 mt-1">Plataforma integral de gestión hospitalaria y calidad.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 border border-slate-200">
             <Users className="w-4 h-4" />
             Rol: <Badge variant="secondary" className="ml-1">{user ? APP_ROLE_LABELS[user.role] : settings.userRole}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Acceso Rápido Pendientes */}
        <Link href="/pendientes">
          <a className="lg:col-span-3 block group">
            <div className="bg-slate-900 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden transition-transform group-hover:scale-[1.01] duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-50"></div>
              <div className="relative z-10 flex items-center gap-5">
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                  <ListTodo className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Vista Consolidada de Pendientes</h2>
                  <p className="text-slate-300">Revisa todas las tareas atrasadas, próximas a vencer e investigaciones abiertas.</p>
                </div>
              </div>
              <div className="relative z-10 hidden md:block">
                 <div className="bg-white text-slate-900 font-semibold px-6 py-3 rounded-full hover:bg-slate-100 transition-colors">
                   Revisar Alertas
                 </div>
              </div>
            </div>
          </a>
        </Link>

        {moduleLinks.filter(mod => hasRouteAccess(mod.href)).map((mod, i) => (
          <Link key={i} href={mod.href}>
            <a className="block group h-full">
              <Card className="h-full border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 bg-white">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${mod.color} group-hover:scale-110 transition-transform duration-300`}>
                    <mod.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{mod.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{mod.description}</p>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
        
        {user?.role === 'administrador' && (
           <Link href="/admin">
            <a className="block group h-full">
              <Card className="h-full border-dashed border-2 border-slate-300 shadow-none hover:border-primary hover:bg-slate-50 transition-all duration-300 bg-transparent">
                <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center min-h-[160px]">
                  <Settings className="w-8 h-8 text-slate-400 mb-3 group-hover:text-primary transition-colors" />
                  <h3 className="text-md font-bold text-slate-700 mb-1 group-hover:text-primary">Administración</h3>
                  <p className="text-xs text-slate-500">Ajustes del sistema y diccionarios</p>
                </CardContent>
              </Card>
            </a>
          </Link>
        )}
      </div>

    </div>
  );
}
