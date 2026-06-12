import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const stripHtml = (html) => {
  if (!html) return 'None';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || 'None';
};

export const generateConsultationPDF = (data) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text("Manthrralaya's Wellness", 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text("Clinical Consultation Report", 14, 30);
  
  // Patient Info
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Patient Name: ${data.patient_name}`, 14, 45);
  doc.text(`Date: ${data.date}`, 14, 52);
  doc.text(`Consulting Doctor: ${data.doctor_name}`, 14, 59);

  const tableData = [
    ['Medical History', stripHtml(data.medical_history)],
    ['Consultation Notes', stripHtml(data.consultation_notes)],
    ['Detox Procedure', stripHtml(data.detox_procedure)],
    ['Diet Plan Note', stripHtml(data.diet_plan_note)],
    ['Home Care Guidelines', data.home_care || 'None']
  ];

  if (data.detox_recommended) {
    tableData.push(['Detox Recommendation', `Yes (Doctor: ${data.detox_doctor_name || 'N/A'}, Follow-up: ${data.followup_date || 'N/A'})`]);
  }

  autoTable(doc, {
    startY: 70,
    head: [['Section', 'Details']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105] },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    },
    styles: { overflow: 'linebreak' }
  });

  doc.save(`Consultation_${data.patient_name.replace(/\s+/g, '_')}_${data.date}.pdf`);
};

export const generateDetoxPDF = (data) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text("Manthrralaya's Wellness", 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text("Detox Session Report", 14, 30);
  
  // Patient Info
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Patient Name: ${data.patient_name}`, 14, 45);
  doc.text(`Date: ${data.sessionDate}`, 14, 52);
  doc.text(`Therapist: ${data.doctorName}`, 14, 59);
  doc.text(`Session Number: ${data.sessionNumber}`, 14, 66);
  doc.text(`Session Type: ${data.sessionType}`, 14, 73);

  const tableData = [
    ['Detox Notes', stripHtml(data.detoxNotes)]
  ];

  if (data.followupDate) {
    tableData.push(['Follow-up Date', data.followupDate]);
    tableData.push(['Follow-up Remarks', stripHtml(data.followupRemarks)]);
  }

  autoTable(doc, {
    startY: 85,
    head: [['Section', 'Details']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105] },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    },
    styles: { overflow: 'linebreak' }
  });

  doc.save(`DetoxSession_${data.patient_name.replace(/\s+/g, '_')}_${data.sessionDate}.pdf`);
};
