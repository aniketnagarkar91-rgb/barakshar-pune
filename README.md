# Biochemic Harmony

Build a crisp, responsive Biochemic Medicine (Bakshar / 12 Tissue Salts) Patient Records System using React, TypeScript, and Supabase. Include patient registration (name, age, gender, height, weight, mobile, email, address), multiple symptoms, and medical examination forms matching the uploaded screenshots, including allergies, medical history, chronic diseases, and family health history.

Include all 12 tissue salts: Calcarea Fluorica, Calcarea Phosphorica, Calcarea Sulphurica, Ferrum Phosphoricum, Kali Muriaticum, Kali Phosphoricum, Kali Sulphuricum, Magnesia Phosphorica, Natrum Muriaticum, Natrum Phosphoricum, Natrum Sulphuricum, and Silicea.

Create a simple workflow: Patient Details → Medical Examination → Download Case Paper PDF → Dosage & Intake → Download Shareable Prescription PDF. Allow practitioners to record selected salts, strength, dosage, frequency, duration, and instructions.

Use Supabase authentication, database, secure storage, and Row Level Security (RLS) to save patient profiles, examination records, prescriptions, PDFs, and complete visit history. Provide a dashboard to search patients, view previous visits, create new case papers, and download old PDFs without overwriting records.

Use a clean blue-and-white medical UI, reusable forms, validation, save-draft functionality, mobile responsiveness, and clinic branding. Treat tissue-salt information as traditional practice, avoid automated diagnosis or prescribing, and include privacy protection and an appropriate medical disclaimer.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://barakshar-pune.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4e2a921c-7f37-489c-a235-ffc3a4c00b7a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
