import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const stripHtml = (html) => {
  if (!html) return 'None';
  let formattedHtml = html.replace(/<br\s*[\/]?>/gi, '\n');
  formattedHtml = formattedHtml.replace(/<\/p>/gi, '\n\n');
  formattedHtml = formattedHtml.replace(/<\/div>/gi, '\n');
  formattedHtml = formattedHtml.replace(/<li>/gi, '\n');
  
  const tmp = document.createElement('DIV');
  tmp.innerHTML = formattedHtml;
  let text = tmp.innerText || tmp.textContent || 'None';
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text || 'None';
};

export const addTemplateHeader = (doc, title = "PRESCRIPTION PAD") => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Top left / right texts
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100);
  doc.text("Obey Nature!", 14, 15);
  doc.text("Be Happy!", pageWidth - 14, 15, { align: 'right' });
  
  // Main Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(59, 63, 113); // A dark bluish-purple color matching the image
  doc.text("Manthrralaya's Naturopathy Yoga & Electro Herbal", pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text("Research Centre", pageWidth / 2, 29, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text("Regd No.3406/2009", pageWidth / 2, 35, { align: 'center' });
  
  // Top Line
  doc.setDrawColor(150);
  doc.setLineWidth(0.5);
  doc.line(10, 38, pageWidth - 10, 38);
  
  // Address
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text("No.18, Fourth Flour, MRN Galariya, Vayalur Main Road, Srinivasa Nagar Trichy-620017", pageWidth / 2, 43, { align: 'center' });
  doc.text("Mob: No. 8838727968, E-maill : manthrralaya15@gmail.com.", pageWidth / 2, 48, { align: 'center' });
  
  // Bottom Line of Header
  doc.line(10, 52, pageWidth - 10, 52);
  
  // Sub-header title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(title, pageWidth / 2, 59, { align: 'center' });
};

export const addTemplateFooter = (doc) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Footer Line
  doc.setDrawColor(150);
  doc.setLineWidth(0.5);
  doc.line(10, pageHeight - 20, pageWidth - 10, pageHeight - 20);
  
  // Footer Text
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text("We count our success in the smiles of suffering humanity", pageWidth / 2, pageHeight - 13, { align: 'center' });
};

const buildConsultationDoc = (data, specificTopic = null, omitTopics = []) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  const rawTopics = [
    { title: 'Medical History', content: stripHtml(data.medical_history || data.medicalHistoryNotes) },
    { title: 'Consultation Notes', content: stripHtml(data.consultation_notes || data.consultationNotes) },
    { title: 'Detox Procedure', content: stripHtml(data.detox_procedure || data.detoxProcedureNotes) },
    { title: 'Diet Plan', content: stripHtml(data.diet_plan_note || data.dietPlanNotes) },
    { title: 'Home Care Guidelines', content: data.home_care ? data.home_care.toString().trim() : 'None' }
  ];

  const normalizedOmit = (omitTopics || []).map(t => String(t).toLowerCase());
  const filteredTopics = rawTopics.filter(t => !normalizedOmit.includes(t.title.toLowerCase()));

  let topics = filteredTopics.filter(t => t.content && t.content !== 'None' && t.content.trim() !== '');

  if (specificTopic) {
    topics = topics.filter(t => t.title === specificTopic);
  }

  if (topics.length === 0) {
    topics.push({ title: 'Clinical Notes', content: 'No clinical notes were recorded for this session.' });
  }

  topics.forEach((topic, index) => {
    if (index > 0) {
      doc.addPage();
    }
    
    addTemplateHeader(doc, "CLINICAL CONSULTATION REPORT");
    addTemplateFooter(doc);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    doc.text(`Date: ${data.date}`, pageWidth - 14, 65, { align: 'right' });
    doc.text(`Patient Name: ${data.patient_name}`, 14, 72);
    doc.text(`Consulting Doctor: ${data.doctor_name}`, 14, 79);

    let currentY = 95;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(topic.title, 14, currentY);
    currentY += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    const splitText = doc.splitTextToSize(topic.content, pageWidth - 28);
    
    for (let i = 0; i < splitText.length; i++) {
      if (currentY > pageHeight - 30) {
        doc.addPage();
        addTemplateHeader(doc, "CLINICAL CONSULTATION REPORT");
        addTemplateFooter(doc);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Date: ${data.date}`, pageWidth - 14, 65, { align: 'right' });
        doc.text(`Patient Name: ${data.patient_name}`, 14, 72);
        doc.text(`Consulting Doctor: ${data.doctor_name}`, 14, 79);
        currentY = 95;
        doc.setFontSize(11);
      }
      doc.text(splitText[i], 14, currentY);
      currentY += 6;
    }
  });

  const fileName = specificTopic 
    ? `${data.patient_name}_${specificTopic.replace(/\s+/g, '_')}_${data.date}.pdf`
    : `${data.patient_name}_Consultation_${data.date}.pdf`;

  return { doc, fileName };
};

export const generateConsultationPDF = (data, specificTopic = null, omitTopics = []) => {
  const { doc, fileName } = buildConsultationDoc(data, specificTopic, omitTopics);
  doc.save(fileName);
};

export const buildConsultationPdfBlob = async (data, specificTopic = null, omitTopics = []) => {
  const { doc, fileName } = buildConsultationDoc(data, specificTopic, omitTopics);
  const blob = doc.output('blob');
  return { blob, fileName };
};

export const generateSingleTopicPDF = (data, title, htmlContent) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  addTemplateHeader(doc, "CLINICAL REPORT");
  addTemplateFooter(doc);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0);
  
  doc.text(`Date: ${data.date}`, pageWidth - 14, 65, { align: 'right' });
  doc.text(`Patient Name: ${data.patient_name}`, 14, 72);
  doc.text(`Consulting Doctor: ${data.doctor_name}`, 14, 79);

  let currentY = 95;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 14, currentY);
  currentY += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  
  const content = stripHtml(htmlContent);
  const splitText = doc.splitTextToSize(content === 'None' || !content ? 'No notes recorded.' : content, pageWidth - 28);
  
  for (let i = 0; i < splitText.length; i++) {
    if (currentY > pageHeight - 30) {
      doc.addPage();
      addTemplateHeader(doc, "CLINICAL REPORT");
      addTemplateFooter(doc);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(`Date: ${data.date}`, pageWidth - 14, 65, { align: 'right' });
      doc.text(`Patient Name: ${data.patient_name}`, 14, 72);
      doc.text(`Consulting Doctor: ${data.doctor_name}`, 14, 79);
      currentY = 95;
      doc.setFontSize(11);
    }
    doc.text(splitText[i], 14, currentY);
    currentY += 6;
  }

  doc.save(`${title.replace(/\s+/g, '_')}_${data.patient_name.replace(/\s+/g, '_')}_${data.date}.pdf`);
};

export const generateDetoxPDF = (data) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  const rawTopics = [
    { title: 'Detox Notes', content: stripHtml(data.detoxNotes) }
  ];

  if (data.followupDate) {
    rawTopics.push({ 
      title: 'Follow-up Instructions', 
      content: `Follow-up Date: ${data.followupDate}\nRemarks: ${stripHtml(data.followupRemarks)}` 
    });
  }

  const topics = rawTopics.filter(t => t.content && t.content !== 'None' && t.content.trim() !== '');

  if (topics.length === 0) {
    topics.push({ title: 'Detox Session', content: 'No detox notes were recorded for this session.' });
  }

  topics.forEach((topic, index) => {
    if (index > 0) {
      doc.addPage();
    }
    
    addTemplateHeader(doc, "DETOX SESSION REPORT");
    addTemplateFooter(doc);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    doc.text(`Date: ${data.sessionDate}`, pageWidth - 14, 65, { align: 'right' });
    doc.text(`Patient Name: ${data.patient_name}`, 14, 72);
    doc.text(`Therapist: ${data.doctorName}`, 14, 79);
    doc.text(`Session Number: ${data.sessionNumber}`, 14, 86);
    doc.text(`Session Type: ${data.sessionType}`, 14, 93);

    let currentY = 108;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(topic.title, 14, currentY);
    currentY += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    const splitText = doc.splitTextToSize(topic.content, pageWidth - 28);
    
    for (let i = 0; i < splitText.length; i++) {
      if (currentY > pageHeight - 30) {
        doc.addPage();
        addTemplateHeader(doc, "DETOX SESSION REPORT");
        addTemplateFooter(doc);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Date: ${data.sessionDate}`, pageWidth - 14, 65, { align: 'right' });
        doc.text(`Patient Name: ${data.patient_name}`, 14, 72);
        doc.text(`Therapist: ${data.doctorName}`, 14, 79);
        doc.text(`Session Number: ${data.sessionNumber}`, 14, 86);
        doc.text(`Session Type: ${data.sessionType}`, 14, 93);
        currentY = 108;
        doc.setFontSize(11);
      }
      doc.text(splitText[i], 14, currentY);
      currentY += 6;
    }
  });

  doc.save(`DetoxSession_${data.patient_name.replace(/\s+/g, '_')}_${data.sessionDate}.pdf`);
};
