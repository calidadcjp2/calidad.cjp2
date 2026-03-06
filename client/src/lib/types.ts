export type WorkArea = 'calidad' | 'seguridad_paciente' | 'iaas' | 'reclamos' | 'indicadores';

export type TrackingStatus = 'pendiente' | 'en_investigacion' | 'cerrado' | 'rechazado';

export const TRACKING_STATUS_OPTIONS: { value: TrackingStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_investigacion', label: 'En investigación' },
  { value: 'cerrado', label: 'Cerrado' },
  { value: 'rechazado', label: 'Rechazado' },
];

export const TRACKING_STATUS_STYLES: Record<TrackingStatus, { bg: string; text: string; border: string }> = {
  pendiente: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  en_investigacion: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  cerrado: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  rechazado: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
};

export interface Status {
  id: string;
  label: string;
  color: 'amber' | 'blue' | 'emerald' | 'slate' | 'red' | 'purple';
}

export interface Category {
  id: string;
  label: string;
}

export interface CaseType {
  id: string;
  label: string;
}

export interface CaseLog {
  id: string;
  date: string;
  user: string;
  note: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
}

export interface Activity {
  id: string;
  sequentialId?: string; // Correlativo anual (ej: 2024-001)
  title: string;
  description: string;
  date: string;
  statusId: string;
  categoryId: string;
  caseTypeId: string;
  area: WorkArea;
  responsible: string;
  notes: string;
  createdAt: string;
  
  logs?: CaseLog[];
  attachments?: Attachment[];
  
  // Campo privado de validación (sólo admin)
  adminValidation?: 'pending' | 'validated' | 'rejected';
  adminValidationNotes?: string;

  // Campos específicos de IAAS
  iaasClassification?: 'suspected' | 'confirmed' | 'discarded';
  cultureResults?: string;
  procedure?: string;
  service?: string;
  riskFactors?: string[];
  investigationStatus?: 'open' | 'in_progress' | 'closed';
  linkedAdverseEventId?: string; // Para vincular IAAS confirmada a evento adverso

  // Campos específicos de Seguridad del Paciente
  severity?: 'low' | 'medium' | 'high' | 'sentinel';
  eventClassification?: 'incident' | 'adverse_event' | 'sentinel'; // Restringido a 3 opciones
  followUpActions?: string;

  // Campos específicos de Reclamos
  deadline?: string;
  claimStatus?: 'received' | 'evaluating' | 'resolved' | 'appealed';
  resolution?: string;
  involvedCollaborators?: string[];
}

export type UserRole = 'admin' | 'contributor' | 'viewer';

export type AppRole = 'administrador' | 'iaas' | 'calidad' | 'consulta';

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  administrador: 'Administrador',
  iaas: 'IAAS',
  calidad: 'Calidad',
  consulta: 'Consulta',
};

export interface AppUser {
  username: string;
  name: string;
  role: AppRole;
  active: boolean;
}

export function convertLogoUrl(url: string): string {
  if (!url) return '';
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }
  const driveMatch2 = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (driveMatch2) {
    return `https://lh3.googleusercontent.com/d/${driveMatch2[1]}`;
  }
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
  if (ucMatch) {
    return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
  }
  return url;
}

export const ROLE_PERMISSIONS: Record<AppRole, {
  canEdit: boolean;
  allowedRoutes: string[];
  systemRole: UserRole;
}> = {
  administrador: {
    canEdit: true,
    allowedRoutes: ['*'],
    systemRole: 'admin',
  },
  iaas: {
    canEdit: true,
    allowedRoutes: ['/', '/dashboard', '/pendientes', '/iaas', '/indicadores', '/investigacion-iaas', '/indicadores-auto'],
    systemRole: 'contributor',
  },
  calidad: {
    canEdit: true,
    allowedRoutes: ['/', '/dashboard', '/pendientes', '/indicadores', '/seguridad_paciente', '/reclamos', '/documentos', '/tareas', '/planes-accion', '/colaboradores', '/calidad', '/eventos-adversos', '/indicadores-auto'],
    systemRole: 'contributor',
  },
  consulta: {
    canEdit: false,
    allowedRoutes: ['*'],
    systemRole: 'viewer',
  },
};

export interface AppSettings {
  appName: string;
  userName: string;
  userRole: string; // The descriptive text (e.g. "Dirección Médica")
  systemRole: UserRole; // The actual permission level
  userInitials: string;
  logoUrl?: string; // Logo institucional
}

export interface Document {
  id: string;
  name: string;
  code: string;
  version: string;
  responsibleArea: string;
  issueDate: string;
  expirationDate: string;
  status: 'active' | 'obsolete' | 'draft';
  trackingStatus: TrackingStatus;
}

export interface PeriodicTask {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'four_monthly' | 'semiannual' | 'yearly';
  nextDueDate: string;
  responsible: string;
  status: 'active' | 'paused';
  trackingStatus: TrackingStatus;
}

export interface IndicatorMeasurement {
  id: string;
  unit: string;
  numerator: number;
  denominator: number;
  period: string; // Ej: "2024-03" para marzo 2024
  submittedBy: string;
  submittedAt: string;
}

export interface QualityIndicator {
  id: string;
  name: string;
  code: string;
  description: string;
  goal: number; // Meta en porcentaje
  frequency: 'monthly' | 'quarterly' | 'yearly';
  responsibleUnits: string[]; // Unidades que deben reportar
  measurements: IndicatorMeasurement[];
  status: 'active' | 'inactive';
}

export interface ActionPlan {
  id: string;
  title: string;
  linkedActivityId?: string;
  createdAt: string;
  actions: CorrectiveAction[];
  status: 'active' | 'closed';
  trackingStatus: TrackingStatus;
}

export interface CorrectiveAction {
  id: string;
  description: string;
  responsible: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  trackingStatus: TrackingStatus;
  evidenceFiles?: string[];
}

export interface PlatformAccess {
  platformName: string;
  username: string;
}

export interface Collaborator {
  id: string;
  name: string;
  department?: string;
  accesses: PlatformAccess[];
  trackingStatus: TrackingStatus;
}

export type IaasInfectionType = 'itu' | 'neumonia_vm' | 'bacteriemia' | 'isq' | 'otra';
export type IaasDevice = 'cvc' | 'cup' | 'vm' | 'ninguno';
export type IaasSuspectStatus = 'pendiente' | 'en_investigacion' | 'confirmado' | 'descartado';

export const IAAS_INFECTION_LABELS: Record<IaasInfectionType, string> = {
  itu: 'ITU',
  neumonia_vm: 'Neumonía asociada a VM',
  bacteriemia: 'Bacteriemia',
  isq: 'Infección sitio quirúrgico',
  otra: 'Otra',
};

export const IAAS_DEVICE_LABELS: Record<IaasDevice, string> = {
  cvc: 'CVC',
  cup: 'CUP',
  vm: 'VM',
  ninguno: 'Ninguno',
};

export const IAAS_SUSPECT_STATUS_OPTIONS: { value: IaasSuspectStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_investigacion', label: 'En investigación' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'descartado', label: 'Descartado' },
];

export const IAAS_SUSPECT_STATUS_STYLES: Record<IaasSuspectStatus, { bg: string; text: string; border: string }> = {
  pendiente: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  en_investigacion: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  confirmado: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  descartado: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

export interface IaasSuspect {
  id: string;
  patientName: string;
  run: string;
  service: string;
  bed: string;
  detectionDate: string;
  infectionType: IaasInfectionType;
  device: IaasDevice;
  cultureTaken: boolean;
  notifyingProfessional: string;
  status: IaasSuspectStatus;
  createdAt: string;
}

export type EventoTipo = 'caida' | 'error_medicacion' | 'procedimiento' | 'diagnostico' | 'otro';
export type EventoClasificacion = 'adverso' | 'incidente' | 'cuasi';
export type EventoGravedad = 'sin_dano' | 'leve' | 'moderado' | 'grave' | 'muerte';
export type EventoEstado = 'pendiente' | 'en_analisis' | 'cerrado';
export type FactorContribuyente = 'humano' | 'sistema' | 'comunicacion' | 'equipamiento';

export const EVENTO_TIPO_LABELS: Record<EventoTipo, string> = {
  caida: 'Caída',
  error_medicacion: 'Error de medicación',
  procedimiento: 'Procedimiento',
  diagnostico: 'Diagnóstico',
  otro: 'Otro',
};

export const EVENTO_CLASIFICACION_LABELS: Record<EventoClasificacion, string> = {
  adverso: 'Evento adverso',
  incidente: 'Incidente',
  cuasi: 'Cuasi evento',
};

export const EVENTO_GRAVEDAD_LABELS: Record<EventoGravedad, string> = {
  sin_dano: 'Sin daño',
  leve: 'Leve',
  moderado: 'Moderado',
  grave: 'Grave',
  muerte: 'Muerte',
};

export const EVENTO_ESTADO_LABELS: Record<EventoEstado, string> = {
  pendiente: 'Pendiente',
  en_analisis: 'En análisis',
  cerrado: 'Cerrado',
};

export const EVENTO_ESTADO_STYLES: Record<EventoEstado, { bg: string; text: string; border: string }> = {
  pendiente: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  en_analisis: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  cerrado: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
};

export const EVENTO_GRAVEDAD_STYLES: Record<EventoGravedad, { bg: string; text: string; border: string }> = {
  sin_dano: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  leve: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  moderado: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  grave: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  muerte: { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-300' },
};

export const FACTOR_CONTRIBUYENTE_LABELS: Record<FactorContribuyente, string> = {
  humano: 'Humano',
  sistema: 'Sistema',
  comunicacion: 'Comunicación',
  equipamiento: 'Equipamiento',
};

export interface EventoAdverso {
  id: string;
  fecha: string;
  servicio: string;
  tipoEvento: EventoTipo;
  descripcion: string;
  clasificacion: EventoClasificacion;
  gravedad: EventoGravedad;
  factoresContribuyentes: FactorContribuyente[];
  estado: EventoEstado;
  linkedPlanId?: string;
  createdAt: string;
}

export interface IaasFactorGroup {
  checked: boolean;
  nota: string;
}

export interface IaasInvestigation {
  id: string;
  suspectId: string;
  patientName: string;
  service: string;
  detectionDate: string;
  infectionType: IaasInfectionType;
  device: IaasDevice;
  factorsPatient: {
    comorbilidades: IaasFactorGroup;
    inmunosupresion: IaasFactorGroup;
    otros: IaasFactorGroup;
  };
  factorsProcedure: {
    cumplimientoProtocolo: IaasFactorGroup;
    tecnicaUtilizada: IaasFactorGroup;
    usoChecklists: IaasFactorGroup;
  };
  factorsTeam: {
    adherenciaHigieneManos: IaasFactorGroup;
    usoEPP: IaasFactorGroup;
    capacitacion: IaasFactorGroup;
  };
  factorsEnvironment: {
    limpieza: IaasFactorGroup;
    disponibilidadInsumos: IaasFactorGroup;
    cargaAsistencial: IaasFactorGroup;
  };
  causaProbable: string;
  planAccionSugerido: string;
  status: 'abierta' | 'en_proceso' | 'cerrada';
  createdAt: string;
}

export const INVESTIGATION_STATUS_LABELS: Record<string, string> = {
  abierta: 'Abierta',
  en_proceso: 'En proceso',
  cerrada: 'Cerrada',
};

export const INVESTIGATION_STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  abierta: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  en_proceso: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  cerrada: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
};

export const AREA_LABELS: Record<WorkArea, string> = {
  calidad: 'Calidad',
  seguridad_paciente: 'Seguridad del Paciente',
  iaas: 'IAAS',
  reclamos: 'Gestión de Reclamos',
  indicadores: 'Indicadores'
};

export const generateSequentialId = (currentYear: number, count: number, areaPrefix: string) => {
  return `${areaPrefix}-${currentYear}-${String(count).padStart(3, '0')}`;
};
