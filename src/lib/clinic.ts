export const TISSUE_SALTS = [
  { no: 1, name: "Calcarea Fluorica", abbr: "Calc. Fluor." },
  { no: 2, name: "Calcarea Phosphorica", abbr: "Calc. Phos." },
  { no: 3, name: "Calcarea Sulphurica", abbr: "Calc. Sulph." },
  { no: 4, name: "Ferrum Phosphoricum", abbr: "Ferr. Phos." },
  { no: 5, name: "Kali Muriaticum", abbr: "Kali Mur." },
  { no: 6, name: "Kali Phosphoricum", abbr: "Kali Phos." },
  { no: 7, name: "Kali Sulphuricum", abbr: "Kali Sulph." },
  { no: 8, name: "Magnesia Phosphorica", abbr: "Mag. Phos." },
  { no: 9, name: "Natrum Muriaticum", abbr: "Nat. Mur." },
  { no: 10, name: "Natrum Phosphoricum", abbr: "Nat. Phos." },
  { no: 11, name: "Natrum Sulphuricum", abbr: "Nat. Sulph." },
  { no: 12, name: "Silicea", abbr: "Silicea" },
] as const;

export const POTENCIES = ["3X", "6X", "12X", "30X", "200X"];
export const FREQUENCIES = ["Once daily", "Twice daily", "Thrice daily", "Four times daily", "Every 2 hours", "As needed (SOS)"];
export const TIMINGS = ["Before food", "After food", "Empty stomach", "At bedtime", "Dissolved in warm water"];

export const CHRONIC_DISEASES = [
  "Diabetes", "Hypertension", "Thyroid disorder", "Asthma", "Arthritis", "Heart disease",
  "Kidney disease", "Liver disease", "Migraine", "Epilepsy", "PCOD / PCOS", "Anaemia",
];
export const FAMILY_CONDITIONS = [
  "Diabetes", "Hypertension", "Heart disease", "Cancer", "Asthma", "Thyroid disorder", "Arthritis", "Mental health",
];

export const DISCLAIMER =
  "Biochemic tissue salts are recorded here as part of traditional practice. This record does not constitute an automated diagnosis or prescription. All selections are made by the treating practitioner. Patients should consult a qualified medical doctor for emergencies or serious conditions and should not discontinue prescribed conventional medication without advice.";

export type Symptom = { complaint: string; location: string; duration: string; severity: string; better: string; worse: string };
export const emptySymptom = (): Symptom => ({ complaint: "", location: "", duration: "", severity: "Moderate", better: "", worse: "" });

export type Examination = {
  vitals: { bp: string; pulse: string; temperature: string; spo2: string; resp: string };
  general: {
    appetite: string; thirst: string; sleep: string; bowel: string; urine: string; perspiration: string;
    thermal: string; tongue: string; skin: string; mental: string; cravings: string; menstrual: string;
  };
  allergies: string;
  medical_history: string;
  surgical_history: string;
  current_medications: string;
  chronic: string[];
  chronic_other: string;
  family: { condition: string; relation: string }[];
  family_notes: string;
  lifestyle: { diet: string; smoking: string; alcohol: string; exercise: string };
  notes: string;
};
export const emptyExam = (): Examination => ({
  vitals: { bp: "", pulse: "", temperature: "", spo2: "", resp: "" },
  general: { appetite: "", thirst: "", sleep: "", bowel: "", urine: "", perspiration: "", thermal: "", tongue: "", skin: "", mental: "", cravings: "", menstrual: "" },
  allergies: "", medical_history: "", surgical_history: "", current_medications: "",
  chronic: [], chronic_other: "", family: [], family_notes: "",
  lifestyle: { diet: "", smoking: "No", alcohol: "No", exercise: "" },
  notes: "",
});

export type RxItem = { salt: string; potency: string; dosage: string; frequency: string; timing: string; duration: string; instructions: string };
export const emptyRx = (salt = ""): RxItem => ({ salt, potency: "6X", dosage: "4 tablets", frequency: "Thrice daily", timing: "After food", duration: "15 days", instructions: "" });
export type Prescription = { items: RxItem[]; general: string; diet: string; follow_up: string };
export const emptyPrescription = (): Prescription => ({ items: [], general: "", diet: "", follow_up: "" });

export type Patient = {
  id: string; name: string; age: number | null; gender: string | null; height_cm: number | null; weight_kg: number | null;
  mobile: string | null; email: string | null; address: string | null; created_at: string;
};
export type Clinic = { full_name: string | null; clinic_name: string | null; phone: string | null; address: string | null; registration_no: string | null };

export function bmi(h?: number | null, w?: number | null) {
  if (!h || !w) return null;
  const m = h / 100;
  return (w / (m * m)).toFixed(1);
}
export function mergeExam(x: unknown): Examination {
  const e = emptyExam();
  const v = (x ?? {}) as Partial<Examination>;
  return { ...e, ...v, vitals: { ...e.vitals, ...v.vitals }, general: { ...e.general, ...v.general }, lifestyle: { ...e.lifestyle, ...v.lifestyle } };
}
export function mergeRx(x: unknown): Prescription {
  return { ...emptyPrescription(), ...((x ?? {}) as Partial<Prescription>) };
}
