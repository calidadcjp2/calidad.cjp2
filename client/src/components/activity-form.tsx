import { useState, useEffect } from "react";
import { Activity, WorkArea } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActivities } from "@/context/ActivityContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Clock, Send, ShieldCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityToEdit?: Activity | null;
  fixedArea?: WorkArea;
}

export function ActivityForm({ open, onOpenChange, activityToEdit, fixedArea }: ActivityFormProps) {
  const { addActivity, updateActivity, addActivityLog, statuses, categories, caseTypes, settings } = useActivities();
  
  const [activeTab, setActiveTab] = useState("details");
  const [newLogNote, setNewLogNote] = useState("");

  const [formData, setFormData] = useState<Partial<Activity>>({
    title: "", description: "", date: new Date().toISOString().split('T')[0],
    statusId: statuses[0]?.id || "pendiente", categoryId: categories[0]?.id || "", caseTypeId: caseTypes[0]?.id || "",
    area: fixedArea || "seguridad_paciente" as WorkArea, responsible: "", notes: "",
    iaasClassification: "suspected", cultureResults: "", procedure: "", service: "", riskFactors: [], investigationStatus: "open",
    eventClassification: "incident", severity: "low", followUpActions: "",
    deadline: "", claimStatus: "received", resolution: "", involvedCollaborators: [],
    adminValidation: "pending", adminValidationNotes: ""
  });

  const [riskFactorInput, setRiskFactorInput] = useState("");
  const [collaboratorInput, setCollaboratorInput] = useState("");

  useEffect(() => {
    if (activityToEdit && open) {
      setFormData({ ...activityToEdit, date: activityToEdit.date.split('T')[0], deadline: activityToEdit.deadline ? activityToEdit.deadline.split('T')[0] : "" });
      setActiveTab("details");
    } else if (open) {
      setFormData({
        title: "", description: "", date: new Date().toISOString().split('T')[0],
        statusId: statuses[0]?.id || "pendiente", categoryId: categories[0]?.id || "", caseTypeId: caseTypes[0]?.id || "",
        area: fixedArea || "seguridad_paciente", responsible: "", notes: "",
        iaasClassification: "suspected", cultureResults: "", procedure: "", service: "", riskFactors: [], investigationStatus: "open",
        eventClassification: "incident", severity: "low", followUpActions: "",
        deadline: "", claimStatus: "received", resolution: "", involvedCollaborators: [],
        adminValidation: "pending", adminValidationNotes: ""
      });
      setActiveTab("details");
    }
  }, [activityToEdit, open, fixedArea, statuses, categories, caseTypes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (settings.systemRole === 'viewer') return;

    const dataToSave = { ...formData, date: new Date(formData.date as string).toISOString(), deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined } as Activity;
    
    if (activityToEdit) updateActivity(activityToEdit.id, dataToSave);
    else addActivity(dataToSave as any);
    
    onOpenChange(false);
  };

  const handleAddLog = () => {
    if (!newLogNote.trim() || !activityToEdit || settings.systemRole === 'viewer') return;
    addActivityLog(activityToEdit.id, newLogNote);
    setNewLogNote("");
  };

  const addArrayItem = (field: 'riskFactors' | 'involvedCollaborators', inputStr: string, setInputStr: (val: string) => void) => {
    if (inputStr.trim() && formData[field]) {
      setFormData({ ...formData, [field]: [...(formData[field] as string[]), inputStr.trim()] });
      setInputStr("");
    }
  };

  const removeArrayItem = (field: 'riskFactors' | 'involvedCollaborators', index: number) => {
    if (formData[field]) {
      const newArray = [...(formData[field] as string[])];
      newArray.splice(index, 1);
      setFormData({...formData, [field]: newArray});
    }
  };

  const isReadOnly = settings.systemRole === 'viewer';
  const isAdmin = settings.systemRole === 'admin';

  const renderAreaSpecificFields = () => {
    const area = formData.area || fixedArea;

    if (area === 'iaas') {
      return (
        <div className="space-y-4 pt-4 mt-4 border-t border-emerald-100 bg-emerald-50/30 -mx-6 px-6 pb-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-emerald-800 text-sm">Investigación Estructurada IAAS</h4>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Clasificación:</Label>
              <Select disabled={isReadOnly} value={formData.iaasClassification} onValueChange={(val: any) => setFormData({...formData, iaasClassification: val})}>
                <SelectTrigger className="h-8 w-32 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suspected">Sospecha</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="discarded">Descartada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {formData.iaasClassification === 'confirmed' && !activityToEdit && (
             <div className="bg-amber-50 text-amber-800 text-xs p-2 rounded flex items-start gap-2 border border-amber-200">
               <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
               <p>Al guardar esta IAAS como confirmada, se generará automáticamente un registro vinculado en <strong>Seguridad del Paciente</strong> como Evento Adverso.</p>
             </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service" className="text-xs">Servicio Clínico</Label>
              <Input id="service" disabled={isReadOnly} value={formData.service || ""} onChange={e => setFormData({...formData, service: e.target.value})} placeholder="Ej. UCI Adultos" className="h-8 text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="procedure" className="text-xs">Procedimiento Asociado</Label>
              <Input id="procedure" disabled={isReadOnly} value={formData.procedure || ""} onChange={e => setFormData({...formData, procedure: e.target.value})} placeholder="Ej. CVC, CUP, VM" className="h-8 text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cultureResults" className="text-xs">Resultados de Cultivo</Label>
              <Input id="cultureResults" disabled={isReadOnly} value={formData.cultureResults || ""} onChange={e => setFormData({...formData, cultureResults: e.target.value})} placeholder="Microorganismo y resistencia" className="h-8 text-sm" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="investigationStatus" className="text-xs">Estado de Investigación</Label>
              <Select disabled={isReadOnly} value={formData.investigationStatus} onValueChange={(val: any) => setFormData({...formData, investigationStatus: val})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Abierta</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="closed">Cerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Factores de Riesgo</Label>
            {!isReadOnly && (
              <div className="flex gap-2">
                <Input value={riskFactorInput} onChange={e => setRiskFactorInput(e.target.value)} placeholder="Añadir factor..." className="h-8 text-sm flex-1" onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addArrayItem('riskFactors', riskFactorInput, setRiskFactorInput); } }} />
                <Button type="button" onClick={() => addArrayItem('riskFactors', riskFactorInput, setRiskFactorInput)} size="sm" variant="secondary" className="h-8">Añadir</Button>
              </div>
            )}
            {formData.riskFactors && formData.riskFactors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.riskFactors.map((factor, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 text-xs text-slate-600">
                    {factor}
                    {!isReadOnly && <button type="button" onClick={() => removeArrayItem('riskFactors', idx)} className="text-slate-400 hover:text-red-500 ml-1">&times;</button>}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (area === 'seguridad_paciente') {
      return (
        <div className="space-y-4 pt-4 mt-4 border-t border-amber-100 bg-amber-50/30 -mx-6 px-6 pb-4">
          <h4 className="font-semibold text-amber-800 text-sm">Reporte de Evento de Seguridad</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventClassification" className="text-xs">Clasificación del Evento</Label>
              <Select disabled={isReadOnly} value={formData.eventClassification} onValueChange={(val: any) => setFormData({...formData, eventClassification: val})}>
                <SelectTrigger className="h-8 text-sm bg-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="incident">Incidente (Sin Daño)</SelectItem>
                  <SelectItem value="adverse_event">Evento Adverso (Con Daño)</SelectItem>
                  <SelectItem value="sentinel">Evento Centinela</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="severity" className="text-xs">Severidad del Daño</Label>
              <Select disabled={isReadOnly} value={formData.severity} onValueChange={(val: any) => setFormData({...formData, severity: val})}>
                <SelectTrigger className="h-8 text-sm bg-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Leve</SelectItem>
                  <SelectItem value="medium">Moderado</SelectItem>
                  <SelectItem value="high">Grave</SelectItem>
                  <SelectItem value="sentinel">Catastrófico (Centinela)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="followUpActions" className="text-xs">Acciones de Mitigación Iniciales</Label>
            <Textarea id="followUpActions" disabled={isReadOnly} value={formData.followUpActions || ""} onChange={e => setFormData({...formData, followUpActions: e.target.value})} placeholder="Medidas tomadas inmediatamente..." className="resize-none text-sm min-h-[60px]" />
          </div>
        </div>
      );
    }

    if (area === 'reclamos') {
      return (
        <div className="space-y-4 pt-4 mt-4 border-t border-purple-100 bg-purple-50/30 -mx-6 px-6 pb-4">
          <h4 className="font-semibold text-purple-800 text-sm">Gestión de Reclamo / OIRS</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-xs">Plazo de Respuesta Legal</Label>
              <Input id="deadline" disabled={isReadOnly} type="date" value={formData.deadline || ""} onChange={e => setFormData({...formData, deadline: e.target.value})} className="h-8 text-sm" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="claimStatus" className="text-xs">Estado del Reclamo</Label>
              <Select disabled={isReadOnly} value={formData.claimStatus} onValueChange={(val: any) => setFormData({...formData, claimStatus: val})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="received">Recepcionado</SelectItem>
                  <SelectItem value="evaluating">En Evaluación</SelectItem>
                  <SelectItem value="resolved">Resuelto</SelectItem>
                  <SelectItem value="appealed">Apelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Colaboradores Involucrados</Label>
            {!isReadOnly && (
              <div className="flex gap-2">
                <Input value={collaboratorInput} onChange={e => setCollaboratorInput(e.target.value)} placeholder="Ej. Dr. Juan Pérez" className="h-8 text-sm flex-1" onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addArrayItem('involvedCollaborators', collaboratorInput, setCollaboratorInput); } }} />
                <Button type="button" onClick={() => addArrayItem('involvedCollaborators', collaboratorInput, setCollaboratorInput)} size="sm" variant="secondary" className="h-8">Añadir</Button>
              </div>
            )}
            {formData.involvedCollaborators && formData.involvedCollaborators.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.involvedCollaborators.map((person, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 text-xs text-slate-600">
                    {person}
                    {!isReadOnly && <button type="button" onClick={() => removeArrayItem('involvedCollaborators', idx)} className="text-slate-400 hover:text-red-500 ml-1">&times;</button>}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="resolution" className="text-xs">Resolución / Respuesta al Usuario</Label>
            <Textarea id="resolution" disabled={isReadOnly} value={formData.resolution || ""} onChange={e => setFormData({...formData, resolution: e.target.value})} placeholder="Resumen de la respuesta entregada..." className="resize-none text-sm min-h-[60px]" />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                {activityToEdit ? "Detalle del Registro" : "Nuevo Registro"}
              </DialogTitle>
              {activityToEdit?.sequentialId && (
                <div className="text-xs font-mono bg-slate-200 text-slate-700 inline-block px-2 py-0.5 rounded mt-1">
                  ID: {activityToEdit.sequentialId}
                </div>
              )}
            </div>
            {isReadOnly && <Badge variant="secondary">Modo Lectura</Badge>}
          </div>
        </DialogHeader>

        {activityToEdit ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6 border-b border-slate-100 bg-white pt-2">
              <TabsList className="w-full justify-start h-auto bg-transparent p-0 space-x-6">
                <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2">
                  Detalles
                </TabsTrigger>
                <TabsTrigger value="logs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2">
                  Bitácora ({activityToEdit.logs?.length || 0})
                </TabsTrigger>
                {isAdmin && (
                   <TabsTrigger value="admin" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 text-primary font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Validación
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
            
            <TabsContent value="details" className="flex-1 overflow-y-auto p-6 m-0 focus-visible:outline-none">
              <form id="activity-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="title">Título / Asunto</Label>
                    <Input id="title" required disabled={isReadOnly} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-slate-50/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsible">Responsable</Label>
                    <Input id="responsible" required disabled={isReadOnly} value={formData.responsible} onChange={e => setFormData({...formData, responsible: e.target.value})} className="bg-slate-50/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input id="date" type="date" required disabled={isReadOnly} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-slate-50/50" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Área Gestora</Label>
                    <Select disabled value={formData.area}>
                      <SelectTrigger className="bg-slate-50 h-9 text-slate-500"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value={formData.area as string}>{formData.area}</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="caseTypeId" className="text-xs">Tipo de Caso</Label>
                    <Select disabled={isReadOnly} value={formData.caseTypeId} onValueChange={(val) => setFormData({...formData, caseTypeId: val})}>
                      <SelectTrigger className="bg-slate-50/50 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{caseTypes.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="statusId" className="text-xs">Estado Global</Label>
                    <Select disabled={isReadOnly} value={formData.statusId} onValueChange={(val) => setFormData({...formData, statusId: val})}>
                      <SelectTrigger className="bg-slate-50/50 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción detallada</Label>
                  <Textarea id="description" rows={3} required disabled={isReadOnly} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="resize-none bg-slate-50/50" />
                </div>
                {renderAreaSpecificFields()}
              </form>
            </TabsContent>

            <TabsContent value="logs" className="flex-1 flex flex-col overflow-hidden m-0 focus-visible:outline-none bg-slate-50/50">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activityToEdit.logs && activityToEdit.logs.length > 0 ? (
                  activityToEdit.logs.map(log => (
                    <div key={log.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative pl-10">
                      <div className="absolute left-3 top-4 w-2 h-2 rounded-full bg-primary/40"></div>
                      <div className="absolute left-[15px] top-7 bottom-[-20px] w-px bg-slate-200 last:hidden"></div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-slate-800">{log.user}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(log.date), "dd/MM/yy HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{log.note}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400 text-sm">No hay registros en la bitácora todavía.</div>
                )}
              </div>
              {!isReadOnly && (
                <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                  <div className="flex gap-2">
                    <Textarea value={newLogNote} onChange={e => setNewLogNote(e.target.value)} placeholder="Escribe una actualización o nota de avance..." className="resize-none h-[60px] text-sm" />
                    <Button onClick={handleAddLog} disabled={!newLogNote.trim()} className="h-[60px] px-4 shrink-0"><Send className="w-4 h-4" /></Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin" className="flex-1 overflow-y-auto p-6 m-0 focus-visible:outline-none bg-slate-50/50">
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                   <div>
                     <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-2">
                       <ShieldCheck className="w-5 h-5 text-primary" /> Validación Interna de Calidad
                     </h3>
                     <p className="text-sm text-slate-500">Este panel es visible y editable únicamente por administradores del sistema para validar el cierre de casos.</p>
                   </div>
                   
                   <div className="space-y-4">
                     <div className="space-y-2">
                        <Label>Estado de Validación</Label>
                        <Select value={formData.adminValidation} onValueChange={(val: any) => setFormData({...formData, adminValidation: val})}>
                          <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente de Revisión</SelectItem>
                            <SelectItem value="validated">Validado / Aprobado</SelectItem>
                            <SelectItem value="rejected">Rechazado / Observado</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <Label>Notas Internas de Validación (Privadas)</Label>
                        <Textarea 
                          value={formData.adminValidationNotes || ""} 
                          onChange={e => setFormData({...formData, adminValidationNotes: e.target.value})} 
                          placeholder="Observaciones de auditoría o razones de rechazo..." 
                          className="resize-none min-h-[100px]" 
                        />
                     </div>
                   </div>
                 </div>
              </TabsContent>
            )}
          </Tabs>
        ) : (
          /* Modo Nuevo Registro */
          <div className="overflow-y-auto p-6">
             <form id="activity-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="title">Título / Asunto</Label>
                    <Input id="title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-slate-50/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsible">Responsable</Label>
                    <Input id="responsible" required value={formData.responsible} onChange={e => setFormData({...formData, responsible: e.target.value})} className="bg-slate-50/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input id="date" type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-slate-50/50" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Área Gestora</Label>
                    <Select value={formData.area} onValueChange={(val: any) => setFormData({...formData, area: val})} disabled={!!fixedArea}>
                      <SelectTrigger className="bg-slate-50/50 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="calidad">Calidad</SelectItem>
                        <SelectItem value="seguridad_paciente">Seguridad Paciente</SelectItem>
                        <SelectItem value="iaas">IAAS</SelectItem>
                        <SelectItem value="reclamos">Reclamos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="caseTypeId" className="text-xs">Tipo de Caso</Label>
                    <Select value={formData.caseTypeId} onValueChange={(val) => setFormData({...formData, caseTypeId: val})}>
                      <SelectTrigger className="bg-slate-50/50 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{caseTypes.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="statusId" className="text-xs">Estado Global</Label>
                    <Select value={formData.statusId} onValueChange={(val) => setFormData({...formData, statusId: val})}>
                      <SelectTrigger className="bg-slate-50/50 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción detallada</Label>
                  <Textarea id="description" rows={3} required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="resize-none bg-slate-50/50" />
                </div>
                {renderAreaSpecificFields()}
              </form>
          </div>
        )}
        
        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 px-6 pb-4 bg-white shrink-0 mt-auto">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {isReadOnly ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!isReadOnly && (activityToEdit ? activeTab !== 'logs' : true) && (
            <Button type="submit" form="activity-form" className="px-6">
              {activityToEdit ? "Guardar Cambios" : "Guardar Registro"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
