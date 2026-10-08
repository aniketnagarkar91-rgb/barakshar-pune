<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Data access uses the browser backend client with per-practitioner RLS (`practitioner_id = auth.uid()`); no server functions needed for CRUD.
- Visit symptoms/examination/prescription are stored as JSON columns on `visits`; shapes and defaults live in `src/lib/clinic.ts` (use `mergeExam`/`mergeRx` when reading).
- PDFs are rendered client-side from HTML blocks via html2canvas into jsPDF (`src/lib/pdf.ts`) so Marathi script shapes correctly, uploaded to the private `case-documents` bucket under `{userId}/{visitId}/`, and each upload gets a new `visit_documents` row — never overwrite.
- UI language (English/Marathi) lives in `src/lib/i18n.tsx`, keyed by the English text; stored values stay English and are translated only for display/PDF so data is language-neutral.
- Public educational sections have separate leaf routes and a shared EducationShell; their scoped semantic theme does not alter protected clinical screens.
- Educational copy and Marathi translations live in the browser-safe education module; external resources are clearly distinguished from clinic guides and treatment advice.
