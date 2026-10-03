import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DISCLAIMER, bmi, type Clinic, type Examination, type Patient, type Prescription, type Symptom } from "./clinic";

const BLUE: [number, number, number] = [31, 95, 191];
const DEEP: [number, number, number] = [24, 48, 96];
const GREY: [number, number, number] = [100, 110, 125];

function header(doc: jsPDF, clinic: Clinic, title: string, date: string) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, w, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(clinic.clinic_name || "Barakshar Clinic", 14, 11);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const sub = [clinic.full_name, clinic.registration_no ? `Reg. ${clinic.registration_no}` : null].filter(Boolean).join("  |  ");
  doc.text(sub || "Biochemic (12 Tissue Salts) Practice", 14, 17);
  doc.text([clinic.phone ? `Tel: ${clinic.phone}` : "", clinic.address || ""].filter(Boolean).join("  |  "), 14, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title.toUpperCase(), w - 14, 11, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Date: ${date}`, w - 14, 17, { align: "right" });
  doc.setTextColor(...DEEP);
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BLUE);
    doc.line(14, h - 24, w - 14, h - 24);
    doc.setFontSize(7);
    doc.setTextColor(...GREY);
    doc.text(doc.splitTextToSize(`Disclaimer: ${DISCLAIMER}`, w - 28), 14, h - 19);
    doc.text(`Confidential patient record  •  Page ${i} of ${pages}`, w - 14, h - 6, { align: "right" });
  }
}

function patientBlock(doc: jsPDF, p: Patient, y: number) {
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2, textColor: DEEP },
    headStyles: { fillColor: BLUE },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 28, fillColor: [238, 243, 252] }, 2: { fontStyle: "bold", cellWidth: 28, fillColor: [238, 243, 252] } },
    body: [
      ["Name", p.name, "Age / Gender", `${p.age ?? "-"} / ${p.gender ?? "-"}`],
      ["Mobile", p.mobile || "-", "Email", p.email || "-"],
      ["Height / Weight", `${p.height_cm ?? "-"} cm / ${p.weight_kg ?? "-"} kg`, "BMI", bmi(p.height_cm, p.weight_kg) ?? "-"],
      ["Address", { content: p.address || "-", colSpan: 3 }],
    ],
    margin: { left: 14, right: 14, bottom: 30 },
  });
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function section(doc: jsPDF, label: string, y: number) {
  if (y > doc.internal.pageSize.getHeight() - 50) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...BLUE);
  doc.text(label, 14, y + 8);
  doc.setTextColor(...DEEP);
  doc.setFont("helvetica", "normal");
  return y + 10;
}

function kv(doc: jsPDF, rows: [string, string][], y: number) {
  const body = rows.filter(([, v]) => v && v.trim()).map(([k, v]) => [k, v]);
  if (!body.length) body.push(["—", "Not recorded"]);
  autoTable(doc, {
    startY: y, theme: "striped", body,
    styles: { fontSize: 9, cellPadding: 1.8, textColor: DEEP },
    alternateRowStyles: { fillColor: [245, 248, 253] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
    margin: { left: 14, right: 14, bottom: 30 },
  });
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

export function buildCasePaper(clinic: Clinic, p: Patient, visitDate: string, symptoms: Symptom[], e: Examination) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, clinic, "Case Paper", visitDate);
  let y = patientBlock(doc, p, 32);

  y = section(doc, "Presenting Symptoms", y);
  autoTable(doc, {
    startY: y, theme: "grid",
    head: [["#", "Complaint", "Location", "Duration", "Severity", "Better by", "Worse by"]],
    body: symptoms.filter((s) => s.complaint).map((s, i) => [i + 1, s.complaint, s.location, s.duration, s.severity, s.better, s.worse]),
    styles: { fontSize: 8.5, cellPadding: 1.8, textColor: DEEP }, headStyles: { fillColor: BLUE },
    margin: { left: 14, right: 14, bottom: 30 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  y = section(doc, "Vitals", y);
  y = kv(doc, [["Blood pressure", e.vitals.bp], ["Pulse", e.vitals.pulse], ["Temperature", e.vitals.temperature], ["SpO2", e.vitals.spo2], ["Respiratory rate", e.vitals.resp]], y);
  y = section(doc, "General Examination", y);
  const g = e.general;
  y = kv(doc, [["Appetite", g.appetite], ["Thirst", g.thirst], ["Sleep", g.sleep], ["Bowel", g.bowel], ["Urine", g.urine], ["Perspiration", g.perspiration], ["Thermal reaction", g.thermal], ["Tongue", g.tongue], ["Skin", g.skin], ["Mental state", g.mental], ["Cravings / aversions", g.cravings], ["Menstrual history", g.menstrual]], y);
  y = section(doc, "History", y);
  y = kv(doc, [
    ["Allergies", e.allergies],
    ["Chronic diseases", [...e.chronic, e.chronic_other].filter(Boolean).join(", ")],
    ["Past medical history", e.medical_history],
    ["Surgical history", e.surgical_history],
    ["Current medications", e.current_medications],
    ["Family history", [...e.family.map((f) => `${f.condition}${f.relation ? ` (${f.relation})` : ""}`), e.family_notes].filter(Boolean).join("; ")],
    ["Lifestyle", [e.lifestyle.diet && `Diet: ${e.lifestyle.diet}`, `Smoking: ${e.lifestyle.smoking}`, `Alcohol: ${e.lifestyle.alcohol}`, e.lifestyle.exercise && `Exercise: ${e.lifestyle.exercise}`].filter(Boolean).join(", ")],
    ["Practitioner notes", e.notes],
  ], y);
  signature(doc, clinic, y);
  footer(doc);
  return doc;
}

function signature(doc: jsPDF, clinic: Clinic, y: number) {
  const w = doc.internal.pageSize.getWidth();
  if (y > doc.internal.pageSize.getHeight() - 55) { doc.addPage(); y = 20; }
  doc.setFontSize(9);
  doc.setDrawColor(...GREY);
  doc.line(w - 74, y + 22, w - 14, y + 22);
  doc.text(clinic.full_name || "Practitioner", w - 44, y + 27, { align: "center" });
  doc.setTextColor(...GREY);
  doc.text("Signature", w - 44, y + 31, { align: "center" });
  doc.setTextColor(...DEEP);
}

export function buildPrescription(clinic: Clinic, p: Patient, visitDate: string, symptoms: Symptom[], rx: Prescription) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, clinic, "Prescription", visitDate);
  let y = patientBlock(doc, p, 32);
  const complaints = symptoms.map((s) => s.complaint).filter(Boolean).join(", ");
  if (complaints) { y = section(doc, "Chief Complaints", y); doc.setFontSize(9); const t = doc.splitTextToSize(complaints, 180); doc.text(t, 14, y + 4); y += t.length * 4.5 + 2; }

  doc.setFont("times", "bold"); doc.setFontSize(22); doc.setTextColor(...BLUE);
  doc.text("Rx", 14, y + 12);
  doc.setTextColor(...DEEP);
  autoTable(doc, {
    startY: y + 16, theme: "grid",
    head: [["#", "Tissue salt", "Potency", "Dose", "Frequency", "Timing", "Duration", "Instructions"]],
    body: rx.items.map((r, i) => [i + 1, r.salt, r.potency, r.dosage, r.frequency, r.timing, r.duration, r.instructions]),
    styles: { fontSize: 8.5, cellPadding: 2, textColor: DEEP }, headStyles: { fillColor: BLUE },
    columnStyles: { 1: { fontStyle: "bold" } },
    margin: { left: 14, right: 14, bottom: 30 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  y = section(doc, "Advice", y);
  y = kv(doc, [["General instructions", rx.general], ["Diet & lifestyle", rx.diet], ["Follow-up", rx.follow_up]], y);
  signature(doc, clinic, y);
  footer(doc);
  return doc;
}
