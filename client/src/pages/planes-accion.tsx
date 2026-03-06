import { useState } from "react";
import { useActivities } from "@/context/ActivityContext";
import { ActionPlan, CorrectiveAction, Activity, TRACKING_STATUS_OPTIONS, TRACKING_STATUS_STYLES, TrackingStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, CheckCircle2, Clock, PlayCircle, Eye, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isPast } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ActionPlans() {
  const { actionPlans, activities, addActionPlan, updateActionPlan, deleteActionPlan, settings } = useActivities();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<ActionPlan | null>(null);

  const [formData, setFormData] = useState<Partial<ActionPlan>>({
    title: "", linkedActivityId: "none", status: "active", actions: [], trackingStatus: "pendiente"
  });

  const [newAction, setNewAction] = useState<Partial<CorrectiveAction>>({
    description: "", responsible: "", deadline: "", status: "pending", evidenceFiles: [], trackingStatus: "pendiente"
  });

  const isReadOnly = settings.systemRole === 'viewer';

  const handleEdit = (plan: ActionPlan) => {
    setPlanToEdit(plan);
    setFormData(plan);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setPlanToEdit(null);
    setFormData({ title: "", linkedActivityId: "none", status: "active", actions: [], trackingStatus: "pendiente" });
    setNewAction({ description: "", responsible: "", deadline: "", status: "pending", evidenceFiles: [], trackingStatus: "pendiente" });
    setIsFormOpen(true);
  };

  const addActionToPlan = () => {
    if (!newAction.description || !newAction.responsible || !newAction.deadline) return;
    const action: CorrectiveAction = {
      id: `act_${Math.random().toString(36).substring(7)}`,
      description: newAction.description,
      responsible: newAction.responsible,
      deadline: newAction.deadline,
      status: (newAction.status as any) || 'pending',
      trackingStatus: (newAction.trackingStatus as TrackingStatus) || 'pendiente',
      evidenceFiles: newAction.evidenceFiles || []
    };
    setFormData(prev => ({ ...prev, actions: [...(prev.actions || []), action] }));
    setNewAction({ description: "", responsible: "", deadline: "", status: "pending", evidenceFiles: [], trackingStatus: "pendiente" });
  };

  const removeAction = (id: string) => {
    setFormData(prev => ({ ...prev, actions: prev.actions?.filter(a => a.id !== id) }));
  };

  const updateActionStatus = (id: string, newStatus: string) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions?.map(a => a.id === id ? { ...a, status: newStatus as any } : a)
    }));
  };

  const updateActionTrackingStatus = (id: string, newStatus: TrackingStatus) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions?.map(a => a.id === id ? { ...a, trackingStatus: newStatus } : a)
    }));
  };

  const addEvidence = (actionId: string) => {
    const fileUrl = prompt("Ingrese la URL del archivo de evidencia (o simule una carga):", "https://ejemplo.com/evidencia.pdf");
    if (!fileUrl) return;
    
    setFormData(prev => ({
      ...prev,
      actions: prev.actions?.map(a => 
        a.id === actionId 
          ? { ...a, evidenceFiles: [...(a.evidenceFiles || []), fileUrl] } 
          : a
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      title: formData.title,
      linkedActivityId: formData.linkedActivityId === 'none' ? undefined : formData.linkedActivityId,
      status: formData.status,
      trackingStatus: formData.trackingStatus || 'pendiente',
      actions: formData.actions || []
    } as ActionPlan;
    
    if (planToEdit) {
      updateActionPlan(planToEdit.id, dataToSave);
    } else {
      addActionPlan(dataToSave as any);
    }
    setIsFormOpen(false);
  };

  const filteredPlans = actionPlans.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.actions.some(a => a.responsible.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    if (status === 'completed') return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Completado</Badge>;
    if (status === 'in_progress') return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200"><PlayCircle className="w-3 h-3 mr-1" /> En Progreso</Badge>;
    return <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-200"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
  };

  const getTrackingBadge = (status: TrackingStatus) => {
    const style = TRACKING_STATUS_STYLES[status];
    const label = TRACKING_STATUS_OPTIONS.find(o => o.value === status)?.label || status;
    return <Badge variant="outline" className={`${style.bg} ${style.text} ${style.border} font-medium`}>{label}</Badge>;
  };

  const handlePlanStatusChange = (planId: string, newStatus: TrackingStatus) => {
    updateActionPlan(planId, { trackingStatus: newStatus });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900" data-testid="text-page-title">Planes de Acción Correctiva</h1>
          <p className="text-slate-500 mt-2 text-lg">Define y monitorea acciones correctivas derivadas de eventos o auditorías.</p>
        </div>
        {!isReadOnly && (
          <Button onClick={handleAddNew} className="w-full sm:w-auto gap-2 shadow-sm" data-testid="button-add-plan">
            <Plus className="h-4 w-4" />
            Nuevo Plan
          </Button>
        )}
      </div>

      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Buscar por título del plan o responsable..." 
            className="pl-10 border-0 shadow-none focus-visible:ring-0 bg-transparent text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-plans"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredPlans.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 py-16 px-6 text-center flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-900">No hay planes de acción</p>
          </div>
        ) : (
          filteredPlans.map(plan => {
            const totalActions = plan.actions.length;
            const completedActions = plan.actions.filter(a => a.status === 'completed').length;
            const progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
            const linkedActivity = plan.linkedActivityId ? activities.find(a => a.id === plan.linkedActivityId) : null;

            return (
              <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" data-testid={`card-plan-${plan.id}`}>
                <div className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-5 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900" data-testid={`text-plan-title-${plan.id}`}>{plan.title}</h3>
                      <Badge variant={plan.status === 'active' ? "default" : "secondary"}>
                        {plan.status === 'active' ? 'Activo' : 'Cerrado'}
                      </Badge>
                      {getTrackingBadge(plan.trackingStatus)}
                    </div>
                    {linkedActivity && (
                      <p className="text-sm text-slate-600 mb-2">
                        <span className="font-medium text-slate-700">Vinculado a:</span> {linkedActivity.sequentialId || linkedActivity.title} ({linkedActivity.area})
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm mt-3">
                      <div className="flex-1 max-w-xs">
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-500 text-xs">Progreso ({completedActions}/{totalActions})</span>
                          <span className="text-slate-700 text-xs font-bold">{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select value={plan.trackingStatus} onValueChange={(val) => handlePlanStatusChange(plan.id, val as TrackingStatus)}>
                      <SelectTrigger className="h-8 w-[160px] text-xs" data-testid={`select-status-${plan.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRACKING_STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" className="hover:bg-slate-200" onClick={() => handleEdit(plan)} data-testid={`button-edit-${plan.id}`}>
                      {isReadOnly ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                    </Button>
                    {!isReadOnly && (
                      <Button size="sm" variant="ghost" className="hover:bg-red-50 hover:text-red-600 text-slate-400" onClick={() => deleteActionPlan(plan.id)} data-testid={`button-delete-${plan.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-0">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600 text-xs uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Acción</th>
                        <th className="px-5 py-3 font-semibold w-40">Responsable</th>
                        <th className="px-5 py-3 font-semibold w-32">Plazo</th>
                        <th className="px-5 py-3 font-semibold w-36">Estado</th>
                        <th className="px-5 py-3 font-semibold w-40">Seguimiento</th>
                        <th className="px-5 py-3 font-semibold w-24">Evidencias</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {plan.actions.length === 0 && (
                        <tr><td colSpan={6} className="px-5 py-4 text-center text-slate-500">No hay acciones definidas</td></tr>
                      )}
                      {plan.actions.map(action => {
                        const isActionOverdue = action.status !== 'completed' && isPast(new Date(action.deadline));
                        return (
                          <tr key={action.id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3 text-slate-800">{action.description}</td>
                            <td className="px-5 py-3 text-slate-600">{action.responsible}</td>
                            <td className="px-5 py-3">
                              <span className={isActionOverdue ? 'text-red-600 font-medium' : 'text-slate-600'}>
                                {format(new Date(action.deadline), "dd/MM/yyyy")}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {getStatusBadge(action.status)}
                            </td>
                            <td className="px-5 py-3">
                              {getTrackingBadge(action.trackingStatus)}
                            </td>
                            <td className="px-5 py-3">
                              {action.evidenceFiles && action.evidenceFiles.length > 0 ? (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal">
                                  <Paperclip className="w-3 h-3 mr-1" /> {action.evidenceFiles.length}
                                </Badge>
                              ) : (
                                <span className="text-slate-400 text-xs italic">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
          <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <DialogTitle className="text-xl">{planToEdit ? (isReadOnly ? "Ver Plan" : "Editar Plan de Acción") : "Nuevo Plan de Acción"}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6">
            <form id="plan-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Título del Plan</Label>
                  <Input disabled={isReadOnly} required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ej. Mejoras proceso de identificación..." data-testid="input-plan-title" />
                </div>
                <div className="space-y-2">
                  <Label>Vincular a Evento/Actividad (Opcional)</Label>
                  <Select disabled={isReadOnly} value={formData.linkedActivityId || "none"} onValueChange={(val) => setFormData({...formData, linkedActivityId: val})}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar registro..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Ninguno --</SelectItem>
                      {activities.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.sequentialId ? `${a.sequentialId} - ` : ''}{a.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado del Plan</Label>
                  <Select disabled={isReadOnly} value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="closed">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado de Seguimiento</Label>
                  <Select disabled={isReadOnly} value={formData.trackingStatus} onValueChange={(val: any) => setFormData({...formData, trackingStatus: val})}>
                    <SelectTrigger data-testid="select-plan-tracking-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRACKING_STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h4 className="font-semibold text-slate-800 mb-4">Acciones Correctivas</h4>
                
                <div className="space-y-3 mb-6">
                  {formData.actions?.length === 0 && <p className="text-sm text-slate-500 italic">No se han añadido acciones.</p>}
                  {formData.actions?.map((action, idx) => (
                    <div key={action.id || idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{action.description}</p>
                          <div className="flex gap-4 mt-2 text-xs text-slate-600">
                            <span>Resp: <strong>{action.responsible}</strong></span>
                            <span>Plazo: <strong>{action.deadline ? format(new Date(action.deadline), "dd/MM/yy") : "-"}</strong></span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select disabled={isReadOnly} value={action.status} onValueChange={(val) => updateActionStatus(action.id, val)}>
                            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendiente</SelectItem>
                              <SelectItem value="in_progress">En Progreso</SelectItem>
                              <SelectItem value="completed">Completado</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select disabled={isReadOnly} value={action.trackingStatus} onValueChange={(val) => updateActionTrackingStatus(action.id, val as TrackingStatus)}>
                            <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {TRACKING_STATUS_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!isReadOnly && (
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => removeAction(action.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60">
                        <span className="text-xs text-slate-500">Evidencias: {action.evidenceFiles?.length || 0}</span>
                        {!isReadOnly && (
                          <Button type="button" variant="link" className="h-6 px-2 text-xs text-blue-600 p-0" onClick={() => addEvidence(action.id)}>
                            + Adjuntar Evidencia
                          </Button>
                        )}
                        {action.evidenceFiles?.map((ev, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]"><Paperclip className="w-3 h-3 mr-1"/> File {i+1}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {!isReadOnly && (
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                    <h5 className="text-sm font-medium text-blue-800">Añadir nueva acción al plan</h5>
                    <div className="space-y-2">
                      <Label className="text-xs">Descripción de la tarea</Label>
                      <Input value={newAction.description} onChange={e => setNewAction({...newAction, description: e.target.value})} className="h-8 text-sm" data-testid="input-action-description" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Responsable</Label>
                        <Input value={newAction.responsible} onChange={e => setNewAction({...newAction, responsible: e.target.value})} className="h-8 text-sm" data-testid="input-action-responsible" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Fecha Límite</Label>
                        <Input type="date" value={newAction.deadline} onChange={e => setNewAction({...newAction, deadline: e.target.value})} className="h-8 text-sm" data-testid="input-action-deadline" />
                      </div>
                    </div>
                    <Button type="button" variant="secondary" className="w-full text-sm h-8" onClick={addActionToPlan} data-testid="button-add-action">Añadir Accion a la Lista</Button>
                  </div>
                )}
              </div>
            </form>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 px-6 pb-4 bg-white shrink-0">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!isReadOnly && (
              <Button type="submit" form="plan-form" className="px-6" data-testid="button-submit-plan">Guardar Plan</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
