import { useActivities } from "@/context/ActivityContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, HeartPulse, Activity as ActivityIcon, FileText, AlertTriangle, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isPast, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { AREA_LABELS } from "@/lib/types";
import { AreaCard } from "@/components/area-card";

export default function Dashboard() {
  const { activities, statuses } = useActivities();

  // Cálculos para KPIs del Comité de Calidad
  const today = new Date();
  
  // Seguridad del Paciente: Eventos Centinela y Graves
  const severeEvents = activities.filter(a => 
    a.area === 'seguridad_paciente' && 
    (a.severity === 'high' || a.severity === 'sentinel')
  );

  // IAAS: Infecciones Activas / Abiertas
  const activeInfections = activities.filter(a => 
    a.area === 'iaas' && 
    a.investigationStatus !== 'closed'
  );

  // Reclamos: Vencidos
  const overdueClaims = activities.filter(a => 
    a.area === 'reclamos' && 
    a.claimStatus !== 'resolved' && 
    a.deadline && isPast(new Date(a.deadline))
  );

  const getStatusBadge = (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    if (!status) return <Badge>Desconocido</Badge>;
    
    const colorClasses: Record<string, string> = {
      emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      amber: "bg-amber-100 text-amber-800 border-amber-200",
      slate: "bg-slate-100 text-slate-800 border-slate-200",
      red: "bg-red-100 text-red-800 border-red-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
    };

    return <Badge variant="outline" className={`${colorClasses[status.color]} font-medium`}>{status.label}</Badge>;
  };

  const getAreaIcon = (area: string) => {
    switch (area) {
      case 'calidad': return Shield;
      case 'seguridad_paciente': return HeartPulse;
      case 'iaas': return ActivityIcon;
      case 'reclamos': return FileText;
      default: return Shield;
    }
  };

  const recentActivities = [...activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Comité de Calidad</h1>
        <p className="text-slate-500 mt-2 text-lg">Resumen ejecutivo de indicadores de calidad y seguridad hospitalaria.</p>
      </div>

      {/* KPI Alertas Críticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="border-red-200 shadow-sm bg-red-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <Badge variant="destructive" className="bg-red-500">Crítico</Badge>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">{severeEvents.length}</h3>
            <p className="text-sm font-medium text-slate-700 mt-1">Eventos Adversos Graves/Centinela</p>
            <p className="text-xs text-slate-500 mt-2">Requieren análisis de causa raíz inmediato.</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-sm bg-amber-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                <ActivityIcon className="h-5 w-5 text-amber-600" />
              </div>
               <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">Vigilancia</Badge>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">{activeInfections.length}</h3>
            <p className="text-sm font-medium text-slate-700 mt-1">Brotes IAAS Activos</p>
            <p className="text-xs text-slate-500 mt-2">Investigaciones epidemiológicas en curso.</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 shadow-sm bg-orange-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50">Riesgo Legal</Badge>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">{overdueClaims.length}</h3>
            <p className="text-sm font-medium text-slate-700 mt-1">Reclamos OIRS Vencidos</p>
            <p className="text-xs text-slate-500 mt-2">Fuera del plazo legal de respuesta (15 días).</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <AreaCard 
          title={AREA_LABELS.calidad} 
          icon={Shield} 
          count={activities.filter(a => a.area === 'calidad').length} 
          colorTheme="blue" 
          href="/calidad"
        />
        <AreaCard 
          title={AREA_LABELS.seguridad_paciente} 
          icon={HeartPulse} 
          count={activities.filter(a => a.area === 'seguridad_paciente').length} 
          colorTheme="amber"
          href="/seguridad_paciente"
        />
        <AreaCard 
          title={AREA_LABELS.iaas} 
          icon={ActivityIcon} 
          count={activities.filter(a => a.area === 'iaas').length} 
          colorTheme="emerald"
          href="/iaas"
        />
        <AreaCard 
          title={AREA_LABELS.reclamos} 
          icon={FileText} 
          count={activities.filter(a => a.area === 'reclamos').length} 
          colorTheme="purple"
          href="/reclamos"
        />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Últimos Registros Relevantes</h2>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {recentActivities.length === 0 ? (
               <div className="p-8 text-center text-slate-500">No hay registros recientes.</div>
            ) : (
              recentActivities.map(activity => {
                const AreaIcon = getAreaIcon(activity.area);
                return (
                <div key={activity.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        <AreaIcon className="h-3.5 w-3.5" />
                        {AREA_LABELS[activity.area]}
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 truncate">{activity.title}</h3>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{activity.description}</p>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2 shrink-0">
                    {getStatusBadge(activity.statusId)}
                    <span className="text-xs font-medium text-slate-400">
                      {format(new Date(activity.date), "d MMM yyyy", { locale: es })}
                    </span>
                  </div>
                </div>
              )})
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
