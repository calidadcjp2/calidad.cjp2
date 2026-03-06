import { useState, useMemo } from "react";
import { useActivities } from "@/context/ActivityContext";
import { QualityIndicator } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2, Circle, History, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

export default function Indicators() {
  const { indicators, settings, addMeasurement } = useActivities();
  const [searchTerm, setSearchTerm] = useState("");
  const [measuringInd, setMeasuringInd] = useState<QualityIndicator | null>(null);
  const [isMeasOpen, setIsMeasOpen] = useState(false);
  const [measForm, setMeasForm] = useState({ unit: "", numerator: 0, denominator: 0, period: new Date().toISOString().slice(0, 7) });
  const [selectedUnit, setSelectedUnit] = useState<string>("all");

  const isReadOnly = settings.systemRole === 'viewer';

  const allUnits = useMemo(() => {
    const units = new Set<string>();
    indicators.forEach(ind => ind.responsibleUnits.forEach(u => units.add(u)));
    return Array.from(units).sort();
  }, [indicators]);

  const openMeasureForm = (ind: QualityIndicator, unit: string) => {
    setMeasuringInd(ind);
    setMeasForm({ unit, numerator: 0, denominator: 0, period: new Date().toISOString().slice(0, 7) });
    setIsMeasOpen(true);
  };

  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!measuringInd || isReadOnly) return;
    addMeasurement(measuringInd.id, {
      unit: measForm.unit,
      numerator: Number(measForm.numerator),
      denominator: Number(measForm.denominator),
      period: measForm.period,
      submittedBy: settings.userName
    });
    setIsMeasOpen(false);
  };

  const filteredInds = indicators.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentPeriodStr = new Date().toISOString().slice(0, 7);

  const getIndicatorChartData = (ind: QualityIndicator) => {
    const periods = Array.from(new Set(ind.measurements.map(m => m.period))).sort();
    return periods.map(p => {
        const meas = ind.measurements.filter(m => m.period === p);
        const num = meas.reduce((s, m) => s + m.numerator, 0);
        const den = meas.reduce((s, m) => s + m.denominator, 0);
        const pct = den > 0 ? Math.round((num / den) * 100) : 0;
        return { period: p, cumplimiento: pct, meta: ind.goal };
    });
  };

  const getUnitChartData = (ind: QualityIndicator, unit: string) => {
    const meas = ind.measurements.filter(m => m.unit === unit).sort((a, b) => a.period.localeCompare(b.period));
    return meas.map(m => {
        const pct = m.denominator > 0 ? Math.round((m.numerator / m.denominator) * 100) : 0;
        return { period: m.period, cumplimiento: pct, meta: ind.goal };
    });
  };

  const exportUnitReport = () => {
    if (selectedUnit === 'all') return;
    
    let csvContent = `Reporte de Indicadores - Unidad: ${selectedUnit}\n`;
    csvContent += `Generado el: ${new Date().toLocaleDateString()}\n\n`;
    csvContent += `Indicador,Periodo,Numerador,Denominador,Cumplimiento %,Meta %,Estado\n`;

    indicators.forEach(ind => {
      if (ind.responsibleUnits.includes(selectedUnit)) {
        const unitMeas = ind.measurements.filter(m => m.unit === selectedUnit).sort((a, b) => a.period.localeCompare(b.period));
        unitMeas.forEach(m => {
          const pct = m.denominator > 0 ? Math.round((m.numerator / m.denominator) * 100) : 0;
          const status = pct >= ind.goal ? 'Cumple' : 'No Cumple';
          csvContent += `"${ind.name}",${m.period},${m.numerator},${m.denominator},${pct}%,${ind.goal}%,${status}\n`;
        });
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_indicadores_${selectedUnit}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Indicadores de Calidad</h1>
          <p className="text-slate-500 mt-2 text-lg">Monitoreo de cumplimiento, históricos y gráficas.</p>
        </div>
      </div>

      <Tabs defaultValue="by_indicator" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="by_indicator">Vista por Indicador</TabsTrigger>
          <TabsTrigger value="by_unit">Vista por Unidad</TabsTrigger>
        </TabsList>

        <TabsContent value="by_indicator" className="space-y-6 m-0">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Buscar indicador por nombre o código..." 
                className="pl-10 border-0 shadow-none focus-visible:ring-0 bg-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredInds.map(ind => {
              const periodMeas = ind.measurements.filter(m => m.period === currentPeriodStr);
              const totalNum = periodMeas.reduce((sum, m) => sum + m.numerator, 0);
              const totalDenom = periodMeas.reduce((sum, m) => sum + m.denominator, 0);
              const globalPercent = totalDenom > 0 ? Math.round((totalNum / totalDenom) * 100) : 0;
              const isGoalMet = globalPercent >= ind.goal;
              const chartData = getIndicatorChartData(ind);

              return (
                <Card key={ind.id} className="border-slate-200 shadow-sm overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2 font-mono text-xs">{ind.code}</Badge>
                        <CardTitle className="text-xl">{ind.name}</CardTitle>
                        <CardDescription className="mt-1">{ind.description}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-500 mb-1">Global Mes Actual ({currentPeriodStr})</div>
                        <div className={`text-3xl font-bold ${totalDenom === 0 ? 'text-slate-400' : isGoalMet ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {totalDenom > 0 ? `${globalPercent}%` : '-'}
                          <span className="text-sm font-normal text-slate-500 ml-2">Meta: {ind.goal}%</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Tabs defaultValue="current_month">
                      <div className="border-b border-slate-100 bg-slate-50/30 px-4">
                        <TabsList className="bg-transparent h-12 p-0 space-x-6">
                          <TabsTrigger value="current_month" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0">Mes Actual</TabsTrigger>
                          <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0">Histórico y Gráficas</TabsTrigger>
                        </TabsList>
                      </div>
                      
                      <TabsContent value="current_month" className="m-0 p-0">
                        <div className="divide-y divide-slate-100">
                          {ind.responsibleUnits.map(unit => {
                            const hasReported = periodMeas.some(m => m.unit === unit);
                            const unitMeas = periodMeas.find(m => m.unit === unit);
                            const unitPct = unitMeas && unitMeas.denominator > 0 ? Math.round((unitMeas.numerator / unitMeas.denominator) * 100) : null;
                            
                            return (
                              <div key={unit} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                  {hasReported ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
                                  <span className="font-medium text-slate-700">{unit}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  {hasReported && unitMeas ? (
                                    <div className="text-sm text-slate-500 text-right">
                                      <div><span className={`font-bold ${unitPct! >= ind.goal ? 'text-emerald-600' : 'text-amber-600'}`}>{unitPct}%</span> ({unitMeas.numerator}/{unitMeas.denominator})</div>
                                      <div className="text-[10px] text-slate-400">por {unitMeas.submittedBy}</div>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-slate-400 italic mr-2">Sin datos</span>
                                  )}
                                  <Button size="sm" variant="outline" onClick={() => openMeasureForm(ind, unit)} disabled={isReadOnly}>
                                    Ingresar Datos
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="history" className="m-0 p-6 space-y-6">
                        {chartData.length > 0 ? (
                          <div className="h-[300px] w-full border border-slate-100 rounded-xl p-4 bg-white shadow-sm">
                            <h4 className="text-sm font-semibold text-slate-600 mb-4 text-center">Evolución Histórica (Global)</h4>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="period" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} domain={[0, 100]} />
                                <RechartsTooltip 
                                  contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                />
                                <Legend wrapperStyle={{fontSize: '12px'}} />
                                <ReferenceLine y={ind.goal} label={{ position: 'top', value: 'Meta', fill: '#94a3b8', fontSize: 10 }} stroke="#94a3b8" strokeDasharray="3 3" />
                                <Line type="monotone" name="Cumplimiento %" dataKey="cumplimiento" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-500">No hay datos históricos para graficar.</div>
                        )}

                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <History className="w-4 h-4" /> Registro de Mediciones Anteriores
                          </h4>
                          <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-slate-100 text-slate-600 text-xs uppercase">
                                <tr>
                                  <th className="px-4 py-3">Periodo</th>
                                  <th className="px-4 py-3">Unidad</th>
                                  <th className="px-4 py-3">Numerador</th>
                                  <th className="px-4 py-3">Denominador</th>
                                  <th className="px-4 py-3">Resultado</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {ind.measurements.length === 0 && (
                                  <tr><td colSpan={5} className="px-4 py-4 text-center text-slate-500">No hay registros</td></tr>
                                )}
                                {ind.measurements.slice().sort((a,b) => b.period.localeCompare(a.period)).map(m => {
                                  const pct = m.denominator > 0 ? Math.round((m.numerator / m.denominator) * 100) : 0;
                                  return (
                                    <tr key={m.id} className="bg-white">
                                      <td className="px-4 py-2 font-medium">{m.period}</td>
                                      <td className="px-4 py-2">{m.unit}</td>
                                      <td className="px-4 py-2">{m.numerator}</td>
                                      <td className="px-4 py-2">{m.denominator}</td>
                                      <td className={`px-4 py-2 font-bold ${pct >= ind.goal ? 'text-emerald-600' : 'text-amber-600'}`}>{pct}%</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="by_unit" className="space-y-6 m-0">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Seleccionar Unidad Responsable</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una unidad..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">-- Seleccione una unidad --</SelectItem>
                  {allUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button 
              disabled={selectedUnit === 'all'} 
              onClick={exportUnitReport}
              className="gap-2 bg-slate-800 hover:bg-slate-900 text-white"
            >
              <Download className="w-4 h-4" /> Exportar Informe CSV
            </Button>
          </div>

          {selectedUnit !== 'all' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {indicators.filter(i => i.responsibleUnits.includes(selectedUnit)).map(ind => {
                const uChartData = getUnitChartData(ind, selectedUnit);
                const currentM = ind.measurements.find(m => m.unit === selectedUnit && m.period === currentPeriodStr);
                const currentPct = currentM && currentM.denominator > 0 ? Math.round((currentM.numerator / currentM.denominator)*100) : null;

                return (
                  <Card key={ind.id} className="border-slate-200 shadow-sm flex flex-col">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3 shrink-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className="mb-1 font-mono text-[10px]">{ind.code}</Badge>
                          <CardTitle className="text-base">{ind.name}</CardTitle>
                        </div>
                        <Button size="sm" variant="outline" className="h-8 text-xs shrink-0 ml-2" onClick={() => openMeasureForm(ind, selectedUnit)} disabled={isReadOnly}>
                          + Histórico
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                        <span className="text-sm text-slate-500">Mes Actual ({currentPeriodStr}):</span>
                        {currentM ? (
                          <span className={`font-bold text-lg ${currentPct! >= ind.goal ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {currentPct}% <span className="text-xs text-slate-400 font-normal">({currentM.numerator}/{currentM.denominator})</span>
                          </span>
                        ) : (
                          <Button size="sm" onClick={() => openMeasureForm(ind, selectedUnit)} disabled={isReadOnly} className="h-7 text-xs">
                            Ingresar
                          </Button>
                        )}
                      </div>

                      {uChartData.length > 0 ? (
                        <div className="h-[200px] w-full mt-auto">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={uChartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="period" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} domain={[0, 100]} />
                                <RechartsTooltip contentStyle={{fontSize: '12px', borderRadius: '6px'}} />
                                <ReferenceLine y={ind.goal} stroke="#94a3b8" strokeDasharray="3 3" />
                                <Line type="monotone" name="%" dataKey="cumplimiento" stroke="#8b5cf6" strokeWidth={2} dot={{r: 3}} />
                              </LineChart>
                            </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-[150px] flex items-center justify-center text-sm text-slate-400 italic mt-auto">
                          Sin historial para graficar
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {indicators.filter(i => i.responsibleUnits.includes(selectedUnit)).length === 0 && (
                <div className="col-span-full text-center py-10 text-slate-500">
                  Esta unidad no tiene indicadores asignados.
                </div>
              )}
            </div>
          ) : (
             <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
               Seleccione una unidad en el menú superior para ver su reporte y gráficas.
             </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isMeasOpen} onOpenChange={setIsMeasOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Ingresar Medición</DialogTitle>
            <p className="text-sm text-slate-500">{measuringInd?.name} - {measForm.unit}</p>
          </DialogHeader>
          <form onSubmit={handleSaveMeasurement} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Periodo (Mes)</Label>
              <Input type="month" value={measForm.period} onChange={e => setMeasForm({...measForm, period: e.target.value})} required />
              <p className="text-[10px] text-slate-400">Puede seleccionar meses anteriores para completar el histórico.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Numerador (Cumple)</Label>
                <Input type="number" min="0" value={measForm.numerator} onChange={e => setMeasForm({...measForm, numerator: Number(e.target.value)})} required />
              </div>
              <div className="space-y-2">
                <Label>Denominador (Total)</Label>
                <Input type="number" min="1" value={measForm.denominator} onChange={e => setMeasForm({...measForm, denominator: Number(e.target.value)})} required />
              </div>
            </div>
            {measForm.denominator > 0 && (
              <div className="bg-slate-50 p-3 rounded text-center border border-slate-200">
                <span className="text-sm text-slate-500 block">Resultado Calculado:</span>
                <span className="text-2xl font-bold text-primary">{Math.round((measForm.numerator / measForm.denominator) * 100)}%</span>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsMeasOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar Registro</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}