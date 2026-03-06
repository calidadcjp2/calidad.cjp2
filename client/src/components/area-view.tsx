import { useState } from "react";
import { useActivities } from "@/context/ActivityContext";
import { Activity, WorkArea } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, Filter, AlertTriangle, ShieldAlert, Clock, Info, Eye, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isPast } from "date-fns";
import { ActivityForm } from "@/components/activity-form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AreaViewProps {
  area: WorkArea;
  title: string;
  description: string;
}

export function AreaView({ area, title, description }: AreaViewProps) {
  const { activities, deleteActivity, statuses, caseTypes, settings } = useActivities();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);

  const handleEdit = (activity: Activity) => {
    setActivityToEdit(activity);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setActivityToEdit(null);
    setIsFormOpen(true);
  };

  const isReadOnly = settings.systemRole === 'viewer';
  const isAdmin = settings.systemRole === 'admin';

  const areaActivities = activities.filter(a => a.area === area);

  const filteredActivities = areaActivities.filter(a => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      a.title.toLowerCase().includes(searchLower) || 
      a.description.toLowerCase().includes(searchLower) ||
      a.responsible.toLowerCase().includes(searchLower) ||
      (a.sequentialId && a.sequentialId.toLowerCase().includes(searchLower));
    
    const matchesStatus = statusFilter === "all" || a.statusId === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    if (!status) return <Badge>Desconocido</Badge>;
    const colorClasses: Record<string, string> = { emerald: "bg-emerald-100 text-emerald-800 border-emerald-200", blue: "bg-blue-100 text-blue-800 border-blue-200", amber: "bg-amber-100 text-amber-800 border-amber-200", slate: "bg-slate-100 text-slate-800 border-slate-200", red: "bg-red-100 text-red-800 border-red-200", purple: "bg-purple-100 text-purple-800 border-purple-200" };
    return <Badge variant="outline" className={`${colorClasses[status.color]} font-medium`}>{status.label}</Badge>;
  };

  const getCaseTypeLabel = (id: string) => caseTypes.find(c => c.id === id)?.label || 'Tipo';

  const renderAreaSpecificTags = (activity: Activity) => {
    if (area === 'iaas' && activity.iaasClassification) {
      const classMap = {
        suspected: { label: 'Sospecha', color: 'bg-amber-100 text-amber-800 border-amber-200' },
        confirmed: { label: 'IAAS Confirmada', color: 'bg-red-100 text-red-800 border-red-200 font-bold' },
        discarded: { label: 'Descartado', color: 'bg-slate-100 text-slate-600 border-slate-200 line-through' }
      };
      const cls = classMap[activity.iaasClassification];
      if(!cls) return null;
      return <Badge variant="outline" className={`text-xs ${cls.color}`}>{cls.label}</Badge>;
    }

    if (area === 'seguridad_paciente' && activity.eventClassification) {
      const classMap = {
        incident: { label: 'Incidente', color: 'bg-green-100 text-green-800 border-green-200' },
        adverse_event: { label: 'Evento Adverso', color: 'bg-orange-100 text-orange-800 border-orange-200 font-bold' },
        sentinel: { label: 'Evento Centinela', color: 'bg-red-100 text-red-800 border-red-200 font-bold' }
      };
      const cls = classMap[activity.eventClassification as keyof typeof classMap] || {label: 'Desconocido', color: ''};
      return (
        <Badge variant="outline" className={`text-xs ${cls.color} flex items-center gap-1`}>
          {activity.eventClassification === 'sentinel' ? <AlertTriangle className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
          {cls.label}
        </Badge>
      );
    }

    if (area === 'reclamos' && activity.deadline) {
      const deadlineDate = new Date(activity.deadline);
      const isOverdue = isPast(deadlineDate) && activity.claimStatus !== 'resolved';
      return (
        <Badge variant="outline" className={`text-xs flex items-center gap-1 ${isOverdue ? 'border-red-300 text-red-700 bg-red-50' : 'border-slate-200 text-slate-600'}`}>
          <Clock className="w-3 h-3" />
          Vence: {format(deadlineDate, "dd MMM")}
          {isOverdue && " (!)"}
        </Badge>
      );
    }

    return null;
  };

  const renderAdminValidation = (val: string | undefined) => {
    if (!isAdmin && val !== 'validated') return null; // No admins only see it if validated
    if (val === 'validated') return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200" title="Validado por Calidad"><CheckCircle2 className="w-3 h-3 mr-1"/> Validado</Badge>;
    if (val === 'rejected') return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200" title="Rechazado/Observado por Calidad"><XCircle className="w-3 h-3 mr-1"/> Observado</Badge>;
    if (isAdmin && val === 'pending') return <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 border-dashed">Pdte. Validación</Badge>;
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="text-slate-500 mt-2 text-lg">{description}</p>
        </div>
        {!isReadOnly && (
          <Button onClick={handleAddNew} className="w-full sm:w-auto gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Nuevo Registro
          </Button>
        )}
      </div>

      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Buscar por ID, título o responsable..." 
            className="pl-10 border-0 shadow-none focus-visible:ring-0 bg-transparent text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-px bg-slate-200 hidden sm:block mx-1 my-2"></div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 text-slate-600 justify-start sm:justify-center border-t sm:border-0 rounded-none sm:rounded-md pt-3 pb-2 sm:py-2">
              <Filter className="h-4 w-4 text-slate-400" />
              {statusFilter === 'all' ? 'Todos los estados' : statuses.find(s => s.id === statusFilter)?.label || 'Filtro'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuCheckboxItem checked={statusFilter === 'all'} onCheckedChange={() => setStatusFilter('all')}>
              Todos los estados
            </DropdownMenuCheckboxItem>
            {statuses.map(status => (
              <DropdownMenuCheckboxItem key={status.id} checked={statusFilter === status.id} onCheckedChange={() => setStatusFilter(status.id)}>
                {status.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredActivities.length === 0 ? (
          <div className="py-16 px-6 text-center flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-900">No se encontraron registros</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActivities.map(activity => (
              <div key={activity.id} className="p-5 hover:bg-slate-50/80 transition-colors group flex flex-col md:flex-row md:items-start justify-between gap-5">
                <div className="flex-1 w-full overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    {activity.sequentialId && (
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {activity.sequentialId}
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-slate-900">{activity.title}</h3>
                    {getStatusBadge(activity.statusId)}
                    {renderAreaSpecificTags(activity)}
                    {renderAdminValidation(activity.adminValidation)}
                    {activity.logs && activity.logs.length > 0 && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200" title="Contiene actualizaciones en bitácora">
                        Bitácora ({activity.logs.length})
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-600 mb-3 text-base leading-relaxed max-w-3xl">{activity.description}</p>
                  
                  {activity.linkedAdverseEventId && (
                     <div className="mb-3 text-xs text-orange-600 bg-orange-50 inline-block px-2 py-1 rounded border border-orange-200">
                       Vinculado a Evento Adverso ID: {activities.find(a=>a.id === activity.linkedAdverseEventId)?.sequentialId || 'Desconocido'}
                     </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 mt-4">
                    <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md text-slate-600 border border-slate-200">
                      <span className="text-slate-400">Tipo:</span> {getCaseTypeLabel(activity.caseTypeId)}
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md text-slate-600 border border-slate-200">
                       <span className="text-slate-400">Resp:</span> {activity.responsible}
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto md:ml-0 text-slate-400">
                      Creado: {format(new Date(activity.date), "dd/MM/yyyy")}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity self-end md:self-start shrink-0 pt-2 md:pt-0">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-9 w-9 p-0 hover:bg-slate-200 border border-transparent hover:border-slate-300"
                    onClick={() => handleEdit(activity)}
                    title={isReadOnly ? "Ver Detalle" : "Editar"}
                  >
                    {isReadOnly ? <Eye className="h-4 w-4 text-slate-600" /> : <Edit className="h-4 w-4 text-slate-600" />}
                  </Button>
                  {!isReadOnly && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 text-slate-400 border border-transparent hover:border-red-200"
                      onClick={() => deleteActivity(activity.id)}
                      title="Eliminar"
                      disabled={!isAdmin && settings.systemRole !== 'contributor'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ActivityForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        activityToEdit={activityToEdit} 
        fixedArea={area}
      />
    </div>
  );
}
