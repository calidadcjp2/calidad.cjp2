import { useState } from "react";
import { useActivities } from "@/context/ActivityContext";
import { PeriodicTask, TRACKING_STATUS_OPTIONS, TRACKING_STATUS_STYLES, TrackingStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, CalendarClock, Play, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isPast } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PeriodicTasks() {
  const { periodicTasks, addTask, updateTask, deleteTask } = useActivities();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<PeriodicTask | null>(null);

  const [formData, setFormData] = useState<Partial<PeriodicTask>>({
    title: "", description: "", responsible: "",
    frequency: "monthly", status: "active",
    nextDueDate: new Date().toISOString().split('T')[0],
    trackingStatus: "pendiente"
  });

  const handleEdit = (task: PeriodicTask) => {
    setTaskToEdit(task);
    setFormData({
      ...task,
      nextDueDate: task.nextDueDate.split('T')[0]
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setTaskToEdit(null);
    setFormData({
      title: "", description: "", responsible: "",
      frequency: "monthly", status: "active",
      nextDueDate: new Date().toISOString().split('T')[0],
      trackingStatus: "pendiente"
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      nextDueDate: new Date(formData.nextDueDate as string).toISOString()
    } as PeriodicTask;
    
    if (taskToEdit) {
      updateTask(taskToEdit.id, dataToSave);
    } else {
      addTask(dataToSave as any);
    }
    setIsFormOpen(false);
  };

  const handleStatusChange = (taskId: string, newStatus: TrackingStatus) => {
    updateTask(taskId, { trackingStatus: newStatus });
  };

  const filteredTasks = periodicTasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.responsible.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const freqLabels = { daily: 'Diaria', weekly: 'Semanal', monthly: 'Mensual', quarterly: 'Trimestral', four_monthly: 'Cuatrimestral', semiannual: 'Semestral', yearly: 'Anual' };

  const getTrackingBadge = (status: TrackingStatus) => {
    const style = TRACKING_STATUS_STYLES[status];
    const label = TRACKING_STATUS_OPTIONS.find(o => o.value === status)?.label || status;
    return <Badge variant="outline" className={`${style.bg} ${style.text} ${style.border} font-medium`}>{label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900" data-testid="text-page-title">Tareas Periódicas</h1>
          <p className="text-slate-500 mt-2 text-lg">Programación de reportes, auditorías y chequeos recurrentes.</p>
        </div>
        <Button onClick={handleAddNew} className="w-full sm:w-auto gap-2 shadow-sm" data-testid="button-add-task">
          <Plus className="h-4 w-4" />
          Nueva Tarea
        </Button>
      </div>

      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Buscar tarea..." 
            className="pl-10 border-0 shadow-none focus-visible:ring-0 bg-transparent text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-tasks"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="py-16 px-6 text-center flex flex-col items-center">
            <CalendarClock className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-900">No hay tareas programadas</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map(task => {
              const isOverdue = isPast(new Date(task.nextDueDate)) && task.status === 'active';
              return (
              <div key={task.id} className={`p-5 hover:bg-slate-50/80 transition-colors group flex flex-col md:flex-row md:items-start justify-between gap-5 ${task.status === 'paused' ? 'opacity-60 grayscale' : ''}`} data-testid={`card-task-${task.id}`}>
                <div className="flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <h3 className="text-lg font-semibold text-slate-900" data-testid={`text-task-title-${task.id}`}>{task.title}</h3>
                    <Badge variant="outline" className={`text-xs ${isOverdue ? 'bg-red-100 text-red-800 border-red-200' : 'bg-slate-100 text-slate-700'}`}>
                      Frecuencia: {freqLabels[task.frequency]}
                    </Badge>
                    {getTrackingBadge(task.trackingStatus)}
                    {task.status === 'paused' && <Badge variant="secondary">Pausada</Badge>}
                  </div>
                  <p className="text-slate-600 mb-3 text-sm">{task.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="text-slate-500">Resp: {task.responsible}</span>
                    <span className={isOverdue ? "text-red-600 font-bold" : "text-slate-500"}>
                      Próximo Vencimiento: {format(new Date(task.nextDueDate), "dd/MM/yyyy")}
                      {isOverdue && " (Atrasada)"}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={task.trackingStatus} onValueChange={(val) => handleStatusChange(task.id, val as TrackingStatus)}>
                    <SelectTrigger className="h-8 w-[160px] text-xs" data-testid={`select-status-${task.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRACKING_STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-9 w-9 p-0"
                    title={task.status === 'active' ? 'Pausar' : 'Activar'}
                    onClick={() => updateTask(task.id, { status: task.status === 'active' ? 'paused' : 'active' })}
                    data-testid={`button-toggle-${task.id}`}
                  >
                    {task.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-200" onClick={() => handleEdit(task)} data-testid={`button-edit-${task.id}`}>
                    <Edit className="h-4 w-4 text-slate-600" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 text-slate-400" onClick={() => deleteTask(task.id)} data-testid={`button-delete-${task.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl">{taskToEdit ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título de Tarea</Label>
                <Input id="title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} data-testid="input-task-title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción / Instrucciones</Label>
                <Textarea id="description" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} data-testid="input-task-description" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsible">Responsable</Label>
                <Input id="responsible" required value={formData.responsible} onChange={e => setFormData({...formData, responsible: e.target.value})} data-testid="input-task-responsible" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frecuencia</Label>
                  <Select value={formData.frequency} onValueChange={(val: any) => setFormData({...formData, frequency: val})}>
                    <SelectTrigger data-testid="select-task-frequency"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diaria</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="four_monthly">Cuatrimestral</SelectItem>
                      <SelectItem value="semiannual">Semestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextDueDate">Próximo Vencimiento</Label>
                  <Input id="nextDueDate" type="date" required value={formData.nextDueDate} onChange={e => setFormData({...formData, nextDueDate: e.target.value})} data-testid="input-task-due-date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estado de Seguimiento</Label>
                <Select value={formData.trackingStatus} onValueChange={(val: any) => setFormData({...formData, trackingStatus: val})}>
                  <SelectTrigger data-testid="select-task-tracking-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRACKING_STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 px-6 pb-4 bg-white">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button type="submit" form="task-form" data-testid="button-submit-task">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
