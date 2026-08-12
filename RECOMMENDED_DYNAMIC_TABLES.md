# 📋 Recommended Municipal Dynamic Data Tables Guide

This document serves as an authoritative reference list of recommended custom dynamic data tables for the **Centralized Municipal Database System (Presentacion)**. All previously native tables from Economic Development, Infrastructure, Local Governance, Justice & Safety, and Health have been merged into this guide. Superadmins can use these short titles, table types, and indicator fields when building dynamic tables in the **Dynamic Tables Manager**.

---

## 1. 👥 Demographics

| Table Title | Category Type | Short Description | Key Indicators / Fields |
| :--- | :--- | :--- | :--- |
| **Age Distribution** | `Standard` | Track age bracket population breakdown and dependency ratios. | 0-11m, 1-4y, 5-17y, 18-59y, 60y+ (Male / Female) |
| **Civil Status** | `Standard` | Record civil status distribution across male and female residents. | Single, Married, Widowed, Separated (Male / Female) |
| **Indigenous Peoples** | `Standard` | Monitor Agta and IP community population and households. | IP Group Name, Households, Population (Male / Female) |
| **OFW Registry** | `Standard` | Track land-based/sea-based OFWs and remittance households. | Land-based, Sea-based, Remittance Households |

---

## 2. 🏥 Social Development

### A. Health & Nutrition *(Merged Native Health Table)*
| Table Title | Category Type | Short Description | Key Indicators / Fields |
| :--- | :--- | :--- | :--- |
| **Maternal & Adolescent Health** | `Standard` | Track teenage pregnancies and maternal mortality cases across barangays. | Teenage Pregnancies, Maternal Mortality Cases |
| **Health & Immunization** | `Standard` | Track infant immunization rates, TB patients, and chronic disease cases. | Fully Immunized Infants, TB Patients, Hypertension Cases |
| **Nutritional Status** | `Standard` | Monitor underweight, stunted, and severely wasted children. | Normal Weight, Underweight, Stunted Children (Male / Female) |
| **Monthly Outbreaks** | `Monthly Time-Series` | Monitor monthly disease cases to detect peak outbreak seasons. | Monthly Dengue Cases, Gastroenteritis Cases (Jan - Dec) |

### B. Education & Youth
| Table Title | Category Type | Short Description | Key Indicators / Fields |
| :--- | :--- | :--- | :--- |
| **ECCD & Daycare** | `Standard` | Monitor early childhood care centers and daycare enrollees. | Daycare Enrollees (M/F), Operating Daycare Centers |
| **Education Enrollment** | `Multi-Group Subtables` | Track student enrollment and dropouts across Elementary, High School, and College subtables. | Subtables: Elementary, High School, Tertiary / TVET |
| **Out-of-School Youth** | `Standard` | Record OSY population by age group for skills training. | OSY Ages 12-15, OSY Ages 16-24 (Male / Female) |

### C. Social Welfare & Vulnerable Sectors
| Table Title | Category Type | Short Description | Key Indicators / Fields |
| :--- | :--- | :--- | :--- |
| **Social Pensioners** | `Standard` | Record indigent senior pensioners and emergency AICS recipients. | Indigent Senior Pensioners, AICS Beneficiaries |
| **PWD & Solo Parents** | `Standard` | Track Persons with Disability (PWD) by disability type and solo parents. | Physical, Visual, Hearing PWDs, Solo Parents (M/F) |
| **4Ps Households** | `Standard` | Monitor Pantawid Pamilyang Pilipino Program active household beneficiaries. | Active 4Ps HHs, Graduated 4Ps HHs |

---

## 3. 🌾 Economic Development *(Merged Native Economic Tables)*

| Table Title | Category Type | Short Description | Key Indicators / Fields |
| :--- | :--- | :--- | :--- |
| **Labor Force & Employment** | `Standard` | Track employed, unemployed, and underemployed workforce by gender. *(Merged from native Labor tab)* | Employed (M/F), Unemployed (M/F), Total Labor Force |
| **Agriculture & Livestock** | `Standard` | Record registered crop farmers, livestock raisers, and RSBSA listings. *(Merged from native Agriculture tab)* | Rice Farmers, Corn/Coconut Farmers, RSBSA Registered, Livestock Raisers |
| **Fisheries & Coastal** | `Standard` | Track motorized/non-motorized boat owners and fishpond operators. | Motorized Boats, Non-Motorized Boats, Fishponds, Coastal Beneficiaries |
| **Commerce & MSME Shops** | `Standard` | Register micro-enterprises, commercial shops, sari-sari stores, and vendors. *(Merged from native Commerce tab)* | Registered MSMEs, Sari-sari Stores, Commercial Shops, Ambulant Vendors |
| **Quarterly Crop Yields** | `Monthly Time-Series` | Monitor quarterly agricultural crop yields in metric tons. | Palay (Rice) Yield, Corn Yield (Metric Tons) |

---

## 4. ⚡ Infrastructure & Utilities *(Merged Native Infrastructure Tables)*

| Table Title | Category Type | Short Description | Key Indicators / Fields |
| :--- | :--- | :--- | :--- |
| **Basic Utilities & Housing** | `Percentage` | Percentage monitoring of sanitary toilets, insanitary toilets, and safety managed sanitation. *(Merged from native Utilities tab)* | Sanitary Toilets (%), Insanitary Toilets (%), Safety Managed Sanitation (%), Potable Water Access |
| **Roads & Transport** | `Standard` | Track paved barangay roads, unpaved roads, bridges, and transport access. | Paved Roads (km), Unpaved Roads (km), Bridges |
| **Power & Electrification** | `Standard` | Monitor household power grid connectivity, solar systems, and unelectrified households. | Grid Electrified HHs, Solar HHs, Unelectrified HHs |
| **Evacuation Centers & Assets** | `Geo Registry` | Record evacuation center GPS coordinates, refuge capacity, and water points. | Refuge Gym, Water Points (GPS Lat/Lng, Capacity) |
| **Infra Capital Projects** | `Project Tracker` | Track barangay capital projects, budgets, milestone dates, and progress status. | Road Paving, Health Center Repairs (Budget/Status/Dates) |

---

## 5. 🏛️ Local Governance *(Merged Native Governance Tables)*

| Table Title | Category Type | Short Description | Key Indicators / Fields |
| :--- | :--- | :--- | :--- |
| **Leadership & BDC Council** | `Standard` | Track elective barangay officials, SK officials, BDC members, and CSO reps. *(Merged from native Leadership tab)* | Barangay Officials (M/F), SK Officials (M/F), BDC Active Members, CSO Reps |
| **LGU Staffing & Personnel** | `Standard` | Monitor LGU permanent employees, Job Order (JO), and Contract of Service (COS) staff. | Permanent Employees, Job Order (JO) Staff, COS Personnel (M/F) |
| **SGLGB Compliance & Audits** | `Standard` | Evaluate barangay governance compliance, audit scores, and financial transparency. | SGLGB Area Scores, Financial Disclosure Postings, Audit Pass/Fail |

---

## 6. ⚖️ Justice & Safety *(Merged Native Justice Tables)*

| Table Title | Category Type | Short Description | Key Indicators / Fields |
| :--- | :--- | :--- | :--- |
| **Lupon Dispute Settlement** | `Standard` | Record barangay disputes filed, settled amicably, and court referrals. *(Merged from native Peace tab)* | Disputes Filed, Settled Amicably, Court Certificates Issued |
| **Protection Orders & VAWC** | `Standard` | Track Barangay Protection Orders (BPO), TPOs served, and VAWC assistance. | BPOs Issued, TPO Assistance, VAWC Desk Cases |
| **BDRRMC First Responders** | `Standard` | Monitor trained BDRRMC disaster responders, tanod security force, and volunteers. | BDRRMC Responders, Barangay Tanod Force, Fire Volunteers |

---

## 7. 🌸 Institutional GAD

| Table Title | Category Type | Short Description | Key Indicators / Fields |
| :--- | :--- | :--- | :--- |
| **GAD Budget Allocation** | `Budget` | Track 5% mandatory GAD budget allocation and project expenses. | Allocated Mandatory GAD Budget, Actual Expenses |
| **GAD Facilities & Training** | `Standard` | Monitor lactation stations, PWD restrooms, and GST training graduates. | Lactation Stations, Gender Restrooms, GST Graduates |

---
*Created for the Presentacion Centralized Municipal Database System.*
