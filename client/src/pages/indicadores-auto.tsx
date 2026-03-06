import { useMemo } from 'react';
import { useActivities } from '@/context/ActivityContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  IAAS_INFECTION_LABELS, 
  IAAS_DEVICE_LABELS, 
  EVENTO_GRAVEDAD_LABELS,
  EVENTO_GRAVEDAD_STYLES
} from '@/lib/types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function IndicadoresAuto() {
  const { iaasSuspects, eventosAdversos, activities, actionPlans } = useActivities();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // IAAS Indicators
    const confirmedIaas = iaasSuspects.filter(s => s.status === 'confirmado');
    const monthlySuspects = iaasSuspects.filter(s => {
      const d = new Date(s.detectionDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthlyConfirmed = monthlySuspects.filter(s => s.status === 'confirmado');
    
    const iaasTasaMensual = monthlySuspects.length > 0 
      ? (monthlyConfirmed.length / monthlySuspects.length) * 100 
      : 0;

    const iaasByService = confirmedIaas.reduce((acc: any, curr) => {
      acc[curr.service] = (acc[curr.service] || 0) + 1;
      return acc;
    }, {});

    const iaasByServiceData = Object.entries(iaasByService).map(([name, value]) => ({ name, value }));

    const iaasByDevice = confirmedIaas.reduce((acc: any, curr) => {
      const label = IAAS_DEVICE_LABELS[curr.device] || curr.device;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const iaasByDeviceData = Object.entries(iaasByDevice).map(([name, value]) => ({ name, value }));

    // Eventos Adversos Indicators
    const totalEventos = eventosAdversos.length;
    const eventosByService = eventosAdversos.reduce((acc: any, curr) => {
      acc[curr.servicio] = (acc[curr.servicio] || 0) + 1;
      return acc;
    }, {});

    const eventosByServiceData = Object.entries(eventosByService).map(([name, value]) => ({ name, value }));

    const eventosByGravedad = eventosAdversos.reduce((acc: any, curr) => {
      const label = EVENTO_GRAVEDAD_LABELS[curr.gravedad] || curr.gravedad;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const eventosByGravedadData = Object.entries(eventosByGravedad).map(([name, value]) => ({ name, value }));

    // Gestión Indicators
    const reclamos = activities.filter(a => a.area === 'reclamos');
    const reclamosByMonth = reclamos.reduce((acc: any, curr) => {
      const d = new Date(curr.date);
      const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      acc[monthYear] = (acc[monthYear] || 0) + 1;
      return acc;
    }, {});

    const reclamosData = Object.entries(reclamosByMonth)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const totalPlans = actionPlans.length;
    const closedPlans = actionPlans.filter(p => p.status === 'closed').length;
    const cumplimientoPlanes = totalPlans > 0 ? (closedPlans / totalPlans) * 100 : 0;

    return {
      iaasTasaMensual,
      iaasByServiceData,
      iaasByDeviceData,
      totalEventos,
      eventosByServiceData,
      eventosByGravedadData,
      reclamosData,
      cumplimientoPlanes,
      totalPlans,
      closedPlans
    };
  }, [iaasSuspects, eventosAdversos, activities, actionPlans]);

  return (
    <div className="p-6 space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900" data-testid="text-title">Indicadores Automáticos</h1>
        <p className="text-slate-500">Monitoreo en tiempo real basado en registros del sistema</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-kpi-tasa-iaas">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Tasa IAAS (Mes Actual)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.iaasTasaMensual.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card data-testid="card-kpi-eventos-totales">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Eventos Adversos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.totalEventos}</div>
          </CardContent>
        </Card>
        <Card data-testid="card-kpi-cumplimiento-planes">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Cumplimiento Planes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.cumplimientoPlanes.toFixed(1)}%</div>
            <p className="text-xs text-slate-400">{stats.closedPlans} de {stats.totalPlans} cerrados</p>
          </CardContent>
        </Card>
        <Card data-testid="card-kpi-total-reclamos">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Reclamos Registrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.reclamosData.reduce((acc, curr) => acc + (curr.value as number), 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* IAAS Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Vigilancia IAAS</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="chart-iaas-servicio">
            <CardHeader>
              <CardTitle>IAAS por Servicio</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.iaasByServiceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" name="Casos Confirmados" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-testid="chart-iaas-dispositivo">
            <CardHeader>
              <CardTitle>IAAS por Dispositivo</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.iaasByDeviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.iaasByDeviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Seguridad del Paciente Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Seguridad del Paciente</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="chart-eventos-servicio">
            <CardHeader>
              <CardTitle>Eventos por Servicio</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.eventosByServiceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" name="Eventos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-testid="chart-eventos-gravedad">
            <CardHeader>
              <CardTitle>Gravedad de Eventos</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.eventosByGravedadData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.eventosByGravedadData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Gestión Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">Gestión y Reclamos</h2>
        <Card data-testid="chart-reclamos-mensual">
          <CardHeader>
            <CardTitle>Reclamos por Mes</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.reclamosData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#ef4444" name="N° Reclamos" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
