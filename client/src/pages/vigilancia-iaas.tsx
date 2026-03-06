import { useState, useMemo } from "react";
import { useActivities } from "@/context/ActivityContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  Plus,
  AlertTriangle,
  Activity,
  FileBarChart,
  ClipboardList,
  Download,
  Search,
  Microscope,
  BedDouble,
} from "lucide-react";
import { format, differenceInHours, differenceInDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  IaasSuspect,
  IaasSuspectStatus,
  IaasInfectionType,
  IaasDevice,
  IAAS_INFECTION_LABELS,
  IAAS_DEVICE_LABELS,
  IAAS_SUSPECT_STATUS_OPTIONS,
  IAAS_SUSPECT_STATUS_STYLES,
} from "@/lib/types";

const SERVICES = [
  "UCI Adulto",
  "UCI Pediátrica",
  "Neonatología",
  "Medicina Interna",
  "Cirugía",
  "Traumatología",
  "Pediatría",
  "Ginecología",
  "Urgencia",
  "Otro",
];

const PIE_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];

interface IaasAlert {
  id: string;
  type: "cluster" | "outbreak";
  message: string;
  service: string;
  infectionType: IaasInfectionType;
  count: number;
  detectedAt: string;
  suspects: IaasSuspect[];
}

function generateAlerts(suspects: IaasSuspect[]): IaasAlert[] {
  const alerts: IaasAlert[] = [];
  const activeSuspects = suspects.filter(
    (s) => s.status !== "descartado"
  );

  const byServiceAndType: Record<string, IaasSuspect[]> = {};
  activeSuspects.forEach((s) => {
    const key = `${s.service}|${s.infectionType}`;
    if (!byServiceAndType[key]) byServiceAndType[key] = [];
    byServiceAndType[key].push(s);
  });

  Object.entries(byServiceAndType).forEach(([key, group]) => {
    const [service, infType] = key.split("|");
    const sorted = [...group].sort(
      (a, b) =>
        new Date(a.detectionDate).getTime() -
        new Date(b.detectionDate).getTime()
    );

    for (let i = 0; i < sorted.length; i++) {
      const within72h = sorted.filter(
        (s, j) =>
          j !== i &&
          Math.abs(
            differenceInHours(
              new Date(s.detectionDate),
              new Date(sorted[i].detectionDate)
            )
          ) <= 72
      );
      if (within72h.length >= 1) {
        const clusterSuspects = [sorted[i], ...within72h];
        const uniqueIds = [...new Set(clusterSuspects.map((s) => s.id))];
        const alertId = `cluster-${service}-${infType}-${uniqueIds.sort().join("-")}`;
        if (!alerts.find((a) => a.id === alertId)) {
          alerts.push({
            id: alertId,
            type: "cluster",
            message: `${uniqueIds.length} casos de ${IAAS_INFECTION_LABELS[infType as IaasInfectionType]} en ${service} dentro de 72 horas`,
            service,
            infectionType: infType as IaasInfectionType,
            count: uniqueIds.length,
            detectedAt: sorted[i].detectionDate,
            suspects: clusterSuspects.filter(
              (s, idx, arr) => arr.findIndex((x) => x.id === s.id) === idx
            ),
          });
        }
        break;
      }
    }
  });

  const byService: Record<string, IaasSuspect[]> = {};
  activeSuspects.forEach((s) => {
    if (!byService[s.service]) byService[s.service] = [];
    byService[s.service].push(s);
  });

  Object.entries(byService).forEach(([service, group]) => {
    const last7Days = group.filter(
      (s) =>
        differenceInDays(new Date(), new Date(s.detectionDate)) <= 7
    );
    if (last7Days.length >= 3) {
      const alertId = `outbreak-${service}`;
      if (!alerts.find((a) => a.id === alertId)) {
        alerts.push({
          id: alertId,
          type: "outbreak",
          message: `${last7Days.length} infecciones en ${service} en los últimos 7 días — posible brote`,
          service,
          infectionType: last7Days[0].infectionType,
          count: last7Days.length,
          detectedAt: new Date().toISOString(),
          suspects: last7Days,
        });
      }
    }
  });

  return alerts;
}

function RegistroSospecha() {
  const { iaasSuspects, addIaasSuspect, updateIaasSuspect, iaasInvestigations, addIaasInvestigation } = useActivities();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [form, setForm] = useState({
    patientName: "",
    run: "",
    service: SERVICES[0],
    bed: "",
    detectionDate: format(new Date(), "yyyy-MM-dd"),
    infectionType: "itu" as IaasInfectionType,
    device: "ninguno" as IaasDevice,
    cultureTaken: false,
    notifyingProfessional: "",
  });

  const resetForm = () => {
    setForm({
      patientName: "",
      run: "",
      service: SERVICES[0],
      bed: "",
      detectionDate: format(new Date(), "yyyy-MM-dd"),
      infectionType: "itu",
      device: "ninguno",
      cultureTaken: false,
      notifyingProfessional: "",
    });
  };

  const handleSubmit = () => {
    if (!form.patientName.trim() || !form.notifyingProfessional.trim()) return;
    addIaasSuspect({
      ...form,
      status: "pendiente",
    });
    resetForm();
    setDialogOpen(false);
  };

  const filtered = useMemo(() => {
    return iaasSuspects
      .filter((s) => {
        const matchSearch =
          !searchTerm ||
          s.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.run.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus =
          filterStatus === "all" || s.status === filterStatus;
        return matchSearch && matchStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.detectionDate).getTime() -
          new Date(a.detectionDate).getTime()
      );
  }, [iaasSuspects, searchTerm, filterStatus]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              data-testid="input-search-suspects"
              placeholder="Buscar por paciente, RUN, servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger data-testid="select-filter-status" className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {IAAS_SUSPECT_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-suspect" className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Nueva Sospecha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Sospecha de IAAS</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nombre Paciente *</Label>
                  <Input
                    data-testid="input-patient-name"
                    value={form.patientName}
                    onChange={(e) =>
                      setForm({ ...form, patientName: e.target.value })
                    }
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>RUN</Label>
                  <Input
                    data-testid="input-run"
                    value={form.run}
                    onChange={(e) => setForm({ ...form, run: e.target.value })}
                    placeholder="12.345.678-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Servicio</Label>
                  <Select
                    value={form.service}
                    onValueChange={(v) => setForm({ ...form, service: v })}
                  >
                    <SelectTrigger data-testid="select-service">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Cama</Label>
                  <Input
                    data-testid="input-bed"
                    value={form.bed}
                    onChange={(e) => setForm({ ...form, bed: e.target.value })}
                    placeholder="Ej: 301-A"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha Detección</Label>
                <Input
                  data-testid="input-detection-date"
                  type="date"
                  value={form.detectionDate}
                  onChange={(e) =>
                    setForm({ ...form, detectionDate: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tipo de Infección</Label>
                  <Select
                    value={form.infectionType}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        infectionType: v as IaasInfectionType,
                      })
                    }
                  >
                    <SelectTrigger data-testid="select-infection-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(IAAS_INFECTION_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Dispositivo Asociado</Label>
                  <Select
                    value={form.device}
                    onValueChange={(v) =>
                      setForm({ ...form, device: v as IaasDevice })
                    }
                  >
                    <SelectTrigger data-testid="select-device">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(IAAS_DEVICE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  data-testid="input-culture-taken"
                  type="checkbox"
                  id="cultureTaken"
                  checked={form.cultureTaken}
                  onChange={(e) =>
                    setForm({ ...form, cultureTaken: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                <Label htmlFor="cultureTaken">Cultivo tomado</Label>
              </div>
              <div className="space-y-1.5">
                <Label>Profesional que Notifica *</Label>
                <Input
                  data-testid="input-notifying-professional"
                  value={form.notifyingProfessional}
                  onChange={(e) =>
                    setForm({ ...form, notifyingProfessional: e.target.value })
                  }
                  placeholder="Nombre del profesional"
                />
              </div>
              <Button
                data-testid="button-submit-suspect"
                onClick={handleSubmit}
                disabled={
                  !form.patientName.trim() || !form.notifyingProfessional.trim()
                }
                className="w-full mt-2"
              >
                Registrar Sospecha
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Microscope className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay registros de sospecha</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Paciente
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Servicio
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Tipo
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Dispositivo
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Fecha
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => {
                  const styles = IAAS_SUSPECT_STATUS_STYLES[s.status];
                  return (
                    <tr
                      key={s.id}
                      data-testid={`row-suspect-${s.id}`}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {s.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {s.patientName}
                        </div>
                        <div className="text-xs text-slate-500">{s.run}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <BedDouble className="h-3.5 w-3.5 text-slate-400" />
                          {s.service}
                          {s.bed && (
                            <span className="text-xs text-slate-400">
                              — Cama {s.bed}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {IAAS_INFECTION_LABELS[s.infectionType]}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {IAAS_DEVICE_LABELS[s.device]}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {format(new Date(s.detectionDate), "dd/MM/yyyy")}
                      </td>
                      <td className="py-3 px-4">
                          {s.status === "confirmado" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-blue-600"
                              title="Ver Investigación"
                              asChild
                            >
                              <a href={`/investigacion-iaas?suspectId=${s.id}`}>
                                <ClipboardList className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Select
                            value={s.status}
                            onValueChange={(v) => {
                              const newStatus = v as IaasSuspectStatus;
                              updateIaasSuspect(s.id, {
                                status: newStatus,
                              });
                              
                              if (newStatus === "confirmado") {
                                // Check if investigation already exists
                                const exists = iaasInvestigations.some(inv => inv.suspectId === s.id);
                                if (!exists) {
                                  addIaasInvestigation({
                                    suspectId: s.id,
                                    patientName: s.patientName,
                                    service: s.service,
                                    detectionDate: s.detectionDate,
                                    infectionType: s.infectionType,
                                    device: s.device,
                                    factorsPatient: {
                                      comorbilidades: { checked: false, nota: "" },
                                      inmunosupresion: { checked: false, nota: "" },
                                      otros: { checked: false, nota: "" },
                                    },
                                    factorsProcedure: {
                                      cumplimientoProtocolo: { checked: false, nota: "" },
                                      tecnicaUtilizada: { checked: false, nota: "" },
                                      usoChecklists: { checked: false, nota: "" },
                                    },
                                    factorsTeam: {
                                      adherenciaHigieneManos: { checked: false, nota: "" },
                                      usoEPP: { checked: false, nota: "" },
                                      capacitacion: { checked: false, nota: "" },
                                    },
                                    factorsEnvironment: {
                                      limpieza: { checked: false, nota: "" },
                                      disponibilidadInsumos: { checked: false, nota: "" },
                                      cargaAsistencial: { checked: false, nota: "" },
                                    },
                                    causaProbable: "",
                                    planAccionSugerido: "",
                                    status: "abierta",
                                  });
                                }
                              }
                            }}
                          >
                          <SelectTrigger
                            data-testid={`select-status-${s.id}`}
                            className={`h-7 text-xs border ${styles.bg} ${styles.text} ${styles.border} w-[140px]`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {IAAS_SUSPECT_STATUS_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PanelEpidemiologico() {
  const { iaasSuspects } = useActivities();
  const [periodoMeses, setPeriodoMeses] = useState(3);

  const stats = useMemo(() => {
    const cutoff = subDays(new Date(), periodoMeses * 30);
    const inPeriod = iaasSuspects.filter(
      (s) => new Date(s.detectionDate) >= cutoff
    );

    const confirmed = inPeriod.filter((s) => s.status === "confirmado");
    const pending = inPeriod.filter((s) => s.status === "pendiente");
    const investigating = inPeriod.filter(
      (s) => s.status === "en_investigacion"
    );

    const byType: Record<string, number> = {};
    inPeriod.forEach((s) => {
      byType[IAAS_INFECTION_LABELS[s.infectionType]] =
        (byType[IAAS_INFECTION_LABELS[s.infectionType]] || 0) + 1;
    });
    const typeData = Object.entries(byType).map(([name, value]) => ({
      name,
      value,
    }));

    const byService: Record<string, number> = {};
    inPeriod.forEach((s) => {
      byService[s.service] = (byService[s.service] || 0) + 1;
    });
    const serviceData = Object.entries(byService)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const byMonth: Record<string, number> = {};
    inPeriod.forEach((s) => {
      const month = format(new Date(s.detectionDate), "yyyy-MM");
      byMonth[month] = (byMonth[month] || 0) + 1;
    });
    const trendData = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month: format(new Date(month + "-01"), "MMM yyyy", { locale: es }),
        count,
      }));

    const byDevice: Record<string, number> = {};
    inPeriod
      .filter((s) => s.device !== "ninguno")
      .forEach((s) => {
        byDevice[IAAS_DEVICE_LABELS[s.device]] =
          (byDevice[IAAS_DEVICE_LABELS[s.device]] || 0) + 1;
      });
    const deviceData = Object.entries(byDevice).map(([name, value]) => ({
      name,
      value,
    }));

    const cultureRate =
      inPeriod.length > 0
        ? Math.round(
            (inPeriod.filter((s) => s.cultureTaken).length / inPeriod.length) *
              100
          )
        : 0;

    return {
      total: inPeriod.length,
      confirmed: confirmed.length,
      pending: pending.length,
      investigating: investigating.length,
      typeData,
      serviceData,
      trendData,
      deviceData,
      cultureRate,
    };
  }, [iaasSuspects, periodoMeses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">
          Panel Epidemiológico
        </h3>
        <Select
          value={String(periodoMeses)}
          onValueChange={(v) => setPeriodoMeses(Number(v))}
        >
          <SelectTrigger data-testid="select-period" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Último mes</SelectItem>
            <SelectItem value="3">Últimos 3 meses</SelectItem>
            <SelectItem value="6">Últimos 6 meses</SelectItem>
            <SelectItem value="12">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Total Sospechas
            </p>
            <p
              data-testid="text-total-suspects"
              className="text-3xl font-bold text-slate-900 mt-1"
            >
              {stats.total}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-red-200 bg-red-50/30">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-red-600 uppercase tracking-wide">
              Confirmadas
            </p>
            <p
              data-testid="text-confirmed"
              className="text-3xl font-bold text-red-700 mt-1"
            >
              {stats.confirmed}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-amber-200 bg-amber-50/30">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">
              Pendientes
            </p>
            <p
              data-testid="text-pending"
              className="text-3xl font-bold text-amber-700 mt-1"
            >
              {stats.pending}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-blue-200 bg-blue-50/30">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              Tasa Cultivo
            </p>
            <p
              data-testid="text-culture-rate"
              className="text-3xl font-bold text-blue-700 mt-1"
            >
              {stats.cultureRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Tendencia Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stats.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6" }}
                    name="Casos"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                Sin datos para el período
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Por Tipo de Infección
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.typeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stats.typeData.map((_entry, index) => (
                      <Cell
                        key={index}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                Sin datos
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Por Servicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.serviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.serviceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Casos" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                Sin datos
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Por Dispositivo Asociado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.deviceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stats.deviceData.map((_entry, index) => (
                      <Cell
                        key={index}
                        fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                Sin dispositivos asociados
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SistemaAlertas() {
  const { iaasSuspects } = useActivities();
  const alerts = useMemo(() => generateAlerts(iaasSuspects), [iaasSuspects]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-700">
        Alertas Automáticas
      </h3>
      <p className="text-sm text-slate-500">
        Se generan alertas cuando se detectan ≥2 infecciones del mismo tipo en
        un servicio dentro de 72 horas, o ≥3 infecciones en un servicio en los
        últimos 7 días.
      </p>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-lg font-medium text-slate-900">
              Sin alertas activas
            </p>
            <p className="text-slate-500 mt-1">
              No se detectan agrupaciones ni brotes actualmente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              data-testid={`card-alert-${alert.id}`}
              className={`shadow-sm ${
                alert.type === "outbreak"
                  ? "border-red-300 bg-red-50/50"
                  : "border-amber-300 bg-amber-50/50"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-full shrink-0 mt-0.5 ${
                      alert.type === "outbreak"
                        ? "bg-red-100 text-red-600"
                        : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          alert.type === "outbreak"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[10px] uppercase"
                      >
                        {alert.type === "outbreak"
                          ? "Posible Brote"
                          : "Agrupamiento"}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {format(new Date(alert.detectedAt), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    <p className="font-medium text-slate-900">
                      {alert.message}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {alert.suspects.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center text-xs bg-white border border-slate-200 rounded px-2 py-0.5"
                        >
                          {s.patientName} — {s.service}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ReporteComite() {
  const { iaasSuspects } = useActivities();
  const [reportMonth, setReportMonth] = useState(
    format(new Date(), "yyyy-MM")
  );

  const monthData = useMemo(() => {
    const [year, month] = reportMonth.split("-").map(Number);
    const filtered = iaasSuspects.filter((s) => {
      const d = new Date(s.detectionDate);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    const confirmed = filtered.filter((s) => s.status === "confirmado");
    const discarded = filtered.filter((s) => s.status === "descartado");
    const pending = filtered.filter(
      (s) => s.status === "pendiente" || s.status === "en_investigacion"
    );

    const byType: Record<string, { total: number; confirmed: number }> = {};
    filtered.forEach((s) => {
      const label = IAAS_INFECTION_LABELS[s.infectionType];
      if (!byType[label]) byType[label] = { total: 0, confirmed: 0 };
      byType[label].total++;
      if (s.status === "confirmado") byType[label].confirmed++;
    });

    const byService: Record<string, { total: number; confirmed: number }> = {};
    filtered.forEach((s) => {
      if (!byService[s.service])
        byService[s.service] = { total: 0, confirmed: 0 };
      byService[s.service].total++;
      if (s.status === "confirmado") byService[s.service].confirmed++;
    });

    const cultureRate =
      filtered.length > 0
        ? Math.round(
            (filtered.filter((s) => s.cultureTaken).length / filtered.length) *
              100
          )
        : 0;

    const alerts = generateAlerts(filtered);

    return {
      total: filtered.length,
      confirmed: confirmed.length,
      discarded: discarded.length,
      pending: pending.length,
      cultureRate,
      byType: Object.entries(byType),
      byService: Object.entries(byService),
      alerts,
      records: filtered,
    };
  }, [iaasSuspects, reportMonth]);

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Paciente",
      "RUN",
      "Servicio",
      "Cama",
      "Fecha Detección",
      "Tipo Infección",
      "Dispositivo",
      "Cultivo",
      "Profesional",
      "Estado",
    ];
    const rows = monthData.records.map((s) => [
      s.id,
      `"${s.patientName}"`,
      s.run,
      s.service,
      s.bed,
      format(new Date(s.detectionDate), "dd/MM/yyyy"),
      IAAS_INFECTION_LABELS[s.infectionType],
      IAAS_DEVICE_LABELS[s.device],
      s.cultureTaken ? "Sí" : "No",
      `"${s.notifyingProfessional}"`,
      IAAS_SUSPECT_STATUS_OPTIONS.find((o) => o.value === s.status)?.label || s.status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_iaas_${reportMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const monthLabel = format(new Date(reportMonth + "-01"), "MMMM yyyy", {
    locale: es,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-700">
          Reporte Comité IAAS — {monthLabel}
        </h3>
        <div className="flex items-center gap-2">
          <Input
            data-testid="input-report-month"
            type="month"
            value={reportMonth}
            onChange={(e) => setReportMonth(e.target.value)}
            className="w-[180px]"
          />
          <Button
            data-testid="button-export-csv"
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="gap-2"
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium text-slate-500 uppercase">
              Total Sospechas
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {monthData.total}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-red-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium text-red-600 uppercase">
              Confirmadas
            </p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {monthData.confirmed}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium text-slate-500 uppercase">
              Descartadas
            </p>
            <p className="text-2xl font-bold text-slate-700 mt-1">
              {monthData.discarded}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-amber-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs font-medium text-amber-600 uppercase">
              En Estudio
            </p>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {monthData.pending}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Desglose por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {monthData.byType.length > 0 ? (
              <div className="space-y-2">
                {monthData.byType.map(([type, data]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {type}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">
                        {data.total} sospechas
                      </span>
                      <Badge
                        variant="destructive"
                        className="text-[10px]"
                      >
                        {data.confirmed} confirmadas
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">
                Sin datos para este mes
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Desglose por Servicio</CardTitle>
          </CardHeader>
          <CardContent>
            {monthData.byService.length > 0 ? (
              <div className="space-y-2">
                {monthData.byService.map(([service, data]) => (
                  <div
                    key={service}
                    className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {service}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">
                        {data.total} sospechas
                      </span>
                      <Badge
                        variant="destructive"
                        className="text-[10px]"
                      >
                        {data.confirmed} confirmadas
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">
                Sin datos para este mes
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Indicadores del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-xs text-blue-600 font-medium uppercase">
                Tasa de Cultivo
              </p>
              <p className="text-2xl font-bold text-blue-800">
                {monthData.cultureRate}%
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-xs text-purple-600 font-medium uppercase">
                Tasa Confirmación
              </p>
              <p className="text-2xl font-bold text-purple-800">
                {monthData.total > 0
                  ? Math.round(
                      (monthData.confirmed / monthData.total) * 100
                    )
                  : 0}
                %
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <p className="text-xs text-amber-600 font-medium uppercase">
                Alertas Generadas
              </p>
              <p className="text-2xl font-bold text-amber-800">
                {monthData.alerts.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {monthData.alerts.length > 0 && (
        <Card className="shadow-sm border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-700">
              Alertas del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {monthData.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-2 py-2 px-3 bg-red-50 rounded-lg"
                >
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  <span className="text-sm text-red-800">
                    {alert.message}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function VigilanciaIAAS() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Vigilancia IAAS
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Sistema de vigilancia epidemiológica de infecciones asociadas a la
          atención de salud.
        </p>
      </div>

      <Tabs defaultValue="registro" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-auto">
          <TabsTrigger
            data-testid="tab-registro"
            value="registro"
            className="gap-1.5 text-xs sm:text-sm py-2.5"
          >
            <ClipboardList className="h-4 w-4 hidden sm:block" />
            Registro
          </TabsTrigger>
          <TabsTrigger
            data-testid="tab-panel"
            value="panel"
            className="gap-1.5 text-xs sm:text-sm py-2.5"
          >
            <Activity className="h-4 w-4 hidden sm:block" />
            Panel
          </TabsTrigger>
          <TabsTrigger
            data-testid="tab-alertas"
            value="alertas"
            className="gap-1.5 text-xs sm:text-sm py-2.5"
          >
            <AlertTriangle className="h-4 w-4 hidden sm:block" />
            Alertas
          </TabsTrigger>
          <TabsTrigger
            data-testid="tab-reporte"
            value="reporte"
            className="gap-1.5 text-xs sm:text-sm py-2.5"
          >
            <FileBarChart className="h-4 w-4 hidden sm:block" />
            Informe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registro" className="mt-6">
          <RegistroSospecha />
        </TabsContent>
        <TabsContent value="panel" className="mt-6">
          <PanelEpidemiologico />
        </TabsContent>
        <TabsContent value="alertas" className="mt-6">
          <SistemaAlertas />
        </TabsContent>
        <TabsContent value="reporte" className="mt-6">
          <ReporteComite />
        </TabsContent>
      </Tabs>
    </div>
  );
}
