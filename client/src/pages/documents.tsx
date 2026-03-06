import { useState } from "react";
import { useActivities } from "@/context/ActivityContext";
import { Document, TRACKING_STATUS_OPTIONS, TRACKING_STATUS_STYLES, TrackingStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash2, FileText, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, isPast, isAfter, addDays, differenceInDays } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Documents() {
  const { documents, addDocument, updateDocument, deleteDocument } = useActivities();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [docToEdit, setDocToEdit] = useState<Document | null>(null);

  const [formData, setFormData] = useState<Partial<Document>>({
    name: "", code: "", version: "V1.0", responsibleArea: "Calidad",
    issueDate: new Date().toISOString().split('T')[0],
    expirationDate: addDays(new Date(), 365).toISOString().split('T')[0],
    status: "active",
    trackingStatus: "pendiente"
  });

  const handleEdit = (doc: Document) => {
    setDocToEdit(doc);
    setFormData({
      ...doc,
      issueDate: doc.issueDate.split('T')[0],
      expirationDate: doc.expirationDate.split('T')[0]
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setDocToEdit(null);
    setFormData({
      name: "", code: "", version: "V1.0", responsibleArea: "Calidad",
      issueDate: new Date().toISOString().split('T')[0],
      expirationDate: addDays(new Date(), 365).toISOString().split('T')[0],
      status: "active",
      trackingStatus: "pendiente"
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      issueDate: new Date(formData.issueDate as string).toISOString(),
      expirationDate: new Date(formData.expirationDate as string).toISOString()
    } as Document;
    
    if (docToEdit) {
      updateDocument(docToEdit.id, dataToSave);
    } else {
      addDocument(dataToSave as any);
    }
    setIsFormOpen(false);
  };

  const handleStatusChange = (docId: string, newStatus: TrackingStatus) => {
    updateDocument(docId, { trackingStatus: newStatus });
  };

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getExpirationStatus = (dateStr: string) => {
    const expDate = new Date(dateStr);
    const today = new Date();
    const daysLeft = differenceInDays(expDate, today);

    if (daysLeft < 0) return { label: 'Vencido', color: 'bg-red-100 text-red-800 border-red-200' };
    if (daysLeft <= 30) return { label: `Vence en ${daysLeft} días`, color: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { label: 'Vigente', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  };

  const getTrackingBadge = (status: TrackingStatus) => {
    const style = TRACKING_STATUS_STYLES[status];
    const label = TRACKING_STATUS_OPTIONS.find(o => o.value === status)?.label || status;
    return <Badge variant="outline" className={`${style.bg} ${style.text} ${style.border} font-medium`}>{label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900" data-testid="text-page-title">Gestión Documental</h1>
          <p className="text-slate-500 mt-2 text-lg">Control de protocolos, guías y manuales institucionales.</p>
        </div>
        <Button onClick={handleAddNew} className="w-full sm:w-auto gap-2 shadow-sm" data-testid="button-add-document">
          <Plus className="h-4 w-4" />
          Nuevo Documento
        </Button>
      </div>

      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Buscar por nombre o código..." 
            className="pl-10 border-0 shadow-none focus-visible:ring-0 bg-transparent text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-documents"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="py-16 px-6 text-center flex flex-col items-center">
            <FileText className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-900">No hay documentos registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDocs.map(doc => {
              const expStatus = getExpirationStatus(doc.expirationDate);
              return (
              <div key={doc.id} className="p-5 hover:bg-slate-50/80 transition-colors group flex flex-col md:flex-row md:items-start justify-between gap-5" data-testid={`card-document-${doc.id}`}>
                <div className="flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <h3 className="text-lg font-semibold text-slate-900" data-testid={`text-doc-name-${doc.id}`}>{doc.name}</h3>
                    <Badge variant="outline" className={`text-xs ${expStatus.color}`}>
                      {expStatus.label}
                    </Badge>
                    {getTrackingBadge(doc.trackingStatus)}
                    {doc.status === 'obsolete' && <Badge variant="destructive">Obsoleto</Badge>}
                    {doc.status === 'draft' && <Badge variant="secondary">Borrador</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 mb-3">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">{doc.code}</span>
                    <span>Versión: {doc.version}</span>
                    <span>Área: {doc.responsibleArea}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div>Emisión: {format(new Date(doc.issueDate), "dd/MM/yyyy")}</div>
                    <div>Vencimiento: {format(new Date(doc.expirationDate), "dd/MM/yyyy")}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={doc.trackingStatus} onValueChange={(val) => handleStatusChange(doc.id, val as TrackingStatus)}>
                    <SelectTrigger className="h-8 w-[160px] text-xs" data-testid={`select-status-${doc.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRACKING_STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:bg-slate-200" onClick={() => handleEdit(doc)} data-testid={`button-edit-${doc.id}`}>
                    <Edit className="h-4 w-4 text-slate-600" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600 text-slate-400" onClick={() => deleteDocument(doc.id)} data-testid={`button-delete-${doc.id}`}>
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
            <DialogTitle className="text-xl">{docToEdit ? "Editar Documento" : "Nuevo Documento"}</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <form id="doc-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Documento</Label>
                <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} data-testid="input-doc-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input id="code" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} data-testid="input-doc-code" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Versión</Label>
                  <Input id="version" required value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} data-testid="input-doc-version" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsibleArea">Área Responsable</Label>
                  <Input id="responsibleArea" required value={formData.responsibleArea} onChange={e => setFormData({...formData, responsibleArea: e.target.value})} data-testid="input-doc-area" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado Documental</Label>
                  <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                    <SelectTrigger data-testid="select-doc-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Vigente</SelectItem>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="obsolete">Obsoleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estado de Seguimiento</Label>
                <Select value={formData.trackingStatus} onValueChange={(val: any) => setFormData({...formData, trackingStatus: val})}>
                  <SelectTrigger data-testid="select-doc-tracking-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRACKING_STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Fecha de Emisión</Label>
                  <Input id="issueDate" type="date" required value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} data-testid="input-doc-issue-date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expirationDate">Fecha de Vencimiento</Label>
                  <Input id="expirationDate" type="date" required value={formData.expirationDate} onChange={e => setFormData({...formData, expirationDate: e.target.value})} data-testid="input-doc-expiration-date" />
                </div>
              </div>
            </form>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 px-6 pb-4 bg-white">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button type="submit" form="doc-form" data-testid="button-submit-doc">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
