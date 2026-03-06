import { useState, useMemo } from "react";
import { useActivities } from "@/context/ActivityContext";
import { Collaborator, PlatformAccess, TRACKING_STATUS_OPTIONS, TRACKING_STATUS_STYLES, TrackingStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, Users, MonitorSmartphone, Monitor, KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Collaborators() {
  const { collaborators, addCollaborator, updateCollaborator, deleteCollaborator, settings } = useActivities();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [collabToEdit, setCollabToEdit] = useState<Collaborator | null>(null);

  const [formData, setFormData] = useState<Partial<Collaborator>>({
    name: "", department: "", accesses: [], trackingStatus: "pendiente"
  });

  const [newAccess, setNewAccess] = useState<PlatformAccess>({ platformName: "", username: "" });

  const isReadOnly = settings.systemRole === 'viewer';

  const handleEdit = (collab: Collaborator) => {
    setCollabToEdit(collab);
    setFormData(collab);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setCollabToEdit(null);
    setFormData({ name: "", department: "", accesses: [], trackingStatus: "pendiente" });
    setNewAccess({ platformName: "", username: "" });
    setIsFormOpen(true);
  };

  const addPlatformAccess = () => {
    if (!newAccess.platformName || !newAccess.username) return;
    setFormData(prev => ({
      ...prev,
      accesses: [...(prev.accesses || []), { ...newAccess }]
    }));
    setNewAccess({ platformName: "", username: "" });
  };

  const removeAccess = (index: number) => {
    setFormData(prev => {
      const newAccesses = [...(prev.accesses || [])];
      newAccesses.splice(index, 1);
      return { ...prev, accesses: newAccesses };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const dataToSave = {
      name: formData.name,
      department: formData.department,
      accesses: formData.accesses || [],
      trackingStatus: formData.trackingStatus || 'pendiente'
    } as Collaborator;

    if (collabToEdit) {
      updateCollaborator(collabToEdit.id, dataToSave);
    } else {
      addCollaborator(dataToSave as any);
    }
    setIsFormOpen(false);
  };

  const handleStatusChange = (collabId: string, newStatus: TrackingStatus) => {
    updateCollaborator(collabId, { trackingStatus: newStatus });
  };

  const filteredCollabs = collaborators.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.department && c.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const platformData = useMemo(() => {
    const platforms: Record<string, { collabName: string, username: string, department?: string }[]> = {};
    collaborators.forEach(c => {
      c.accesses.forEach(acc => {
        if (!platforms[acc.platformName]) platforms[acc.platformName] = [];
        platforms[acc.platformName].push({ collabName: c.name, username: acc.username, department: c.department });
      });
    });
    return platforms;
  }, [collaborators]);

  const getTrackingBadge = (status: TrackingStatus) => {
    const style = TRACKING_STATUS_STYLES[status];
    const label = TRACKING_STATUS_OPTIONS.find(o => o.value === status)?.label || status;
    return <Badge variant="outline" className={`${style.bg} ${style.text} ${style.border} font-medium text-xs`}>{label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900" data-testid="text-page-title">Formación y Accesos</h1>
          <p className="text-slate-500 mt-2 text-lg">Gestiona colaboradores y los sistemas a los que tienen acceso.</p>
        </div>
        {!isReadOnly && (
          <Button onClick={handleAddNew} className="w-full sm:w-auto gap-2 shadow-sm" data-testid="button-add-collaborator">
            <Plus className="h-4 w-4" />
            Añadir Colaborador
          </Button>
        )}
      </div>

      <Tabs defaultValue="by_collaborator" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="by_collaborator" className="gap-2"><Users className="w-4 h-4"/> Vista por Colaborador</TabsTrigger>
          <TabsTrigger value="by_platform" className="gap-2"><MonitorSmartphone className="w-4 h-4" /> Vista por Plataforma</TabsTrigger>
        </TabsList>

        <TabsContent value="by_collaborator" className="space-y-6 m-0">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Buscar colaborador por nombre o departamento..." 
                className="pl-10 border-0 shadow-none focus-visible:ring-0 bg-transparent text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-collaborators"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollabs.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                No se encontraron colaboradores registrados.
              </div>
            ) : (
              filteredCollabs.map(collab => (
                <Card key={collab.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow" data-testid={`card-collaborator-${collab.id}`}>
                  <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg" data-testid={`text-collab-name-${collab.id}`}>{collab.name}</CardTitle>
                        {collab.department && <p className="text-sm text-slate-500">{collab.department}</p>}
                        <div className="mt-2 flex items-center gap-2">
                          {getTrackingBadge(collab.trackingStatus)}
                          <Select value={collab.trackingStatus} onValueChange={(val) => handleStatusChange(collab.id, val as TrackingStatus)}>
                            <SelectTrigger className="h-7 w-[140px] text-xs" data-testid={`select-status-${collab.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TRACKING_STATUS_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {!isReadOnly && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(collab)} data-testid={`button-edit-${collab.id}`}>
                            <Edit className="h-4 w-4 text-slate-600" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteCollaborator(collab.id)} data-testid={`button-delete-${collab.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Sistemas Asignados</h5>
                    {collab.accesses.length === 0 ? (
                       <p className="text-sm text-slate-400 italic">Sin accesos registrados.</p>
                    ) : (
                      <div className="space-y-2">
                        {collab.accesses.map((acc, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm p-2 rounded bg-slate-50 border border-slate-100">
                            <span className="font-medium text-slate-700 flex items-center gap-2">
                              <Monitor className="w-3.5 h-3.5 text-slate-400" /> {acc.platformName}
                            </span>
                            <span className="text-slate-500 flex items-center gap-1 text-xs">
                              <KeyRound className="w-3 h-3" /> {acc.username}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="by_platform" className="space-y-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.keys(platformData).length === 0 ? (
               <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                 No hay sistemas con usuarios asignados.
               </div>
            ) : (
              Object.keys(platformData).sort().map(platform => (
                <Card key={platform} className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-blue-600 px-4 py-3 flex items-center gap-2">
                    <MonitorSmartphone className="text-white w-5 h-5" />
                    <h3 className="font-bold text-white text-lg">{platform}</h3>
                    <Badge variant="secondary" className="ml-auto bg-white/20 text-white hover:bg-white/30 border-0">
                      {platformData[platform].length} usuarios
                    </Badge>
                  </div>
                  <div className="p-0">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2 font-semibold">Colaborador</th>
                          <th className="px-4 py-2 font-semibold">Usuario (Login)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {platformData[platform].map((user, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-800">{user.collabName}</div>
                              {user.department && <div className="text-xs text-slate-500">{user.department}</div>}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-600 text-xs">
                              {user.username}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{collabToEdit ? "Editar Colaborador" : "Registrar Colaborador"}</DialogTitle>
          </DialogHeader>
          <form id="collab-form" onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={isReadOnly} data-testid="input-collab-name" />
              </div>
              <div className="space-y-2">
                <Label>Servicio / Departamento (Opcional)</Label>
                <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} disabled={isReadOnly} data-testid="input-collab-department" />
              </div>
              <div className="space-y-2">
                <Label>Estado de Seguimiento</Label>
                <Select disabled={isReadOnly} value={formData.trackingStatus} onValueChange={(val: any) => setFormData({...formData, trackingStatus: val})}>
                  <SelectTrigger data-testid="select-collab-tracking-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRACKING_STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-4">
              <Label className="text-base font-semibold">Accesos a Plataformas</Label>
              
              {formData.accesses && formData.accesses.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.accesses.map((acc, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-200 text-sm">
                      <div>
                        <span className="font-semibold text-slate-800">{acc.platformName}</span>
                        <span className="text-slate-500 ml-2">({acc.username})</span>
                      </div>
                      {!isReadOnly && (
                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:bg-red-50" onClick={() => removeAccess(idx)}>
                          &times;
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isReadOnly && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Sistema</Label>
                    <Input value={newAccess.platformName} onChange={e => setNewAccess({...newAccess, platformName: e.target.value})} placeholder="Ej. SIS clínico" className="h-8 text-sm" data-testid="input-access-platform" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Usuario</Label>
                    <Input value={newAccess.username} onChange={e => setNewAccess({...newAccess, username: e.target.value})} placeholder="Ej. jperez" className="h-8 text-sm" data-testid="input-access-username" />
                  </div>
                  <Button type="button" variant="secondary" onClick={addPlatformAccess} className="h-8 shrink-0" data-testid="button-add-access">Añadir</Button>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>{isReadOnly ? 'Cerrar' : 'Cancelar'}</Button>
              {!isReadOnly && <Button type="submit" data-testid="button-submit-collab">Guardar Registro</Button>}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
