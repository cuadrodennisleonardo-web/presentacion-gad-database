/**
 * ECCD & DAYCARE CENTERS DIRECTORY
 * =====================================================================
 * Masterlist of Child Development Centers (CDCs) & Daycare Centers in Presentacion.
 * 
 * NOTE: Every center requires a valid 36-character UUID for Supabase compatibility.
 * You can append new centers below using any ID format, as `toValidUuid` will 
 * automatically format it as a valid UUID if needed.
 * =====================================================================
 */

export interface DaycareCenter {
  id: string;
  name: string;
  barangay?: string;
  worker?: string;
  district?: string;
  isPrivate?: boolean;
}

export function toValidUuid(id: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, '0');
  return `9b1deb4d-3b7d-4bad-9bdd-${hex.slice(-12)}`;
}

export const INITIAL_DAYCARE_CENTERS: DaycareCenter[] = [
  { id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0001", name: "Greenfield child Development Center", barangay: "Ayugao", worker: "Amy O. Flor" },
  { id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0002", name: "Lovely Kids Development Center", barangay: "Baliguian", worker: "Marissa R. Mendez" },
  { id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0003", name: "Hope Child Development Center", barangay: "Bagong Sirang", worker: "Via Jane B. Alfon" },
  { id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0004", name: "Sweet Child Development Center (Main)", barangay: "Bantugan", worker: "Cristal Gasga" },
  { id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0005", name: "Sweet Child Development Center (Annex)", barangay: "Bantugan", worker: "Amelyn A. Gasga" },
  { id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0006", name: "Dynamic Child Development Center", barangay: "Bicalen", worker: "Claricel B. Pana" },
  { id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0007", name: "Dynamic Child Development Center (Annex)", barangay: "Bicalen", worker: "Marvina D. Nacis" },
  { id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0008", name: "Pretty Kids Child Development Center", barangay: "Bulalacao", worker: "Jessa B. Corpuz" },
  { id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0009", name: "Starchild Development Center", barangay: "Lagha", worker: "Nelia B. Balcueva" },
  { id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0010", name: "Jolly Child Development Center", barangay: "Lidong", worker: "Marife A. Lagatic" },
  { id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0011", name: "Faith Child Development Center", barangay: "Maangas", worker: "Dina O. Dela Cruz" },
  { id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0012", name: "Saint Mary Day Care Center", barangay: "Sta. Maria", worker: "April Joy B. Corre" },
  { id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d0013", name: "Happy Child Development Center", barangay: "Sta. Maria", worker: "Joy B. Calvario" }
].map(c => ({ ...c, id: toValidUuid(c.id) }));
