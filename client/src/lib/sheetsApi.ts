const SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbyYJ4r6lBjQy5-q4daHYn-hQQ3e3oE-8HSqTCx_36WX459nixh_JGoVeacEEF4I1apqIQ/exec";

export type SheetName =
  | "IAAS"
  | "SEGURIDAD_PACIENTE"
  | "RECLAMOS"
  | "MEDICIONES_INDICADORES"
  | "DOCUMENTOS"
  | "TAREAS"
  | "PLANES_CORRECCION"
  | "ACCIONES_CORRECTIVAS"
  | "COLABORADORES"
  | "VIGILANCIA_IAAS"
  | "USUARIOS"
  | "INVESTIGACIONES_IAAS"
  | "EVENTOS_ADVERSOS";

export async function fetchSheet(sheet: SheetName): Promise<any[]> {
  const url = `${SHEETS_API_URL}?sheet=${encodeURIComponent(sheet)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { redirect: "follow", signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${sheet}: ${res.statusText}`);
    }
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.rows)) return data.rows;
    if (data && data.values && Array.isArray(data.values)) return data.values;
    return [];
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error(`Timeout al cargar ${sheet}`);
    }
    throw err;
  }
}

export async function postToSheet(sheet: SheetName, row: any[]): Promise<any> {
  const res = await fetch(SHEETS_API_URL, {
    method: "POST",
    body: JSON.stringify({ sheet, row }),
    redirect: "follow",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to post to ${sheet}: ${text}`);
  }
  return res.json().catch(() => ({ success: true }));
}

export const AREA_SHEET_MAP: Record<string, SheetName> = {
  iaas: "IAAS",
  seguridad_paciente: "SEGURIDAD_PACIENTE",
  reclamos: "RECLAMOS",
};
