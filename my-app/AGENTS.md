<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Problem
> **The World is becoming more Global**
> This means more travel between countries and increasing frequencies & ease. This also means that it is easier for diseases and outbreaks to spread. Though the viruses have gotten advanced with the ages, our methods of tracking & handling cases are still done on excel spreadsheets & I am to fix that. I'm building an Outbreak Management Software that aims to not only help Outbreak Case workers streamline their investigations but also innovate Outbreak Case Management as a whole :D. My long-term goal with this project is to expand it to other areas of disease & public health management such as site inspections.

*Deadline*: May 25th, 2026

---

# Tech Stack

**Frontend** — Next.js (App Router), React, Tailwind CSS, shadcn/ui  
**State** — `localStorage` (all outbreak data is stored client-side, keyed by outbreak ID)  
**Key libraries** — `xlsx` (line list parsing), `jszip` (ZIP export), `lucide-react` (icons)  
**Backend** — AWS (planned; not yet connected — all data is currently local)

---

# App Structure

```
app/(dashboard)/
  page.tsx                        — Home dashboard (stats + map view)
  layout.tsx                      — Dashboard shell with sidebar
  outbreaks/
    page.tsx                      — Outbreak list (active + unassigned cards)
    [id]/
      layout.tsx                  — Outbreak detail shell (sidebar + tabs + ZIP export)
      page.tsx                    — Overview tab
      epicurve/page.tsx           — Epi Curve tab
      linelist/page.tsx           — Line List tab
      notes/page.tsx              — Notes tab
      documentation/page.tsx      — Documentation tab
  resources/page.tsx              — PHO Investigation Tools directory
  cases/ ...                      — (hidden, not yet active)
  demi/ ...                       — (hidden, not yet active)

components/ui/
  dashboard-sidebar.tsx           — Left nav sidebar
  add-outbreak-sheet.tsx          — Slide-in form to add/edit an outbreak
  outbreak-card.tsx               — Card for assigned outbreaks
  unassigned-outbreak-card.tsx    — Card for facility-reported outbreaks
  linelist-upload.tsx             — Drag-and-drop file upload for line lists
  case-card.tsx                   — (unused/hidden)

lib/
  managed-outbreaks.ts            — Hook + CRUD for the outbreak list
  outbreak-context.tsx            — Context that provides the current outbreak record to sub-pages
  use-linelist.ts                 — Hook for reading/writing the uploaded line list
  use-outbreak-stats.ts           — Hook for the editable stats table (residents/staff counts)
  use-notes.ts                    — Hook for timestamped investigation notes
  use-documents.ts                — Hook for uploaded document attachments
  linelist-data.ts                — (utility)
  use-cases.ts                    — (unused/hidden)

public/
  example-linelist-confirmed-a.csv   — Test line list → triggers Confirmed A criterion
  example-linelist-confirmed-b.csv   — Test line list → triggers Confirmed B criterion
  example-linelist-suspect-a.csv     — Test line list → triggers Suspect A criterion
  example-linelist-suspect-b.csv     — Test line list → triggers Suspect B criterion
```

---

# localStorage Keys (per outbreak ID)

| Key | Content |
|-----|---------|
| `trace-managed-outbreaks` | Array of all `ManagedOutbreak` records |
| `trace-linelist-{id}` | `LinelistData` — columns + rows from uploaded spreadsheet |
| `trace-stats-{id}` | `OutbreakStats` — editable resident/staff stat table |
| `trace-notes-{id}` | Array of `OutbreakNote` — timestamped investigation notes |
| `trace-docs-{id}` | Array of `OutbreakDocument` — uploaded file attachments |

---

# Feature Inventory

## 1. Home Dashboard (`/`)
- Two tabs: **Stats View** (bar charts / summary cards) and **Map View**
- Filter sidebar: date range picker, status (Active / Inactive / All), outbreak setting, outbreak type, causative agent
- Data sourced from `public/outbreaks.csv` via `managed-outbreaks`

## 2. Outbreak List (`/outbreaks`)
- Shows two sections: active/assigned outbreaks and unassigned (facility-reported) outbreaks
- **Add Outbreak** sheet: creates a new `ManagedOutbreak` stored in `localStorage`
- Each card links to the outbreak detail page

## 3. Outbreak Detail (`/outbreaks/[id]`)

### Sidebar (always visible)
- Outbreak metadata: setting, type, causative agent
- Timeline: declared date, end date, agent identified date, status
- Location: address, affected floors
- Administrative: outbreak #, investigator, facility contact
- **Edit** button (opens `AddOutbreakSheet` in edit mode)
- **Export** button (downloads a ZIP — see below)

### Tab: Overview
- Editable stats table (inline inputs) for residents and staff:
  - Total population, population in outbreak area, flu vax rate, total # ill
  - CXR + pneumonia, hospitalizations, deaths
- **Respiratory Case Definition card** — auto-reads the uploaded line list and evaluates:
  - **Confirmed A**: ≥2 ARI cases within 48 h, common epi link, ≥1 lab-confirmed
  - **Confirmed B**: ≥3 ARI cases within 48 h, common epi link (no lab required)
  - **Suspect A**: ≥2 ARI cases within 48 h, common epi link
  - **Suspect B**: ≥1 lab-confirmed influenza case
  - Detects ARI symptom columns automatically (fever, cough, sore throat, runny nose, congestion, SOB, loss of taste/smell)
  - Detects onset date, lab confirmed, unit/floor, influenza columns via fuzzy regex matching
  - Shows which specific criterion was met with colour-coded highlighting (red = confirmed, amber = suspect)
  - Warns if no onset date column is present (48 h window unverifiable)

### Tab: Epi Curve
- Visualises case onset dates from the uploaded line list as a bar chart

### Tab: Line List
- Upload `.xlsx`, `.xls`, or `.csv` (parsed with `xlsx` library)
- Displays all columns; symptom columns (fever, cough, etc.) are collapsed into a single **Symptoms** column showing active symptoms as pills
- Filter bar auto-detects gender and role columns
- Inline row editing and add-row form

### Tab: Notes
- Timestamped investigation notes with contact date + time
- Inline create / edit / delete
- Sorted newest-first

### Tab: Documentation
- Upload file attachments (≤4 MB each) with interaction date, time, and type (Telephone / Written / In-Person)
- **Lab Result** checkbox — marks a document with a purple "Lab Result" badge
- Download or remove individual documents

### ZIP Export
Downloads `outbreak_<number>.zip` containing:
1. `outbreak-summary.txt` — all outbreak metadata fields
2. `outbreak-stats.csv` — the editable stats table
3. `notes.txt` — all investigation notes, formatted with contact date/time and body
4. `linelist.csv` — the uploaded line list rows
5. `documents/` folder — all attachments, filename-prefixed with date, time, interaction type, and `LAB_` if tagged as a lab result

## 4. Resources (`/resources`)
- Directory of all **47 Public Health Ontario Ontario Investigation Tools**
- Sourced from: https://www.publichealthontario.ca/en/Diseases-and-Conditions/Infectious-Diseases/CCM/OIT
- Live search/filter across all tool names
- Two sections: **Investigation Tools** (39 disease-specific tools) and **Additional Resources** (8 reference documents / iPHIS guides)
- Each row links directly to the PHO download (DOCX / PDF / XLSX) in a new tab
- Colour-coded file type badges: blue = DOCX/DOC, red = PDF, green = XLSX

---

# Feature List (Planned / In Progress)

1. **Outbreak Predictions**
   - Map view with calendar — view past outbreaks and predicted future ones
   - List view with calendar

2. **Outbreak Management** (partially built)
   - ✅ Input new outbreaks
   - ✅ Facility-reported (intake) outbreaks with unassigned workflow
   - ✅ Line list upload, epi curve, notes, documentation
   - ✅ Respiratory case definition assessment
   - ✅ ZIP export of all outbreak data
   - Contacts & cases linked to outbreaks
   - Assign contacts to case workers
   - Seamless communication between units and case workers
   - Training integration — AI-simulated calls, recording, grading
   - Manager vs. employee views

3. **Outbreak Statistics**
   - ✅ Dashboard with active/inactive counts, type breakdown, map
   - Manager view: cases per employee, performance notes
