import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Activity, Status, Category, CaseType, WorkArea, AppSettings, Document, PeriodicTask, CaseLog, Attachment, QualityIndicator, IndicatorMeasurement, ActionPlan, CorrectiveAction, Collaborator, TrackingStatus, IaasSuspect, IaasSuspectStatus, IaasInfectionType, IaasDevice, ROLE_PERMISSIONS, generateSequentialId, EventoAdverso, EventoTipo, EventoClasificacion, EventoGravedad, EventoEstado, FactorContribuyente, IaasInvestigation, IaasFactorGroup } from '../lib/types';
import { fetchSheet, postToSheet, AREA_SHEET_MAP, SheetName } from '../lib/sheetsApi';
import { useAuth } from './AuthContext';

const defaultStatuses: Status[] = [
  { id: 'pendiente', label: 'Pendiente', color: 'amber' },
  { id: 'en_investigacion', label: 'En investigación', color: 'blue' },
  { id: 'cerrado', label: 'Cerrado', color: 'emerald' },
  { id: 'rechazado', label: 'Rechazado', color: 'red' },
];

const defaultCategories: Category[] = [
  { id: 'cat_meeting', label: 'Reunión' },
  { id: 'cat_review', label: 'Revisión de Caso' },
  { id: 'cat_doc', label: 'Preparación Doc.' },
  { id: 'cat_investigation', label: 'Investigación' },
  { id: 'cat_training', label: 'Capacitación' },
];

const defaultCaseTypes: CaseType[] = [
  { id: 'type_audit', label: 'Auditoría' },
  { id: 'type_incident', label: 'Incidente Adverso' },
  { id: 'type_infection', label: 'Brote de Infección' },
  { id: 'type_complaint', label: 'Reclamo de Paciente' },
  { id: 'type_protocol', label: 'Protocolo' },
];

const SETTINGS_STORAGE_KEY = 'healthmanage_app_settings';

const defaultSettings: AppSettings = {
  appName: 'HealthManage',
  userName: 'Administrador Médico',
  userRole: 'Dirección Médica',
  systemRole: 'admin',
  userInitials: 'AM',
  logoUrl: '',
};

function loadPersistedSettings(): Partial<AppSettings> {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function persistSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
      appName: settings.appName,
      logoUrl: settings.logoUrl,
    }));
  } catch {}
}

function safeParseJSON(val: any, fallback: any = []) {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

function safeStr(val: any): string {
  if (val === undefined || val === null) return '';
  return String(val);
}

function parseActivityRow(row: any, area: WorkArea): Activity {
  return {
    id: safeStr(row.id || row.ID) || `act_${Math.random().toString(36).substring(7)}`,
    sequentialId: safeStr(row.sequentialId || row.correlativo),
    title: safeStr(row.title || row.titulo),
    description: safeStr(row.description || row.descripcion),
    date: safeStr(row.date || row.fecha) || new Date().toISOString(),
    statusId: safeStr(row.statusId || row.estado || 'pendiente'),
    categoryId: safeStr(row.categoryId || row.categoria || 'cat_investigation'),
    caseTypeId: safeStr(row.caseTypeId || row.tipoCaso || 'type_audit'),
    area,
    responsible: safeStr(row.responsible || row.responsable),
    notes: safeStr(row.notes || row.notas),
    createdAt: safeStr(row.createdAt || row.fechaCreacion) || new Date().toISOString(),
    logs: safeParseJSON(row.logs || row.bitacora, []),
    attachments: safeParseJSON(row.attachments || row.adjuntos, []),
    adminValidation: (row.adminValidation || row.validacion || 'pending') as any,
    adminValidationNotes: safeStr(row.adminValidationNotes || row.notasValidacion),
    iaasClassification: row.iaasClassification || row.clasificacionIAAS || undefined,
    cultureResults: safeStr(row.cultureResults || row.resultadosCultivo),
    procedure: safeStr(row.procedure || row.procedimiento),
    service: safeStr(row.service || row.servicio),
    riskFactors: safeParseJSON(row.riskFactors || row.factoresRiesgo, []),
    investigationStatus: row.investigationStatus || row.estadoInvestigacion || undefined,
    linkedAdverseEventId: safeStr(row.linkedAdverseEventId || row.eventoAdversoVinculado),
    severity: row.severity || row.severidad || undefined,
    eventClassification: row.eventClassification || row.clasificacionEvento || undefined,
    followUpActions: safeStr(row.followUpActions || row.accionesSeguimiento),
    deadline: safeStr(row.deadline || row.plazo),
    claimStatus: row.claimStatus || row.estadoReclamo || undefined,
    resolution: safeStr(row.resolution || row.resolucion),
    involvedCollaborators: safeParseJSON(row.involvedCollaborators || row.colaboradoresInvolucrados, []),
  };
}

function activityToRow(a: Activity): any[] {
  return [
    a.id, a.sequentialId || '', a.title, a.description, a.date,
    a.statusId, a.categoryId, a.caseTypeId, a.area, a.responsible,
    a.notes, a.createdAt, JSON.stringify(a.logs || []),
    JSON.stringify(a.attachments || []), a.adminValidation || 'pending',
    a.adminValidationNotes || '',
    a.iaasClassification || '', a.cultureResults || '', a.procedure || '',
    a.service || '', JSON.stringify(a.riskFactors || []),
    a.investigationStatus || '', a.linkedAdverseEventId || '',
    a.severity || '', a.eventClassification || '',
    a.followUpActions || '', a.deadline || '', a.claimStatus || '',
    a.resolution || '', JSON.stringify(a.involvedCollaborators || [])
  ];
}

function parseDocumentRow(row: any): Document {
  return {
    id: safeStr(row.id || row.ID) || `doc_${Math.random().toString(36).substring(7)}`,
    name: safeStr(row.name || row.nombre),
    code: safeStr(row.code || row.codigo),
    version: safeStr(row.version || row.version),
    responsibleArea: safeStr(row.responsibleArea || row.areaResponsable),
    issueDate: safeStr(row.issueDate || row.fechaEmision),
    expirationDate: safeStr(row.expirationDate || row.fechaVencimiento),
    status: (row.status || row.estado || 'active') as any,
    trackingStatus: (row.trackingStatus || row.estadoSeguimiento || 'pendiente') as TrackingStatus,
  };
}

function documentToRow(d: Document): any[] {
  return [d.id, d.name, d.code, d.version, d.responsibleArea, d.issueDate, d.expirationDate, d.status, d.trackingStatus];
}

function parseTaskRow(row: any): PeriodicTask {
  return {
    id: safeStr(row.id || row.ID) || `task_${Math.random().toString(36).substring(7)}`,
    title: safeStr(row.title || row.titulo),
    description: safeStr(row.description || row.descripcion),
    frequency: (row.frequency || row.frecuencia || 'monthly') as any,
    nextDueDate: safeStr(row.nextDueDate || row.proximoVencimiento),
    responsible: safeStr(row.responsible || row.responsable),
    status: (row.status || row.estado || 'active') as any,
    trackingStatus: (row.trackingStatus || row.estadoSeguimiento || 'pendiente') as TrackingStatus,
  };
}

function taskToRow(t: PeriodicTask): any[] {
  return [t.id, t.title, t.description, t.frequency, t.nextDueDate, t.responsible, t.status, t.trackingStatus];
}

function parseIndicatorRow(row: any): QualityIndicator {
  return {
    id: safeStr(row.id || row.ID) || `ind_${Math.random().toString(36).substring(7)}`,
    name: safeStr(row.name || row.nombre),
    code: safeStr(row.code || row.codigo),
    description: safeStr(row.description || row.descripcion),
    goal: Number(row.goal || row.meta || 0),
    frequency: (row.frequency || row.frecuencia || 'monthly') as any,
    responsibleUnits: safeParseJSON(row.responsibleUnits || row.unidadesResponsables, []),
    measurements: safeParseJSON(row.measurements || row.mediciones, []),
    status: (row.status || row.estado || 'active') as any,
  };
}

function indicatorToRow(ind: QualityIndicator): any[] {
  return [
    ind.id, ind.name, ind.code, ind.description, ind.goal,
    ind.frequency, JSON.stringify(ind.responsibleUnits),
    JSON.stringify(ind.measurements), ind.status
  ];
}

function parseActionPlanRow(row: any): ActionPlan {
  return {
    id: safeStr(row.id || row.ID) || `plan_${Math.random().toString(36).substring(7)}`,
    title: safeStr(row.title || row.titulo),
    linkedActivityId: safeStr(row.linkedActivityId || row.actividadVinculada) || undefined,
    createdAt: safeStr(row.createdAt || row.fechaCreacion) || new Date().toISOString(),
    actions: safeParseJSON(row.actions || row.acciones, []),
    status: (row.status || row.estado || 'active') as any,
    trackingStatus: (row.trackingStatus || row.estadoSeguimiento || 'pendiente') as TrackingStatus,
  };
}

function actionPlanToRow(p: ActionPlan): any[] {
  return [p.id, p.title, p.linkedActivityId || '', p.createdAt, JSON.stringify(p.actions), p.status, p.trackingStatus];
}

function parseCorrectiveActionRow(row: any): CorrectiveAction {
  return {
    id: safeStr(row.id || row.ID) || `ca_${Math.random().toString(36).substring(7)}`,
    description: safeStr(row.description || row.descripcion),
    responsible: safeStr(row.responsible || row.responsable),
    deadline: safeStr(row.deadline || row.plazo),
    status: (row.status || row.estado || 'pending') as any,
    trackingStatus: (row.trackingStatus || row.estadoSeguimiento || 'pendiente') as TrackingStatus,
    evidenceFiles: safeParseJSON(row.evidenceFiles || row.evidencias, []),
  };
}

function parseCollaboratorRow(row: any): Collaborator {
  return {
    id: safeStr(row.id || row.ID) || `collab_${Math.random().toString(36).substring(7)}`,
    name: safeStr(row.name || row.nombre),
    department: safeStr(row.department || row.departamento),
    accesses: safeParseJSON(row.accesses || row.accesos, []),
    trackingStatus: (row.trackingStatus || row.estadoSeguimiento || 'pendiente') as TrackingStatus,
  };
}

function collaboratorToRow(c: Collaborator): any[] {
  return [c.id, c.name, c.department || '', JSON.stringify(c.accesses), c.trackingStatus];
}

function parseIaasSuspectRow(row: any): IaasSuspect {
  return {
    id: safeStr(row.id || row.ID) || `iaas_${Math.random().toString(36).substring(7)}`,
    patientName: safeStr(row.patientName || row.nombrePaciente),
    run: safeStr(row.run || row.RUN),
    service: safeStr(row.service || row.servicio),
    bed: safeStr(row.bed || row.cama),
    detectionDate: safeStr(row.detectionDate || row.fechaDeteccion) || new Date().toISOString(),
    infectionType: (row.infectionType || row.tipoInfeccion || 'itu') as IaasInfectionType,
    device: (row.device || row.dispositivo || 'ninguno') as IaasDevice,
    cultureTaken: row.cultureTaken === true || row.cultureTaken === 'true' || row.cultivoTomado === 'si' || row.cultivoTomado === true,
    notifyingProfessional: safeStr(row.notifyingProfessional || row.profesionalNotifica),
    status: (row.status || row.estado || 'pendiente') as IaasSuspectStatus,
    createdAt: safeStr(row.createdAt || row.fechaCreacion) || new Date().toISOString(),
  };
}

function iaasSuspectToRow(s: IaasSuspect): any[] {
  return [
    s.id, s.patientName, s.run, s.service, s.bed,
    s.detectionDate, s.infectionType, s.device,
    s.cultureTaken ? 'true' : 'false', s.notifyingProfessional,
    s.status, s.createdAt
  ];
}

const defaultFactorGroup: IaasFactorGroup = { checked: false, nota: '' };

function parseIaasInvestigationRow(row: any): IaasInvestigation {
  return {
    id: safeStr(row.id || row.ID) || `inv_${Math.random().toString(36).substring(7)}`,
    suspectId: safeStr(row.suspectId || row.sospechaId),
    patientName: safeStr(row.patientName || row.nombrePaciente),
    service: safeStr(row.service || row.servicio),
    detectionDate: safeStr(row.detectionDate || row.fechaDeteccion),
    infectionType: (row.infectionType || row.tipoInfeccion || 'itu') as IaasInfectionType,
    device: (row.device || row.dispositivo || 'ninguno') as IaasDevice,
    factorsPatient: safeParseJSON(row.factorsPatient || row.factoresPaciente, {
      comorbilidades: defaultFactorGroup, inmunosupresion: defaultFactorGroup, otros: defaultFactorGroup
    }),
    factorsProcedure: safeParseJSON(row.factorsProcedure || row.factoresProcedimiento, {
      cumplimientoProtocolo: defaultFactorGroup, tecnicaUtilizada: defaultFactorGroup, usoChecklists: defaultFactorGroup
    }),
    factorsTeam: safeParseJSON(row.factorsTeam || row.factoresEquipo, {
      adherenciaHigieneManos: defaultFactorGroup, usoEPP: defaultFactorGroup, capacitacion: defaultFactorGroup
    }),
    factorsEnvironment: safeParseJSON(row.factorsEnvironment || row.factoresEntorno, {
      limpieza: defaultFactorGroup, disponibilidadInsumos: defaultFactorGroup, cargaAsistencial: defaultFactorGroup
    }),
    causaProbable: safeStr(row.causaProbable),
    planAccionSugerido: safeStr(row.planAccionSugerido),
    status: (row.status || row.estado || 'abierta') as any,
    createdAt: safeStr(row.createdAt || row.fechaCreacion) || new Date().toISOString(),
  };
}

function iaasInvestigationToRow(inv: IaasInvestigation): any[] {
  return [
    inv.id, inv.suspectId, inv.patientName, inv.service, inv.detectionDate,
    inv.infectionType, inv.device,
    JSON.stringify(inv.factorsPatient), JSON.stringify(inv.factorsProcedure),
    JSON.stringify(inv.factorsTeam), JSON.stringify(inv.factorsEnvironment),
    inv.causaProbable, inv.planAccionSugerido, inv.status, inv.createdAt
  ];
}

function parseEventoAdversoRow(row: any): EventoAdverso {
  return {
    id: safeStr(row.id || row.ID) || `ea_${Math.random().toString(36).substring(7)}`,
    fecha: safeStr(row.fecha),
    servicio: safeStr(row.servicio || row.service),
    tipoEvento: (row.tipoEvento || row.tipo || 'otro') as EventoTipo,
    descripcion: safeStr(row.descripcion || row.description),
    clasificacion: (row.clasificacion || row.classification || 'incidente') as EventoClasificacion,
    gravedad: (row.gravedad || row.severity || 'sin_dano') as EventoGravedad,
    factoresContribuyentes: safeParseJSON(row.factoresContribuyentes || row.factors, []),
    estado: (row.estado || row.status || 'pendiente') as EventoEstado,
    linkedPlanId: safeStr(row.linkedPlanId || row.planVinculado) || undefined,
    createdAt: safeStr(row.createdAt || row.fechaCreacion) || new Date().toISOString(),
  };
}

function eventoAdversoToRow(e: EventoAdverso): any[] {
  return [
    e.id, e.fecha, e.servicio, e.tipoEvento, e.descripcion,
    e.clasificacion, e.gravedad, JSON.stringify(e.factoresContribuyentes),
    e.estado, e.linkedPlanId || '', e.createdAt
  ];
}

type ActivityContextType = {
  activities: Activity[];
  statuses: Status[];
  categories: Category[];
  caseTypes: CaseType[];
  settings: AppSettings;
  documents: Document[];
  periodicTasks: PeriodicTask[];
  indicators: QualityIndicator[];
  actionPlans: ActionPlan[];
  collaborators: Collaborator[];
  iaasSuspects: IaasSuspect[];
  iaasInvestigations: IaasInvestigation[];
  eventosAdversos: EventoAdverso[];
  isLoading: boolean;
  error: string | null;
  
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt' | 'sequentialId'>) => void;
  updateActivity: (id: string, activity: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  addActivityLog: (activityId: string, note: string) => void;
  
  addStatus: (status: Omit<Status, 'id'>) => void;
  updateStatus: (id: string, status: Partial<Status>) => void;
  
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  
  addCaseType: (caseType: Omit<CaseType, 'id'>) => void;
  updateCaseType: (id: string, caseType: Partial<CaseType>) => void;
  
  updateSettings: (settings: Partial<AppSettings>) => void;

  addDocument: (doc: Omit<Document, 'id'>) => void;
  updateDocument: (id: string, doc: Partial<Document>) => void;
  deleteDocument: (id: string) => void;

  addTask: (task: Omit<PeriodicTask, 'id'>) => void;
  updateTask: (id: string, task: Partial<PeriodicTask>) => void;
  deleteTask: (id: string) => void;

  addIndicator: (ind: Omit<QualityIndicator, 'id' | 'measurements'>) => void;
  updateIndicator: (id: string, ind: Partial<QualityIndicator>) => void;
  addMeasurement: (indicatorId: string, measurement: Omit<IndicatorMeasurement, 'id' | 'submittedAt'>) => void;
  
  addActionPlan: (plan: Omit<ActionPlan, 'id' | 'createdAt'>) => void;
  updateActionPlan: (id: string, plan: Partial<ActionPlan>) => void;
  deleteActionPlan: (id: string) => void;

  addCollaborator: (collaborator: Omit<Collaborator, 'id'>) => void;
  updateCollaborator: (id: string, collaborator: Partial<Collaborator>) => void;
  deleteCollaborator: (id: string) => void;

  addIaasSuspect: (suspect: Omit<IaasSuspect, 'id' | 'createdAt'>) => void;
  updateIaasSuspect: (id: string, suspect: Partial<IaasSuspect>) => void;
  deleteIaasSuspect: (id: string) => void;

  addIaasInvestigation: (inv: Omit<IaasInvestigation, 'id' | 'createdAt'>) => void;
  updateIaasInvestigation: (id: string, inv: Partial<IaasInvestigation>) => void;

  addEventoAdverso: (evento: Omit<EventoAdverso, 'id' | 'createdAt'>) => void;
  updateEventoAdverso: (id: string, evento: Partial<EventoAdverso>) => void;
  deleteEventoAdverso: (id: string) => void;

  exportDataToCSV: () => void;
  exportBackupJSON: () => void;
  refreshData: () => Promise<void>;
};

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [statuses, setStatuses] = useState<Status[]>(defaultStatuses);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [caseTypes, setCaseTypes] = useState<CaseType[]>(defaultCaseTypes);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const persisted = loadPersistedSettings();
    return { ...defaultSettings, ...persisted };
  });

  useEffect(() => {
    if (authUser) {
      const perms = ROLE_PERMISSIONS[authUser.role];
      const persisted = loadPersistedSettings();
      setSettings(prev => ({
        ...prev,
        ...persisted,
        userName: authUser.name,
        systemRole: perms.systemRole,
        userRole: authUser.role === 'administrador' ? 'Administrador' : authUser.role === 'iaas' ? 'IAAS' : authUser.role === 'calidad' ? 'Calidad' : 'Consulta',
        userInitials: authUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      }));
    }
  }, [authUser]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [periodicTasks, setPeriodicTasks] = useState<PeriodicTask[]>([]);
  const [indicators, setIndicators] = useState<QualityIndicator[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [iaasSuspects, setIaasSuspects] = useState<IaasSuspect[]>([]);
  const [iaasInvestigations, setIaasInvestigations] = useState<IaasInvestigation[]>([]);
  const [eventosAdversos, setEventosAdversos] = useState<EventoAdverso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        iaasRows, segRows, recRows,
        docRows, taskRows, indRows,
        planRows, caRows, collabRows, vigilanciaRows,
        investigacionRows, eventosRows
      ] = await Promise.all([
        fetchSheet("IAAS").catch(() => []),
        fetchSheet("SEGURIDAD_PACIENTE").catch(() => []),
        fetchSheet("RECLAMOS").catch(() => []),
        fetchSheet("DOCUMENTOS").catch(() => []),
        fetchSheet("TAREAS").catch(() => []),
        fetchSheet("MEDICIONES_INDICADORES").catch(() => []),
        fetchSheet("PLANES_CORRECCION").catch(() => []),
        fetchSheet("ACCIONES_CORRECTIVAS").catch(() => []),
        fetchSheet("COLABORADORES").catch(() => []),
        fetchSheet("VIGILANCIA_IAAS").catch(() => []),
        fetchSheet("INVESTIGACIONES_IAAS").catch(() => []),
        fetchSheet("EVENTOS_ADVERSOS").catch(() => []),
      ]);

      const allActivities: Activity[] = [
        ...iaasRows.map((r: any) => parseActivityRow(r, 'iaas')),
        ...segRows.map((r: any) => parseActivityRow(r, 'seguridad_paciente')),
        ...recRows.map((r: any) => parseActivityRow(r, 'reclamos')),
      ];
      setActivities(allActivities);
      setDocuments(docRows.map(parseDocumentRow));
      setPeriodicTasks(taskRows.map(parseTaskRow));
      setIndicators(indRows.map(parseIndicatorRow));

      const parsedPlans = planRows.map(parseActionPlanRow);
      if (caRows.length > 0 && parsedPlans.length > 0) {
        const correctiveActions = caRows.map(parseCorrectiveActionRow);
        const planWithNoActions = parsedPlans.filter(p => p.actions.length === 0);
        if (planWithNoActions.length > 0 && correctiveActions.length > 0) {
          planWithNoActions[0].actions = correctiveActions;
        }
      }
      setActionPlans(parsedPlans);
      setCollaborators(collabRows.map(parseCollaboratorRow));
      setIaasSuspects(vigilanciaRows.map(parseIaasSuspectRow));
      setIaasInvestigations(investigacionRows.map(parseIaasInvestigationRow));
      setEventosAdversos(eventosRows.map(parseEventoAdversoRow));
    } catch (err: any) {
      console.error('Error fetching data from Google Sheets:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refreshData = useCallback(async () => {
    await fetchAllData();
  }, [fetchAllData]);

  const generateAutoId = (prefix: string, existingIds: string[]) => {
    const year = new Date().getFullYear();
    const yearPrefix = `${prefix}-${year}-`;
    const existingNumbers = existingIds
      .filter(id => id && id.startsWith(yearPrefix))
      .map(id => {
        const num = parseInt(id.replace(yearPrefix, ''), 10);
        return isNaN(num) ? 0 : num;
      });
    const nextNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    return `${yearPrefix}${String(nextNum).padStart(3, '0')}`;
  };

  const getNextSequentialId = (area: WorkArea) => {
    const areaPrefixes: Record<WorkArea, string> = { calidad: 'CAL', seguridad_paciente: 'EA', iaas: 'IAAS', reclamos: 'REC', indicadores: 'IND' };
    const prefix = areaPrefixes[area] || 'GEN';
    const areaIds = activities.filter(a => a.area === area).map(a => a.sequentialId || a.id);
    return generateAutoId(prefix, areaIds);
  };

  const addActivity = (activityData: Omit<Activity, 'id' | 'createdAt' | 'sequentialId'>) => {
    const sequentialId = getNextSequentialId(activityData.area);
    const newActivity: Activity = { 
      ...activityData, 
      id: sequentialId, 
      sequentialId,
      createdAt: new Date().toISOString(),
      adminValidation: 'pending'
    };

    const sheetName = AREA_SHEET_MAP[activityData.area];

    if (newActivity.area === 'iaas' && newActivity.iaasClassification === 'confirmed') {
      const segSeqId = getNextSequentialId('seguridad_paciente');
      const linkedEvent: Activity = {
        id: segSeqId,
        sequentialId: segSeqId,
        title: `[IAAS Confirmada] ${newActivity.title}`,
        description: `Evento derivado de IAAS confirmada. Detalles: ${newActivity.description}`,
        date: newActivity.date,
        statusId: newActivity.statusId,
        categoryId: newActivity.categoryId,
        caseTypeId: newActivity.caseTypeId,
        area: 'seguridad_paciente',
        responsible: newActivity.responsible,
        notes: newActivity.notes,
        createdAt: new Date().toISOString(),
        eventClassification: 'adverse_event',
        severity: 'medium',
        adminValidation: 'pending'
      };
      newActivity.linkedAdverseEventId = linkedEvent.id;
      setActivities(prev => [newActivity, linkedEvent, ...prev]);

      if (sheetName) {
        postToSheet(sheetName, activityToRow(newActivity)).catch(console.error);
      }
      postToSheet("SEGURIDAD_PACIENTE", activityToRow(linkedEvent)).catch(console.error);
    } else {
      setActivities(prev => [newActivity, ...prev]);
      if (sheetName) {
        postToSheet(sheetName, activityToRow(newActivity)).catch(console.error);
      }
    }
  };

  const updateActivity = (id: string, updatedFields: Partial<Activity>) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updatedFields } : a));
  };

  const deleteActivity = (id: string) => {
    if (settings.systemRole === 'viewer') return;
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const addActivityLog = (activityId: string, note: string) => {
    setActivities(prev => prev.map(a => {
      if (a.id !== activityId) return a;
      const newLog: CaseLog = { id: `log_${Math.random().toString(36).substring(7)}`, date: new Date().toISOString(), user: settings.userName, note };
      return { ...a, logs: [...(a.logs || []), newLog] };
    }));
  };

  const addStatus = (status: Omit<Status, 'id'>) => setStatuses(prev => [...prev, { ...status, id: `status_${Math.random().toString(36).substring(7)}` }]);
  const updateStatus = (id: string, status: Partial<Status>) => setStatuses(prev => prev.map(s => s.id === id ? { ...s, ...status } : s));

  const addCategory = (category: Omit<Category, 'id'>) => setCategories(prev => [...prev, { ...category, id: `cat_${Math.random().toString(36).substring(7)}` }]);
  const updateCategory = (id: string, category: Partial<Category>) => setCategories(prev => prev.map(c => c.id === id ? { ...c, ...category } : c));

  const addCaseType = (caseType: Omit<CaseType, 'id'>) => setCaseTypes(prev => [...prev, { ...caseType, id: `type_${Math.random().toString(36).substring(7)}` }]);
  const updateCaseType = (id: string, caseType: Partial<CaseType>) => setCaseTypes(prev => prev.map(c => c.id === id ? { ...c, ...caseType } : c));
  
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      persistSettings(updated);
      return updated;
    });
  };

  const addDocument = (doc: Omit<Document, 'id'>) => {
    const docId = generateAutoId('DOC', documents.map(d => d.id));
    const newDoc: Document = { ...doc, id: docId } as Document;
    setDocuments(prev => [...prev, newDoc]);
    postToSheet("DOCUMENTOS", documentToRow(newDoc)).catch(console.error);
  };
  const updateDocument = (id: string, doc: Partial<Document>) => setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...doc } : d));
  const deleteDocument = (id: string) => setDocuments(prev => prev.filter(d => d.id !== id));

  const addTask = (task: Omit<PeriodicTask, 'id'>) => {
    const taskId = generateAutoId('TAR', periodicTasks.map(t => t.id));
    const newTask: PeriodicTask = { ...task, id: taskId } as PeriodicTask;
    setPeriodicTasks(prev => [...prev, newTask]);
    postToSheet("TAREAS", taskToRow(newTask)).catch(console.error);
  };
  const updateTask = (id: string, task: Partial<PeriodicTask>) => setPeriodicTasks(prev => prev.map(t => t.id === id ? { ...t, ...task } : t));
  const deleteTask = (id: string) => setPeriodicTasks(prev => prev.filter(t => t.id !== id));

  const addIndicator = (ind: Omit<QualityIndicator, 'id' | 'measurements'>) => {
    const newInd: QualityIndicator = { ...ind, id: `ind_${Math.random().toString(36).substring(7)}`, measurements: [] };
    setIndicators(prev => [...prev, newInd]);
    postToSheet("MEDICIONES_INDICADORES", indicatorToRow(newInd)).catch(console.error);
  };
  const updateIndicator = (id: string, ind: Partial<QualityIndicator>) => setIndicators(prev => prev.map(i => i.id === id ? { ...i, ...ind } : i));
  const addMeasurement = (indicatorId: string, measurement: Omit<IndicatorMeasurement, 'id' | 'submittedAt'>) => {
    setIndicators(prev => prev.map(i => {
      if (i.id !== indicatorId) return i;
      const newMeas: IndicatorMeasurement = { ...measurement, id: `meas_${Math.random().toString(36).substring(7)}`, submittedAt: new Date().toISOString() };
      const updated = { ...i, measurements: [...i.measurements, newMeas] };
      postToSheet("MEDICIONES_INDICADORES", indicatorToRow(updated)).catch(console.error);
      return updated;
    }));
  };

  const addActionPlan = (plan: Omit<ActionPlan, 'id' | 'createdAt'>) => {
    const planId = generateAutoId('PAC', actionPlans.map(p => p.id));
    const allExistingActionIds = actionPlans.flatMap(p => p.actions.map(a => a.id));
    const actionsWithIds = (plan.actions || []).map((action, idx) => {
      const acId = generateAutoId('AC', [...allExistingActionIds, ...Array(idx).fill('')]);
      const existingAcNumbers = [...allExistingActionIds]
        .filter(id => id && id.startsWith(`AC-${new Date().getFullYear()}-`))
        .map(id => parseInt(id.replace(`AC-${new Date().getFullYear()}-`, ''), 10))
        .filter(n => !isNaN(n));
      const nextAcNum = existingAcNumbers.length > 0 ? Math.max(...existingAcNumbers) + 1 + idx : 1 + idx;
      const finalAcId = `AC-${new Date().getFullYear()}-${String(nextAcNum).padStart(3, '0')}`;
      return { ...action, id: finalAcId };
    });
    const newPlan: ActionPlan = { ...plan, id: planId, actions: actionsWithIds, createdAt: new Date().toISOString() };
    setActionPlans(prev => [newPlan, ...prev]);
    postToSheet("PLANES_CORRECCION", actionPlanToRow(newPlan)).catch(console.error);
    if (newPlan.actions && newPlan.actions.length > 0) {
      newPlan.actions.forEach(action => {
        postToSheet("ACCIONES_CORRECTIVAS", [
          action.id, action.description, action.responsible,
          action.deadline, action.status, JSON.stringify(action.evidenceFiles || []),
          newPlan.id
        ]).catch(console.error);
      });
    }
  };
  const updateActionPlan = (id: string, plan: Partial<ActionPlan>) => setActionPlans(prev => prev.map(p => p.id === id ? { ...p, ...plan } : p));
  const deleteActionPlan = (id: string) => setActionPlans(prev => prev.filter(p => p.id !== id));

  const addCollaborator = (collaborator: Omit<Collaborator, 'id'>) => {
    const collabId = generateAutoId('COL', collaborators.map(c => c.id));
    const newCollab: Collaborator = { ...collaborator, id: collabId } as Collaborator;
    setCollaborators(prev => [...prev, newCollab]);
    postToSheet("COLABORADORES", collaboratorToRow(newCollab)).catch(console.error);
  };
  const updateCollaborator = (id: string, collaborator: Partial<Collaborator>) => setCollaborators(prev => prev.map(c => c.id === id ? { ...c, ...collaborator } : c));
  const deleteCollaborator = (id: string) => setCollaborators(prev => prev.filter(c => c.id !== id));

  const addIaasSuspect = (suspect: Omit<IaasSuspect, 'id' | 'createdAt'>) => {
    const suspectId = generateAutoId('VIG', iaasSuspects.map(s => s.id));
    const newSuspect: IaasSuspect = { ...suspect, id: suspectId, createdAt: new Date().toISOString() };
    setIaasSuspects(prev => [...prev, newSuspect]);
    postToSheet("VIGILANCIA_IAAS", iaasSuspectToRow(newSuspect)).catch(console.error);
  };
  const updateIaasSuspect = (id: string, suspect: Partial<IaasSuspect>) => setIaasSuspects(prev => prev.map(s => s.id === id ? { ...s, ...suspect } : s));
  const deleteIaasSuspect = (id: string) => setIaasSuspects(prev => prev.filter(s => s.id !== id));

  const addIaasInvestigation = (inv: Omit<IaasInvestigation, 'id' | 'createdAt'>) => {
    const invId = generateAutoId('INV', iaasInvestigations.map(i => i.id));
    const newInv: IaasInvestigation = { ...inv, id: invId, createdAt: new Date().toISOString() };
    setIaasInvestigations(prev => [newInv, ...prev]);
    postToSheet("INVESTIGACIONES_IAAS", iaasInvestigationToRow(newInv)).catch(console.error);
    return newInv;
  };
  const updateIaasInvestigation = (id: string, inv: Partial<IaasInvestigation>) => setIaasInvestigations(prev => prev.map(i => i.id === id ? { ...i, ...inv } : i));

  const addEventoAdverso = (evento: Omit<EventoAdverso, 'id' | 'createdAt'>) => {
    const eaId = generateAutoId('EA', eventosAdversos.map(e => e.id));
    const newEvento: EventoAdverso = { ...evento, id: eaId, createdAt: new Date().toISOString() };
    setEventosAdversos(prev => [newEvento, ...prev]);
    postToSheet("EVENTOS_ADVERSOS", eventoAdversoToRow(newEvento)).catch(console.error);
  };
  const updateEventoAdverso = (id: string, evento: Partial<EventoAdverso>) => setEventosAdversos(prev => prev.map(e => e.id === id ? { ...e, ...evento } : e));
  const deleteEventoAdverso = (id: string) => setEventosAdversos(prev => prev.filter(e => e.id !== id));

  const exportDataToCSV = () => {
    const headers = ['ID', 'Área', 'Título', 'Responsable', 'Fecha', 'Estado'];
    const rows = activities.map(a => [
      a.sequentialId || a.id, a.area, `"${a.title.replace(/"/g, '""')}"`, `"${a.responsible}"`, new Date(a.date).toLocaleDateString(), a.statusId
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `exportacion_registros_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportBackupJSON = () => {
    const backupData = { activities, statuses, categories, caseTypes, settings, documents, periodicTasks, indicators, actionPlans, collaborators };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `backup_sistema_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ActivityContext.Provider value={{ 
      activities, statuses, categories, caseTypes, settings, documents, periodicTasks, indicators, actionPlans, collaborators, iaasSuspects, iaasInvestigations, eventosAdversos,
      isLoading, error,
      addActivity, updateActivity, deleteActivity, addActivityLog,
      addStatus, updateStatus, addCategory, updateCategory, addCaseType, updateCaseType,
      updateSettings,
      addDocument, updateDocument, deleteDocument,
      addTask, updateTask, deleteTask,
      addIndicator, updateIndicator, addMeasurement,
      addActionPlan, updateActionPlan, deleteActionPlan,
      addCollaborator, updateCollaborator, deleteCollaborator,
      addIaasSuspect, updateIaasSuspect, deleteIaasSuspect,
      addIaasInvestigation, updateIaasInvestigation,
      addEventoAdverso, updateEventoAdverso, deleteEventoAdverso,
      exportDataToCSV, exportBackupJSON, refreshData
    }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivities = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) throw new Error('useActivities must be used within an ActivityProvider');
  return context;
};
