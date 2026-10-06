import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { DISCLAIMER, bmi, type Clinic, type Examination, type Patient, type Prescription, type Symptom } from "./clinic";
import { translate, type Lang } from "./i18n";

// PDFs are rendered from HTML blocks via the browser so Devanagari (Marathi) text shapes correctly.
const BLUE = "#1f5fbf";
const DEEP = "#183060";
const PAGE_W = 210, PAGE_H = 297, MARGIN = 12, FOOTER_H = 26;
const PX_W = 760;

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const dash = (s: unknown) => (s === null || s === undefined || s === "" ? "-" : esc(s));

type T = (s: string) => string;
const FONT = `'IBM Plex Sans','Noto Sans Devanagari','Mukta',system-ui,sans-serif`;

function headerHtml(t: T, clinic: Clinic, title: string, date: string) {
  const sub = [clinic.full_name, clinic.registration_no ? `${t("Reg.")} ${clinic.registration_no}` : null].filter(Boolean).join("  |  ");
  const contact = [clinic.phone ? `${t("Tel")}: ${clinic.phone}` : "", clinic.address || ""].filter(Boolean).join("  |  ");
  return `<div style="background:${BLUE};color:#fff;padding:16px 20px;border-radius:6px;display:flex;justify-content:space-between;gap:16px">
    <div><div style="font-size:22px;font-weight:700">${esc(clinic.clinic_name || "Barakshar Clinic")}</div>
    <div style="font-size:12px;margin-top:4px">${esc(sub || t("Biochemic (12 Tissue Salts) Practice"))}</div>
    <div style="font-size:12px;margin-top:2px">${esc(contact)}</div></div>
    <div style="text-align:right"><div style="font-size:16px;font-weight:700;letter-spacing:1px">${esc(title.toUpperCase())}</div>
    <div style="font-size:12px;margin-top:4px">${esc(t("Date"))}: ${esc(date)}</div></div></div>`;
}

const cell = "border:1px solid #c9d6ec;padding:6px 8px;vertical-align:top";
function patientHtml(t: T, p: Patient) {
  const k = (s: string) => `<td style="${cell};background:#eef3fc;font-weight:600;width:20%">${esc(t(s))}</td>`;
  const v = (s: string) => `<td style="${cell}">${s}</td>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:13px">
    <tr>${k("Name")}${v(esc(p.name))}${k("Age / Gender")}${v(`${dash(p.age)} / ${p.gender ? esc(t(p.gender)) : "-"}`)}</tr>
    <tr>${k("Mobile")}${v(dash(p.mobile))}${k("Email")}${v(dash(p.email))}</tr>
    <tr>${k("Height / Weight")}${v(`${dash(p.height_cm)} cm / ${dash(p.weight_kg)} kg`)}${k("BMI")}${v(dash(bmi(p.height_cm, p.weight_kg)))}</tr>
    <tr>${k("Address")}<td colspan="3" style="${cell}">${dash(p.address)}</td></tr></table>`;
}

const sectionTitle = (s: string) => `<div style="color:${BLUE};font-weight:700;font-size:15px;margin:4px 0 6px">${esc(s)}</div>`;

function kvHtml(t: T, title: string, rows: [string, string][]) {
  const body = rows.filter(([, v]) => v && v.trim());
  const trs = body.length
    ? body.map(([k, v], i) => `<tr style="background:${i % 2 ? "#fff" : "#f5f8fd"}"><td style="padding:5px 8px;font-weight:600;width:32%">${esc(t(k))}</td><td style="padding:5px 8px;white-space:pre-wrap">${esc(v)}</td></tr>`).join("")
    : `<tr><td style="padding:5px 8px;color:#667">${esc(t("Not recorded"))}</td></tr>`;
  return `${sectionTitle(t(title))}<table style="width:100%;border-collapse:collapse;font-size:13px">${trs}</table>`;
}

function gridHtml(head: string[], rows: string[][]) {
  return `<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr>${head.map((h) => `<th style="${cell};background:${BLUE};color:#fff;text-align:left">${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td style="${cell}">${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function signatureHtml(t: T, clinic: Clinic) {
  return `<div style="display:flex;justify-content:flex-end;padding-top:40px"><div style="width:220px;text-align:center;font-size:13px">
    <div style="border-top:1px solid #667;padding-top:4px">${esc(clinic.full_name || t("Practitioner"))}</div>
    <div style="color:#667;font-size:12px">${esc(t("Signature"))}</div></div></div>`;
}

function footerHtml(t: T) {
  return `<div style="border-top:1px solid ${BLUE};padding-top:6px;font-size:10px;color:#646e7d;line-height:1.45">
    <b>${esc(t("Disclaimer"))}:</b> ${esc(t(DISCLAIMER))}<div style="text-align:right;margin-top:3px">${esc(t("Confidential patient record"))}</div></div>`;
}

async function snap(host: HTMLElement, html: string) {
  const el = document.createElement("div");
  el.style.cssText = `width:${PX_W}px;padding:4px 0;background:#fff;color:${DEEP};font-family:${FONT}`;
  el.innerHTML = html;
  host.appendChild(el);
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", logging: false });
  host.removeChild(el);
  return { data: canvas.toDataURL("image/jpeg", 0.92), h: (canvas.height / canvas.width) * (PAGE_W - MARGIN * 2) };
}

async function compose(blocks: string[], footer: string) {
  await document.fonts?.ready;
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0";
  document.body.appendChild(host);
  try {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const w = PAGE_W - MARGIN * 2;
    const limit = PAGE_H - FOOTER_H;
    let y = MARGIN;
    for (const b of blocks) {
      const img = await snap(host, b);
      if (y + img.h > limit && y > MARGIN) { doc.addPage(); y = MARGIN; }
      doc.addImage(img.data, "JPEG", MARGIN, y, w, img.h);
      y += img.h + 2;
    }
    const f = await snap(host, footer);
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.addImage(f.data, "JPEG", MARGIN, PAGE_H - FOOTER_H + 2, w, f.h);
      doc.setFontSize(8); doc.setTextColor(100, 110, 125);
      doc.text(`${i} / ${n}`, PAGE_W / 2, PAGE_H - 4, { align: "center" });
    }
    return doc;
  } finally {
    document.body.removeChild(host);
  }
}

export async function buildCasePaper(lang: Lang, clinic: Clinic, p: Patient, visitDate: string, symptoms: Symptom[], e: Examination) {
  const t: T = (s) => translate(lang, s);
  const g = e.general;
  const yn = (s: string) => t(s);
  const blocks = [
    headerHtml(t, clinic, t("Case paper"), visitDate),
    patientHtml(t, p),
    sectionTitle(t("Presenting Symptoms")) + gridHtml(
      ["#", t("Complaint"), t("Location"), t("Duration"), t("Severity"), t("Better by"), t("Worse by")],
      symptoms.filter((s) => s.complaint).map((s, i) => [String(i + 1), s.complaint, s.location, s.duration, t(s.severity), s.better, s.worse]),
    ),
    kvHtml(t, "Vitals", [["Blood pressure", e.vitals.bp], ["Pulse", e.vitals.pulse], ["Temperature", e.vitals.temperature], ["SpO₂ (%)", e.vitals.spo2], ["Respiratory rate", e.vitals.resp]]),
    kvHtml(t, "General examination", [["Appetite", g.appetite], ["Thirst", g.thirst], ["Sleep", g.sleep], ["Bowel", g.bowel], ["Urine", g.urine], ["Perspiration", g.perspiration], ["Thermal reaction", g.thermal ? t(g.thermal) : ""], ["Tongue", g.tongue], ["Skin", g.skin], ["Mental state", g.mental], ["Cravings / aversions", g.cravings], ["Menstrual history", g.menstrual]]),
    kvHtml(t, "History", [
      ["Allergies", e.allergies],
      ["Chronic diseases", [...e.chronic.map(t), e.chronic_other].filter(Boolean).join(", ")],
      ["Past medical history", e.medical_history],
      ["Surgical history", e.surgical_history],
      ["Current medications", e.current_medications],
      ["Family history", [...e.family.map((f) => `${t(f.condition)}${f.relation ? ` (${f.relation})` : ""}`), e.family_notes].filter(Boolean).join("; ")],
      ["Lifestyle", [e.lifestyle.diet && `${t("Diet")}: ${t(e.lifestyle.diet)}`, `${t("Smoking")}: ${yn(e.lifestyle.smoking)}`, `${t("Alcohol")}: ${yn(e.lifestyle.alcohol)}`, e.lifestyle.exercise && `${t("Exercise")}: ${e.lifestyle.exercise}`].filter(Boolean).join(", ")],
      ["Practitioner notes", e.notes],
    ]),
    signatureHtml(t, clinic),
  ];
  return compose(blocks, footerHtml(t));
}

export async function buildPrescription(lang: Lang, clinic: Clinic, p: Patient, visitDate: string, symptoms: Symptom[], rx: Prescription) {
  const t: T = (s) => translate(lang, s);
  const complaints = symptoms.map((s) => s.complaint).filter(Boolean).join(", ");
  const blocks = [
    headerHtml(t, clinic, t("Prescription"), visitDate),
    patientHtml(t, p),
    ...(complaints ? [sectionTitle(t("Chief Complaints")) + `<div style="font-size:13px">${esc(complaints)}</div>`] : []),
    `<div style="font-family:Georgia,serif;font-size:30px;font-weight:700;color:${BLUE}">Rx</div>` + gridHtml(
      ["#", t("Tissue salt"), t("Potency"), t("Dose"), t("Frequency"), t("Timing"), t("Duration"), t("Instructions")],
      rx.items.map((r, i) => [String(i + 1), r.salt, r.potency, t(r.dosage), t(r.frequency), t(r.timing), t(r.duration), r.instructions]),
    ),
    kvHtml(t, "Advice", [["General instructions", rx.general], ["Diet & lifestyle", rx.diet], ["Follow-up", rx.follow_up]]),
    signatureHtml(t, clinic),
  ];
  return compose(blocks, footerHtml(t));
}
