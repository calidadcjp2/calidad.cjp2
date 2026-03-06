import { useActivities } from "@/context/ActivityContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, Activity, FileText, BookOpen, Shield, Microscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isPast, differenceInDays, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { IAAS_INFECTION_LABELS, IaasInfectionType } from "@/lib/types";

export default function Pending() {
  const { activities, documents, periodicTasks, iaasSuspects } = useActivities();

  const today = new Date();

  // 1. Actividades/Reclamos vencidos
  const overdueClaims = activities.filter(a => 
    a.area === 'reclamos' && 
    a.claimStatus !== 'resolved' && 
    a.deadline && isPast(new Date(a.deadline))
  ).map(a => ({
    id: a.id,
    type: 'Reclamo OIRS',
    title: a.title,
    date: a.deadline!,
    icon: FileText,
    color: 'red'
  }));

  // 2. IAAS Activos (no tienen fecha de vto, pero están abiertos)
  const activeIaas = activities.filter(a => 
    a.area === 'iaas' && 
    a.investigationStatus !== 'closed'
  ).map(a => ({
    id: a.id,
    type: 'Investigación IAAS',
    title: a.title,
    date: a.date,
    icon: Activity,
    color: 'amber'
  }));

  // 3. Documentos vencidos o por vencer (< 30 días)
  const upcomingDocs = documents.filter(d => {
    if (d.status !== 'active') return false;
    const daysLeft = differenceInDays(new Date(d.expirationDate), today);
    return daysLeft <= 30;
  }).map(d => {
    const isOverdue = isPast(new Date(d.expirationDate));
    return {
      id: d.id,
      type: 'Doc. Institucional',
      title: d.name,
      date: d.expirationDate,
      icon: BookOpen,
      color: isOverdue ? 'red' : 'amber',
      extraInfo: `Versión ${d.version}`
    };
  });

  // 4. Tareas periódicas vencidas o por vencer (< 7 días)
  const upcomingTasks = periodicTasks.filter(t => {
    if (t.status !== 'active') return false;
    const daysLeft = differenceInDays(new Date(t.nextDueDate), today);
    return daysLeft <= 7; // Alerta de 1 semana para tareas
  }).map(t => {
    const isOverdue = isPast(new Date(t.nextDueDate));
    return {
      id: t.id,
      type: 'Tarea Periódica',
      title: t.title,
      date: t.nextDueDate,
      icon: Clock,
      color: isOverdue ? 'red' : 'amber',
      extraInfo: t.responsible
    };
  });

  // 5. Vigilancia IAAS - sospechas pendientes y alertas epidemiológicas
  const pendingSuspects = iaasSuspects.filter(s =>
    s.status === 'pendiente' || s.status === 'en_investigacion'
  ).map(s => ({
    id: s.id,
    type: 'Sospecha IAAS',
    title: `${s.patientName} — ${IAAS_INFECTION_LABELS[s.infectionType]} (${s.service})`,
    date: s.detectionDate,
    icon: Microscope,
    color: s.status === 'pendiente' ? 'amber' as const : 'amber' as const,
    extraInfo: s.notifyingProfessional
  }));

  // Cluster/outbreak alerts from vigilancia
  const vigilanciaAlerts: typeof overdueClaims = [];
  const activeSuspects = iaasSuspects.filter(s => s.status !== 'descartado');
  const byServiceType: Record<string, typeof activeSuspects> = {};
  activeSuspects.forEach(s => {
    const key = `${s.service}|${s.infectionType}`;
    if (!byServiceType[key]) byServiceType[key] = [];
    byServiceType[key].push(s);
  });
  Object.entries(byServiceType).forEach(([key, group]) => {
    const [service, infType] = key.split('|');
    for (let i = 0; i < group.length; i++) {
      const within72h = group.filter((s, j) => j !== i && Math.abs(differenceInHours(new Date(s.detectionDate), new Date(group[i].detectionDate))) <= 72);
      if (within72h.length >= 1) {
        vigilanciaAlerts.push({
          id: `alert-${key}`,
          type: 'Alerta IAAS',
          title: `Agrupamiento: ${within72h.length + 1} casos de ${IAAS_INFECTION_LABELS[infType as IaasInfectionType]} en ${service}`,
          date: group[i].detectionDate,
          icon: AlertTriangle,
          color: 'red' as const
        });
        break;
      }
    }
  });

  const allItems = [...overdueClaims, ...activeIaas, ...upcomingDocs, ...upcomingTasks, ...pendingSuspects, ...vigilanciaAlerts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const criticalItems = allItems.filter(i => i.color === 'red');
  const warningItems = allItems.filter(i => i.color === 'amber');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pendientes y Alertas</h1>
        <p className="text-slate-500 mt-2 text-lg">Consolidado de tareas atrasadas, próximas a vencer e investigaciones abiertas en todas las áreas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="border-red-200 bg-red-50/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-red-800">Alertas Críticas (Vencidas)</p>
               <p className="text-3xl font-bold text-red-900">{criticalItems.length}</p>
             </div>
             <AlertTriangle className="h-10 w-10 text-red-500 opacity-80" />
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-amber-800">Atención Requerida (Por vencer / En curso)</p>
               <p className="text-3xl font-bold text-amber-900">{warningItems.length}</p>
             </div>
             <Clock className="h-10 w-10 text-amber-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {allItems.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-lg font-medium text-slate-900">¡Todo al día!</p>
            <p className="text-slate-500 mt-1">No hay elementos pendientes o atrasados en el sistema.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {allItems.map((item, idx) => {
              const Icon = item.icon;
              const isRed = item.color === 'red';
              return (
              <div key={`${item.id}-${idx}`} className="p-4 hover:bg-slate-50 flex items-start gap-4 transition-colors">
                <div className={`mt-1 p-2 rounded-full shrink-0 ${isRed ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${isRed ? 'border-red-200 text-red-700' : 'border-amber-200 text-amber-700'}`}>
                      {item.type}
                    </Badge>
                    {isRed && <Badge variant="destructive" className="text-[10px] h-5">Vencido</Badge>}
                  </div>
                  <h4 className="font-semibold text-slate-900 truncate pr-4" title={item.title}>{item.title}</h4>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span className={`font-medium ${isRed ? 'text-red-600' : ''}`}>
                      {item.type === 'Investigación IAAS' ? 'Fecha Reporte: ' : 'Vencimiento/Límite: '}
                      {format(new Date(item.date), "dd/MM/yyyy")}
                    </span>
                    {item.extraInfo && (
                      <>
                        <span>•</span>
                        <span className="truncate">{item.extraInfo}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
