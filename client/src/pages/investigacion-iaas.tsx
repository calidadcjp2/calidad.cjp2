import { useState, useMemo, useEffect } from "react";
import { useActivities } from "@/context/ActivityContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  ClipboardList,
  Filter,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import {
  IaasInvestigation,
  INVESTIGATION_STATUS_LABELS,
  INVESTIGATION_STATUS_STYLES,
  IAAS_INFECTION_LABELS,
  IAAS_DEVICE_LABELS,
} from "@/lib/types";
import { useLocation } from "wouter";

export default function InvestigacionIAAS() {
  const { iaasInvestigations, updateIaasInvestigation } = useActivities();
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedInv, setSelectedInv] = useState<IaasInvestigation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sync with URL params if any
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const suspectId = params.get("suspectId");
    if (suspectId) {
      const inv = iaasInvestigations.find((i) => i.suspectId === suspectId);
      if (inv) {
        setSelectedInv(inv);
        setIsDialogOpen(true);
      }
    }
  }, [iaasInvestigations, location]);

  const filtered = useMemo(() => {
    return iaasInvestigations
      .filter((inv) => {
        const matchSearch =
          !searchTerm ||
          inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus =
          filterStatus === "all" || inv.status === filterStatus;
        return matchSearch && matchStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [iaasInvestigations, searchTerm, filterStatus]);

  const handleEdit = (inv: IaasInvestigation) => {
    setSelectedInv(inv);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">Investigación IAAS</h1>
        <p className="text-slate-500">
          Análisis causa-raíz de casos confirmados de infecciones asociadas a la atención de salud.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              data-testid="input-search-investigations"
              placeholder="Buscar por paciente, servicio, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger data-testid="select-filter-status" className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(INVESTIGATION_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No se encontraron investigaciones</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((inv) => {
            const styles = INVESTIGATION_STATUS_STYLES[inv.status];
            return (
              <Card
                key={inv.id}
                data-testid={`card-investigation-${inv.id}`}
                className="hover:shadow-md transition-shadow cursor-pointer border-l-4"
                style={{ borderLeftColor: styles.text.replace('text-', '') }}
                onClick={() => handleEdit(inv)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <Badge
                      className={`${styles.bg} ${styles.text} ${styles.border} font-medium`}
                    >
                      {INVESTIGATION_STATUS_LABELS[inv.status]}
                    </Badge>
                    <span className="text-xs font-mono text-slate-400">{inv.id}</span>
                  </div>
                  <CardTitle className="text-lg text-slate-900">{inv.patientName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500 block">Servicio</span>
                      <span className="font-medium text-slate-700">{inv.service}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Fecha Detección</span>
                      <span className="font-medium text-slate-700">
                        {format(new Date(inv.detectionDate), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500 block">Infección</span>
                    <span className="font-medium text-slate-700">
                      {IAAS_INFECTION_LABELS[inv.infectionType]} 
                      {inv.device !== 'ninguno' && ` (${IAAS_DEVICE_LABELS[inv.device]})`}
                    </span>
                  </div>
                  {inv.causaProbable && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
                        Causa Probable
                      </span>
                      <p className="text-sm text-slate-600 line-clamp-2 italic">
                        "{inv.causaProbable}"
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end pt-2">
                    <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
                      Gestionar <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedInv && (
        <InvestigationDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          investigation={selectedInv}
          onUpdate={(updates) => {
            updateIaasInvestigation(selectedInv.id, updates);
          }}
        />
      )}
    </div>
  );
}

function InvestigationDialog({
  isOpen,
  onOpenChange,
  investigation,
  onUpdate,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  investigation: IaasInvestigation;
  onUpdate: (updates: Partial<IaasInvestigation>) => void;
}) {
  const [localInv, setLocalInv] = useState<IaasInvestigation>(investigation);

  useEffect(() => {
    setLocalInv(investigation);
  }, [investigation]);

  const updateFactor = (
    group: keyof Pick<IaasInvestigation, 'factorsPatient' | 'factorsProcedure' | 'factorsTeam' | 'factorsEnvironment'>,
    factor: string,
    field: 'checked' | 'nota',
    value: any
  ) => {
    const currentGroup = localInv[groupKey];
    const newInv = {
      ...localInv,
      [group]: {
        ...currentGroup,
        [factor]: {
          ...(currentGroup[factor as keyof typeof currentGroup] as any),
          [field]: value,
        },
      },
    };

    // Auto-generate causa probable and plan
    const { causa, plan } = generateReasonAndPlan(newInv);
    newInv.causaProbable = causa;
    newInv.planAccionSugerido = plan;

    setLocalInv(newInv);
  };

  const handleSave = () => {
    onUpdate(localInv);
    onOpenChange(false);
  };

  const factorGroups = [
    {
      id: "factorsPatient",
      label: "Factores del Paciente",
      factors: [
        { id: "comorbilidades", label: "Comorbilidades" },
        { id: "inmunosupresion", label: "Inmunosupresión" },
        { id: "otros", label: "Otros" },
      ],
    },
    {
      id: "factorsProcedure",
      label: "Factores del Procedimiento",
      factors: [
        { id: "cumplimientoProtocolo", label: "Cumplimiento de protocolo" },
        { id: "tecnicaUtilizada", label: "Técnica utilizada" },
        { id: "usoChecklists", label: "Uso de checklists" },
      ],
    },
    {
      id: "factorsTeam",
      label: "Factores del Equipo de Salud",
      factors: [
        { id: "adherenciaHigieneManos", label: "Adherencia higiene manos" },
        { id: "usoEPP", label: "Uso EPP" },
        { id: "capacitacion", label: "Capacitación" },
      ],
    },
    {
      id: "factorsEnvironment",
      label: "Factores del Entorno",
      factors: [
        { id: "limpieza", label: "Limpieza" },
        { id: "disponibilidadInsumos", label: "Disponibilidad insumos" },
        { id: "cargaAsistencial", label: "Carga asistencial" },
      ],
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            Investigación Causa-Raíz: {localInv.patientName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          {/* Info Panel */}
          <div className="md:col-span-1 space-y-4">
            <Card className="bg-slate-50 border-none shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Datos del Caso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <Label className="text-slate-500">Paciente</Label>
                  <p className="font-medium">{localInv.patientName}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Servicio</Label>
                  <p className="font-medium">{localInv.service}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Fecha Detección</Label>
                  <p className="font-medium">{format(new Date(localInv.detectionDate), "PPP")}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Tipo Infección</Label>
                  <p className="font-medium">{IAAS_INFECTION_LABELS[localInv.infectionType]}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Dispositivo</Label>
                  <p className="font-medium">{IAAS_DEVICE_LABELS[localInv.device]}</p>
                </div>
                <div className="pt-4">
                  <Label>Estado de Investigación</Label>
                  <Select
                    value={localInv.status}
                    onValueChange={(v) => setLocalInv({ ...localInv, status: v as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(INVESTIGATION_STATUS_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                <AlertCircle className="h-4 w-4" />
                Causa Probable Detectada
              </div>
              <p className="text-sm text-blue-800 italic">
                {localInv.causaProbable || "No se han identificado factores determinantes todavía."}
              </p>
            </div>
          </div>

          {/* Factors Grid */}
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {factorGroups.map((group) => (
                <div key={group.id} className="space-y-3">
                  <h3 className="font-bold text-slate-800 border-b pb-1 text-sm uppercase tracking-wide">
                    {group.label}
                  </h3>
                  <div className="space-y-4">
                    {group.factors.map((f) => {
                      const groupKey = group.id as keyof Pick<IaasInvestigation, 'factorsPatient' | 'factorsProcedure' | 'factorsTeam' | 'factorsEnvironment'>;
                      const factorData = localInv[groupKey][f.id as keyof typeof localInv[typeof groupKey]] as any;
                      return (
                        <div key={f.id} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`${group.id}-${f.id}`}
                              checked={factorData.checked}
                              onCheckedChange={(checked) =>
                                updateFactor(groupKey, f.id, "checked", checked)
                              }
                            />
                            <Label
                              htmlFor={`${group.id}-${f.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {f.label}
                            </Label>
                          </div>
                          {factorData.checked && (
                            <Input
                              placeholder="Nota u observación..."
                              value={factorData.nota}
                              onChange={(e) =>
                                updateFactor(groupKey, f.id, "nota", e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Plan de Acción Sugerido
              </h3>
              <Textarea
                placeholder="El plan se generará automáticamente según los factores, o puede escribirlo manualmente..."
                value={localInv.planAccionSugerido}
                onChange={(e) => setLocalInv({ ...localInv, planAccionSugerido: e.target.value })}
                className="min-h-[100px] bg-emerald-50/30 border-emerald-100"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function generateReasonAndPlan(inv: IaasInvestigation) {
  const factors: string[] = [];
  const actions: string[] = [];

  // Patient factors
  if (inv.factorsPatient.comorbilidades.checked) factors.push("complejidad clínica del paciente (comorbilidades)");
  if (inv.factorsPatient.inmunosupresion.checked) factors.push("estado de inmunosupresión");
  
  // Procedure factors
  if (inv.factorsProcedure.cumplimientoProtocolo.checked) {
    factors.push("quiebres en el cumplimiento de protocolos establecidos");
    actions.push("Reforzar capacitación sobre protocolos de instalación y mantención de dispositivos.");
  }
  if (inv.factorsProcedure.tecnicaUtilizada.checked) {
    factors.push("técnica aséptica deficiente durante el procedimiento");
    actions.push("Supervisión directa de procedimientos invasivos por enfermera clínica.");
  }
  
  // Team factors
  if (inv.factorsTeam.adherenciaHigieneManos.checked) {
    factors.push("baja adherencia a la higiene de manos");
    actions.push("Realizar campaña de reforzamiento de los 5 momentos de higiene de manos en la unidad.");
  }
  if (inv.factorsTeam.usoEPP.checked) {
    factors.push("uso incorrecto de elementos de protección personal");
    actions.push("Auditoría de uso de EPP en el servicio.");
  }
  if (inv.factorsTeam.capacitacion.checked) {
    factors.push("falta de capacitación específica del personal");
    actions.push("Programar inducción técnica para el personal nuevo o rotante.");
  }
  
  // Environment factors
  if (inv.factorsEnvironment.limpieza.checked) {
    factors.push("deficiencias en los procesos de limpieza y desinfección ambiental");
    actions.push("Coordinar aseo terminal y revisión de protocolos con equipo de higiene.");
  }
  if (inv.factorsEnvironment.disponibilidadInsumos.checked) {
    factors.push("falta de insumos críticos para la atención segura");
    actions.push("Gestionar stock permanente de insumos necesarios para técnica aséptica.");
  }
  if (inv.factorsEnvironment.cargaAsistencial.checked) {
    factors.push("alta carga asistencial y relación enfermera/paciente inadecuada");
    actions.push("Evaluar refuerzo de dotación según complejidad de pacientes.");
  }

  let causa = "";
  if (factors.length > 0) {
    causa = "Se identifica como causa probable " + factors.join(", ") + ".";
    // Capitalize first factor and clean up
    causa = causa.charAt(0).toUpperCase() + causa.slice(1).replace(/, ([^,]*)$/, ' y $1');
  } else {
    causa = "En evaluación clínica. No se han detectado quiebres evidentes en los factores de riesgo.";
  }

  const plan = actions.length > 0 
    ? "Acciones inmediatas sugeridas:\n" + actions.map(a => `• ${a}`).join("\n")
    : "Se sugiere mantener vigilancia estrecha y reforzar medidas estándar de precaución.";

  return { causa, plan };
}
