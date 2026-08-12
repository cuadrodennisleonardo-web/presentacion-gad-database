# 📋 Recommended Municipal Dynamic Data Tables Guide

This document serves as an authoritative reference list of recommended custom dynamic data tables for the **Centralized Municipal Database System (Presentacion)**. Superadmins can use these short titles, table types, and indicator fields when building dynamic tables in the **Dynamic Tables Manager**.

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

### A. Health & Nutrition
| Table Title | Category Type | Short Description | Key Indicators / Fields |
| :--- | :--- | :--- | :--- |
| **Health & Nutrition Overview** | `Standard` | Monitor teenage pregnancies, maternal mortality, malnourished/stunted children, and chronic disease cases. | Teenage Pregnancies, Maternal Mortality, Malnourished/Stunted Children (M/F), Hypertension & TB |
| **Health & Immunization** | `Standard` | Track infant immunization rates and registered health cases. | Fully Immunized Infants, TB Patients, Hypertension Cases |
| **Nutritional Status** | `Standard` | Monitor underweight, stunted, and severely wasted children. | Normal Weight, Underweight, Stunted Children (M/F) |
| **Monthly Outbreaks** | `Monthly Time-Series` | Monitor monthly disease cases to detect peak outbreak seasons. | Monthly Dengue & Gastroenteritis Cases (Jan - Dec) |

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

## 3. 🌾 Economic Development

| Table Title | Category Type | Short Description | Key Indicators / Fields |
| :--- | :--- | :--- | :--- |
| **Crop Production** | `Standard` | Record registered crop farmers and RSBSA agricultural listings. | Rice Farmers, Corn/Coconut Farmers, RSBSA Registered |
| **Fisheries & Boats** | `Standard` | Track motorized/non-motorized boat owners and fishpond operators. | Motorized Boats, Non-Motorized Boats, Fishponds |
| **Quarterly Harvests** | `Monthly Time-Series` | Monitor quarterly agricultural crop yields in metric tons. | Palay (Rice) Yield, Corn Yield (Metric Tons) |
| **MSME Businesses** | `Standard` | Register micro-enterprises and women-owned business shops. | Micro-Enterprises, Women-Owned MSMEs, Sari-sari Stores |

---

## 4. ⚡ Infrastructure & Utilities

| Table Title | Category Type | Short Description | Key Indicators / Fields |
| :--- | :--- | :--- | :--- |
| **Infra Projects** | `Project Tracker` | Track barangay capital projects, budgets, and progress status. | Road Paving, Health Center Repairs (Budget/Status/Dates) |
| **Evacuation Centers** | `Geo Registry` | Record evacuation center GPS coordinates, capacity, and status. | Refuge Gym, Water Points (GPS Lat/Lng, Capacity) |
| **Power Access** | `Standard` | Monitor household power grid connectivity and solar systems. | Grid Electrified HHs, Solar HHs, Unelectrified HHs |
| **Waste Sanitation** | `Percentage` | Percentage monitoring of waste segregation and sanitary toilets. | Segregating HHs, Sanitary Toilets vs Total HHs |

---

## 5. 🏛️ Local Governance

| Table Title | Category Type | Short Description | Key Indicators / Fields |
| :--- | :--- | :--- | :--- |
| **BDC & Youth (SK)** | `Standard` | Track active Barangay Development Council and SK officials. | BDC Active Members, SK Officials (M/F), CSO Reps |
| **LGU Plantilla** | `Standard` | Monitor LGU permanent and Job Order / Contract of Service staff. | Permanent Employees, Contract of Service Staff (M/F) |
| **SGLGB Compliance** | `Standard` | Evaluate barangay governance compliance and audit scores. | Governance Area Scores, Pass/Fail Audit Criteria |

---

## 6. ⚖️ Justice & Safety

| Table Title | Category Type | Short Description | Key Indicators / Fields |
| :--- | :--- | :--- | :--- |
| **Lupon Disputes** | `Standard` | Record barangay disputes filed, settled, and court referrals. | Disputes Filed, Settled Amicably, Court Certificates |
| **Protection Orders** | `Standard` | Track Barangay Protection Orders (BPO) and TPOs served. | BPO Issued, Temporary Protection Orders (TPO) |
| **First Responders** | `Standard` | Monitor trained BDRRMC disaster responders and tanods. | BDRRMC Responders, Barangay Tanod Force |

---

## 7. 🌸 Institutional GAD

| Table Title | Category Type | Short Description | Key Indicators / Fields |
| :--- | :--- | :--- | :--- |
| **GAD Budget** | `Budget` | Track 5% mandatory GAD budget allocation and project expenses. | Allocated Mandatory GAD Budget, Actual Expenses |
| **GAD Facilities** | `Standard` | Monitor lactation stations, PWD restrooms, and GST graduates. | Lactation Stations, Gender Restrooms, GST Graduates |

---
*Created for the Presentacion Centralized Municipal Database System.*
