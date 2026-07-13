# Municipal Database System: Executive Summary for Pilot Testing

## 1. Project Overview

The Municipal Database is a secure, web-based platform designed to centralize and visualize critical data across all our barangays. It provides a real-time overview of our municipality's demographics, economy, infrastructure, and governance.

The system is organized into five main departments:

1. Social Development
2. Economic Development
3. Infrastructure
4. Governance _(Strictly Confidential)_
5. Institutional GAD (Gender and Development)

## 2. Data Collected by Department

The system collects highly granular, sex-disaggregated data (broken down by Male and Female) across various sectors to ensure inclusive planning and monitoring. The current data points collected per barangay include:

### Demographics & Population

- **Population:** Total Population (Male/Female)
- **Households:** Household Heads (Male/Female)
- **Vulnerable Sectors:** Solo Parents, Persons with Disabilities (PWD), 4Ps Beneficiaries, and Senior Citizens (Male/Female)

### Social Development

- **Education:** Student Enrollment, School Drop-outs, and Out-of-School Youth (Male/Female)
- **Health:** Malnourished / Stunted Children (Male/Female)
- **General Health:** Teenage Pregnancy (Total) and Maternal Mortality (Total)

### Economic Development

- **Employment:** Employed vs. Unemployed citizens (Male/Female)
- **Livelihood:** Registered Farmers, Fisherfolks, Business Owners, and Ambulant Vendors (Male/Female)

### Infrastructure

- **Basic Needs:** Access to Safe Water and Sanitary Toilets in households (Male/Female headed)
- **Housing:** Informal Settler Families (Male/Female headed)

### Governance (Confidential)

- **Leadership:** Elected Officials and Appointed Heads (Male/Female)
- **Incidents:** Children in Conflict with the Law (CICL) and Sexual Assault Cases (Male/Female)
- **General Incidents:** Violence Against Women and Children (VAWC) Cases (Total)

### Institutional GAD

- **Budgeting:** Total LGU budget, GAD allocated amount, and GAD utilized amount
- **Training:** Number of GAD trainings and total participants trained

## 3. Who Can Access What? (Access Control)

To ensure data privacy and security, the system uses a strict role-based access system. Users can only see or change data they are authorized to access.

| User Role                | What They Can Do                                                                                                   | Which Departments They Access |
| :----------------------- | :----------------------------------------------------------------------------------------------------------------- | :---------------------------- |
| **System Administrator** | Full control. Can manage user accounts, oversee the entire system, and review all activity logs.                   | All Departments               |
| **Executive Viewer**     | Can view all data across the municipality, including confidential Governance records, but cannot make any changes. | All Departments               |
| **Department Head**      | Can view, add, and update records, but**only** for their specific assigned department.                             | Their Department Only         |
| **Department Staff**     | Can view records for their department, but cannot make any changes.                                                | Their Department Only         |
| **General Viewer**       | Can view general public data across the municipality, but cannot see any confidential Governance data.             | General Data Only             |

## 4. Data Security & Tracking

- **Strict Boundaries:** A Department Head for "Social Development" cannot see or change data in the "Infrastructure" section.
- **Confidentiality:** Governance data is strictly hidden from general staff and viewers.
- **Activity Tracking:** Every single time a user adds, edits, or deletes a record, the system automatically logs who did it, when they did it, and what was changed. This ensures complete accountability during the pilot test.

## 5. Dashboards and Visual Insights

The system automatically turns raw data into easy-to-read visual dashboards for quick decision-making.

All dashboards feature interactive filters, allowing you to instantly switch between viewing the entire municipality or zooming in on a single, specific barangay, as well as filtering by year.

- **Municipal Overviews:** At the top of every dashboard, large summary cards show total numbers (e.g., "Total Enrolled Students" or "Total Employed Citizens").
- **Barangay Comparisons:** Bar charts allow you to compare different barangays side-by-side (e.g., comparing the number of employed males vs. females across all barangays).
- **Demographic Breakdowns:** Circular charts show the specific breakdown of groups within a selected area.
