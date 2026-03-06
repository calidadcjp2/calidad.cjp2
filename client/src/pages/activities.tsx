import { useState } from "react";
import { useActivities } from "@/context/ActivityContext";
import { Activity, ActivityCategory, ActivityStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, CheckCircle2, Edit, Trash2, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ActivityForm } from "@/components/activity-form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Activities() {
  const { activities, deleteActivity, markAsCompleted } = useActivities();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | "all">("all");
  
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

  const filteredActivities = activities.filter(a => {
    const matchesSearch = 
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.caseId && a.caseId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 font-medium">Completado</Badge>;
      case 'in_progress': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-medium">En Progreso</Badge>;
      case 'pending': return <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0 font-medium">Pendiente</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      meeting: 'Reunión',
      case_review: 'Revisión',
      document_prep: 'Documentos',
      client_call: 'Llamada',
      other: 'Otro'
    };
    return labels[cat] || cat;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Actividades y Casos</h1>
          <p className="text-slate-500 mt-2 text-lg">Gestiona y haz seguimiento a todo tu trabajo.</p>
        </div>
        <Button onClick={handleAddNew} className="w-full sm:w-auto gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Nueva Actividad
        </Button>
      </div>

      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Buscar por título, descripción o caso..." 
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
              {statusFilter === 'all' ? 'Todos los estados' : 
               statusFilter === 'pending' ? 'Pendientes' : 
               statusFilter === 'in_progress' ? 'En Progreso' : 'Completados'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuCheckboxItem checked={statusFilter === 'all'} onCheckedChange={() => setStatusFilter('all')}>
              Todos los estados
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={statusFilter === 'pending'} onCheckedChange={() => setStatusFilter('pending')}>
              Pendientes
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={statusFilter === 'in_progress'} onCheckedChange={() => setStatusFilter('in_progress')}>
              En Progreso
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={statusFilter === 'completed'} onCheckedChange={() => setStatusFilter('completed')}>
              Completados
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredActivities.length === 0 ? (
          <div className="py-16 px-6 text-center flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-900">No se encontraron actividades</p>
            <p className="text-slate-500 mt-1 max-w-sm">Prueba ajustando los filtros de búsqueda o crea una nueva actividad para empezar.</p>
            <Button variant="outline" className="mt-6" onClick={handleAddNew}>
              Crear Actividad
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActivities.map(activity => (
              <div key={activity.id} className="p-5 hover:bg-slate-50/80 transition-colors group flex flex-col md:flex-row md:items-start justify-between gap-5">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{activity.title}</h3>
                    {getStatusBadge(activity.status)}
                    {activity.caseId && (
                      <Badge variant="outline" className="text-xs bg-white text-slate-600 border-slate-200 shadow-sm">
                        {activity.caseId}
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-600 mb-4 text-base leading-relaxed max-w-3xl">{activity.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">
                      {getCategoryLabel(activity.category)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                      {format(new Date(activity.date), "d 'de' MMMM, yyyy", { locale: es })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity self-end md:self-start">
                  {activity.status !== 'completed' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-9 gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                      onClick={() => markAsCompleted(activity.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="hidden sm:inline font-medium">Completar</span>
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-9 w-9 p-0 hover:bg-slate-200"
                    onClick={() => handleEdit(activity)}
                  >
                    <Edit className="h-4 w-4 text-slate-600" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 text-slate-400"
                    onClick={() => deleteActivity(activity.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
      />
    </div>
  );
}
