/**
 * ECCD & DAYCARE CENTERS DIRECTORY
 * =====================================================================
 * Masterlist of Child Development Centers (CDCs) & Daycare Centers in Presentacion.
 * 
 * To add more centers in the future, simply append a new object to INITIAL_DAYCARE_CENTERS below:
 * { id: "dc-name", name: "Center Name", barangay: "Barangay Name", worker: "Worker Name" }
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

export const INITIAL_DAYCARE_CENTERS: DaycareCenter[] = [
  { id: "dc-greenfield", name: "Greenfield child Development Center", barangay: "Ayugao", worker: "Amy O. Flor" },
  { id: "dc-lovely-kids", name: "Lovely Kids Development Center", barangay: "Baliguian", worker: "Marissa R. Mendez" },
  { id: "dc-hope", name: "Hope Child Development Center", barangay: "Bagong Sirang", worker: "Via Jane B. Alfon" },
  { id: "dc-sweet-main", name: "Sweet Child Development Center (Main)", barangay: "Bantugan", worker: "Cristal Gasga" },
  { id: "dc-sweet-annex", name: "Sweet Child Development Center (Annex)", barangay: "Bantugan", worker: "Amelyn A. Gasga" },
  { id: "dc-dynamic-main", name: "Dynamic Child Development Center", barangay: "Bicalen", worker: "Claricel B. Pana" },
  { id: "dc-dynamic-annex", name: "Dynamic Child Development Center (Annex)", barangay: "Bicalen", worker: "Marvina D. Nacis" },
  { id: "dc-pretty-kids", name: "Pretty Kids Child Development Center", barangay: "Bulalacao", worker: "Jessa B. Corpuz" },
  { id: "dc-starchild", name: "Starchild Development Center", barangay: "Lagha", worker: "Nelia B. Balcueva" },
  { id: "dc-jolly", name: "Jolly Child Development Center", barangay: "Lidong", worker: "Marife A. Lagatic" },
  { id: "dc-faith", name: "Faith Child Development Center", barangay: "Maangas", worker: "Dina O. Dela Cruz" },
  { id: "dc-saint-mary", name: "Saint Mary Day Care Center", barangay: "Sta. Maria", worker: "April Joy B. Corre" },
  { id: "dc-happy-child", name: "Happy Child Development Center", barangay: "Sta. Maria", worker: "Joy B. Calvario" }
];
