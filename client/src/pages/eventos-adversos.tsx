import { useState, useMemo } from "react";
import { useActivities } from "@/context/ActivityContext";
import { 
  EventoAdverso, 
  EventoTipo, 
  EventoClasificacion, 
  EventoGravedad, 
  EventoEstado, 
  FactorContribuyente,
  EVENTO_TIPO_LABELS,
  EVENTO_CLASIFICACION_LABELS,
  EVENTO_GRAVEDAD_LABELS,
  EVENTO_ESTADO_LABELS,
  EVENTO_ESTADO_STYLES,
  EVENTO_GRAVEDAD_STYLES,
  FACTOR_CONTRIBUYENTE_LABELS
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  Calendar,
  Building2,
  FileText,
  ExternalLink,
  Trash2
} from "lucide-react";
import { format } from "date-fns";

const SERVICIOS = [
  "UCI Adulto",
  "UCI Pediátrica",
  "Neonatología",
  "Medicina Interna",
  "Cirugía",
  "Traumatología",
  "Pediatría",
  "Ginecología",
  "Urgencia",
  "Pabellón",
  "Consulta Externa",
  "Otro",
];

export default function EventosAdversosPage() {
  const { eventosAdversos, actionPlans, addEventoAdverso, updateEventoAdverso, deleteEventoAdverso, settings } = useActivities();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterClasificacion, setFilterClasificacion] = useState<string>("all");
  const [filterGravedad, setFilterGravedad] = useState<string>("all");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<EventoAdverso | null>(null);

  const [form, setForm] = useState({
    fecha: format(new Date(), "yyyy-MM-dd"),
    servicio: SERVICIOS[0],
    tipoEvento: "otro" as EventoTipo,
    descripcion: "",
    clasificacion: "incidente" as EventoClasificacion,
    gravedad: "sin_dano" as EventoGravedad,
    factoresContribuyentes: [] as FactorContribuyente[],
    estado: "pendiente" as EventoEstado,
    linkedPlanId: "",
  });

  const resetForm = () => {
    setForm({
      fecha: format(new Date(), "yyyy-MM-dd"),
      servicio: SERVICIOS[0],
      tipoEvento: "otro",
      descripcion: "",
      clasificacion: "incidente",
      gravedad: "sin_dano",
      factoresContribuyentes: [],
      estado: "pendiente",
      linkedPlanId: "",
    });
    setEditingEvento(null);
  };

  const handleEdit = (evento: EventoAdverso) => {
    setEditingEvento(evento);
    setForm({
      fecha: evento.fecha,
      servicio: evento.servicio,
      tipoEvento: evento.tipoEvento,
      descripcion: evento.descripcion,
      clasificacion: evento.clasificacion,
      gravedad: evento.gravedad,
      factoresContribuyentes: evento.factoresContribuyentes,
      estado: evento.estado,
      linkedPlanId: evento.linkedPlanId || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.descripcion.trim()) return;

    const data = {
      ...form,
      linkedPlanId: form.linkedPlanId || undefined,
    };

    if (editingEvento) {
      updateEventoAdverso(editingEvento.id, data);
    } else {
      addEventoAdverso(data);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const toggleFactor = (factor: FactorContribuyente) => {
    setForm(prev => ({
      ...prev,
      factoresContribuyentes: prev.factoresContribuyentes.includes(factor)
        ? prev.factoresContribuyentes.filter(f => f !== factor)
        : [...prev.factoresContribuyentes, factor]
    }));
  };

  const filtered = useMemo(() => {
    return eventosAdversos.filter(e => {
      const matchesSearch = !searchTerm || 
        e.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.servicio.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTipo = filterTipo === "all" || e.tipoEvento === filterTipo;
      const matchesClasificacion = filterClasificacion === "all" || e.clasificacion === filterClasificacion;
      const matchesGravedad = filterGravedad === "all" || e.gravedad === filterGravedad;
      const matchesEstado = filterEstado === "all" || e.estado === filterEstado;

      return matchesSearch && matchesTipo && matchesClasificacion && matchesGravedad && matchesEstado;
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [eventosAdversos, searchTerm, filterTipo, filterClasificacion, filterGravedad, filterEstado]);

  const stats = useMemo(() => {
    const byClasificacion = { adverso: 0, incidente: 0, cuasi: 0 };
    const byGravedad = { sin_dano: 0, leve: 0, moderado: 0, grave: 0, muerte: 0 };
    
    eventosAdversos.forEach(e => {
      if (byClasificacion[e.clasificacion] !== undefined) byClasificacion[e.clasificacion]++;
      if (byGravedad[e.gravedad] !== undefined) byGravedad[e.gravedad]++;
    });

    return { byClasificacion, byGravedad, total: eventosAdversos.length };
  }, [eventosAdversos]);

  const canEdit = settings.systemRole !== 'viewer';

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900" data-testid="text-page-title">
            Registro de Eventos Adversos
          </h1>
          <p className="text-slate-500 mt-1">
            Gestión y análisis de incidentes y eventos adversos (Modelo MINSAL)
          </p>
        </div>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-event" className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" /> Nuevo Reporte
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEvento ? "Editar Reporte de Evento" : "Registrar Nuevo Evento/Incidente"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha del Evento</Label>
                    <Input 
                      data-testid="input-event-date"
                      type="date" 
                      value={form.fecha} 
                      onChange={e => setForm({...form, fecha: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Servicio</Label>
                    <Select value={form.servicio} onValueChange={v => setForm({...form, servicio: v})}>
                      <SelectTrigger data-testid="select-event-service">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICIOS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Evento</Label>
                    <Select value={form.tipoEvento} onValueChange={v => setForm({...form, tipoEvento: v as EventoTipo})}>
                      <SelectTrigger data-testid="select-event-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EVENTO_TIPO_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Clasificación</Label>
                    <Select value={form.clasificacion} onValueChange={v => setForm({...form, clasificacion: v as EventoClasificacion})}>
                      <SelectTrigger data-testid="select-event-classification">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EVENTO_CLASIFICACION_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción detallada</Label>
                  <Textarea 
                    data-testid="textarea-event-description"
                    placeholder="Describa lo sucedido, personas involucradas y acciones inmediatas tomadas..."
                    className="min-h-[100px]"
                    value={form.descripcion}
                    onChange={e => setForm({...form, descripcion: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gravedad (Daño)</Label>
                    <Select value={form.gravedad} onValueChange={v => setForm({...form, gravedad: v as EventoGravedad})}>
                      <SelectTrigger data-testid="select-event-severity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EVENTO_GRAVEDAD_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado del Análisis</Label>
                    <Select value={form.estado} onValueChange={v => setForm({...form, estado: v as EventoEstado})}>
                      <SelectTrigger data-testid="select-event-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EVENTO_ESTADO_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Factores Contribuyentes</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(FACTOR_CONTRIBUYENTE_LABELS).map(([k, v]) => (
                      <div key={k} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`factor-${k}`}
                          checked={form.factoresContribuyentes.includes(k as FactorContribuyente)}
                          onChange={() => toggleFactor(k as FactorContribuyente)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor={`factor-${k}`} className="text-sm font-normal cursor-pointer">{v}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4 mt-2">
                  <Label>Vincular a Plan de Acción (Opcional)</Label>
                  <Select value={form.linkedPlanId} onValueChange={v => setForm({...form, linkedPlanId: v})}>
                    <SelectTrigger data-testid="select-event-plan">
                      <SelectValue placeholder="Seleccionar un plan de acción..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Sin plan vinculado --</SelectItem>
                      {actionPlans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>{plan.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400 italic">Sólo planes de acción existentes pueden ser vinculados aquí.</p>
                </div>

                <Button 
                  data-testid="button-submit-event"
                  onClick={handleSubmit} 
                  disabled={!form.descripcion.trim()}
                  className="w-full mt-2"
                >
                  {editingEvento ? "Guardar Cambios" : "Registrar Evento"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Reportes</p>
              <p data-testid="text-total-events" className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-amber-200 bg-amber-50/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Eventos Adversos</p>
              <p data-testid="text-adverse-events-count" className="text-2xl font-bold text-amber-900">{stats.byClasificacion.adverso}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-blue-200 bg-blue-50/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">Incidentes</p>
              <p data-testid="text-incidents-count" className="text-2xl font-bold text-blue-900">{stats.byClasificacion.incidente}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-red-200 bg-red-50/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-red-700 uppercase tracking-wider">Graves / Muertes</p>
              <p data-testid="text-severe-events-count" className="text-2xl font-bold text-red-900">{stats.byGravedad.grave + stats.byGravedad.muerte}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-slate-200 bg-slate-50/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                data-testid="input-search-events"
                placeholder="Buscar descripción..." 
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger data-testid="select-filter-type" className="bg-white">
                <SelectValue placeholder="Tipo de Evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Tipos</SelectItem>
                {Object.entries(EVENTO_TIPO_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterClasificacion} onValueChange={setFilterClasificacion}>
              <SelectTrigger data-testid="select-filter-classification" className="bg-white">
                <SelectValue placeholder="Clasificación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Clasific.</SelectItem>
                {Object.entries(EVENTO_CLASIFICACION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterGravedad} onValueChange={setFilterGravedad}>
              <SelectTrigger data-testid="select-filter-severity" className="bg-white">
                <SelectValue placeholder="Gravedad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Gravedades</SelectItem>
                {Object.entries(EVENTO_GRAVEDAD_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger data-testid="select-filter-status" className="bg-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                {Object.entries(EVENTO_ESTADO_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Table/List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 font-semibold text-slate-600 w-32">Fecha</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Servicio / Descripción</th>
                <th className="px-4 py-3 font-semibold text-slate-600 w-40">Clasificación</th>
                <th className="px-4 py-3 font-semibold text-slate-600 w-40">Gravedad</th>
                <th className="px-4 py-3 font-semibold text-slate-600 w-36">Estado</th>
                <th className="px-4 py-3 font-semibold text-slate-600 w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500 italic">
                    No se encontraron registros que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filtered.map(e => {
                  const estadoStyle = EVENTO_ESTADO_STYLES[e.estado];
                  const gravedadStyle = EVENTO_GRAVEDAD_STYLES[e.gravedad];
                  const plan = e.linkedPlanId ? actionPlans.find(p => p.id === e.linkedPlanId) : null;

                  return (
                    <tr key={e.id} data-testid={`row-event-${e.id}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(e.fecha), "dd/MM/yyyy")}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-900 mb-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {e.servicio}
                          <Badge variant="outline" className="ml-1 text-[10px] font-normal py-0">
                            {EVENTO_TIPO_LABELS[e.tipoEvento]}
                          </Badge>
                        </div>
                        <p className="text-slate-600 line-clamp-2 text-xs leading-relaxed max-w-md">
                          {e.descripcion}
                        </p>
                        {plan && (
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-blue-600 font-medium">
                            <ExternalLink className="h-3 w-3" />
                            Plan: {plan.title}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <Badge variant="outline" className="capitalize font-normal border-slate-200 bg-slate-50">
                          {EVENTO_CLASIFICACION_LABELS[e.clasificacion]}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <Badge className={`${gravedadStyle.bg} ${gravedadStyle.text} ${gravedadStyle.border} border shadow-none font-medium`}>
                          {EVENTO_GRAVEDAD_LABELS[e.gravedad]}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold border ${estadoStyle.bg} ${estadoStyle.text} ${estadoStyle.border}`}>
                          {e.estado === 'pendiente' && <Clock className="h-3 w-3" />}
                          {e.estado === 'en_analisis' && <AlertCircle className="h-3 w-3" />}
                          {e.estado === 'cerrado' && <CheckCircle2 className="h-3 w-3" />}
                          {EVENTO_ESTADO_LABELS[e.estado]}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                onClick={() => handleEdit(e)}
                                data-testid={`button-edit-event-${e.id}`}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-red-600"
                                onClick={() => {
                                  if (confirm("¿Está seguro de eliminar este reporte?")) {
                                    deleteEventoAdverso(e.id);
                                  }
                                }}
                                data-testid={`button-delete-event-${e.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
