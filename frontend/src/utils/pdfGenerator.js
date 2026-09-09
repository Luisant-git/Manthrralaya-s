import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

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

const PT_TO_PX = 96 / 72;

const RICH_TEXT_CSS = `
.pdf-richtext{word-wrap:break-word;}
.pdf-richtext ul{list-style-type:disc;margin:0.25rem 0 0.5rem;padding-left:1.5rem;}
.pdf-richtext ol{list-style-type:decimal;margin:0.25rem 0 0.5rem;padding-left:1.5rem;}
.pdf-richtext li{margin-bottom:0.25rem;}
.pdf-richtext p{margin:0 0 0.5rem 0;}
.pdf-richtext b,.pdf-richtext strong{font-weight:bold;}
.pdf-richtext i,.pdf-richtext em{font-style:italic;}
.pdf-richtext u{text-decoration:underline;}
`;

const isHtml = (content) => typeof content === 'string' && /^\s*</.test(content);

const renderHtmlImage = async (html, widthPt) => {
  const widthPx = Math.round(widthPt * PT_TO_PX);
  const holder = document.createElement('div');
  holder.setAttribute('data-pdf-render-host', 'true');
  Object.assign(holder.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${widthPx}px`,
    background: '#ffffff',
    color: '#000000',
    fontFamily: "'Helvetica', 'Arial', sans-serif",
    fontSize: '14px',
    lineHeight: '1.5',
    padding: '0',
    zIndex: '-1000',
  });
  holder.innerHTML = `<style>${RICH_TEXT_CSS}</style><div class="pdf-richtext">${html || ''}</div>`;
  document.body.appendChild(holder);
  try {
    const scale = 2;
    const canvas = await html2canvas(holder, {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    return { canvas, scale };
  } finally {
    document.body.removeChild(holder);
  }
};

const sliceCanvas = (canvas, srcY, height) => {
  const slice = document.createElement('canvas');
  slice.width = canvas.width;
  slice.height = height;
  const ctx = slice.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, slice.width, slice.height);
  ctx.drawImage(canvas, 0, srcY, canvas.width, height, 0, 0, canvas.width, height);
  return slice;
};

const drawHtmlContent = async (doc, html, x, y, widthPt, pageHeight, onNewPage) => {
  const { canvas, scale } = await renderHtmlImage(html, widthPt);
  const cssHeight = canvas.height / scale;
  const heightPt = cssHeight * (72 / 96);

  let srcY = 0;
  let remainingPt = heightPt;

  while (remainingPt > 0) {
    const availablePt = pageHeight - 30 - y;
    if (availablePt <= 0) {
      doc.addPage();
      y = onNewPage();
      continue;
    }
    const slicePt = Math.min(remainingPt, availablePt);
    const sliceCssPx = slicePt * PT_TO_PX;
    const slice = sliceCanvas(canvas, srcY * scale, Math.ceil(sliceCssPx * scale));
    doc.addImage(slice, 'PNG', x, y, widthPt, slicePt);
    srcY += sliceCssPx;
    y += slicePt;
    remainingPt -= slicePt;
  }
};

const drawTopicContent = async (doc, content, x, y, widthPt, pageHeight, onNewPage) => {
  if (isHtml(content)) {
    return drawHtmlContent(doc, content, x, y, widthPt, pageHeight, onNewPage);
  }

  const text = (!content || content === 'None') ? 'No notes recorded.' : content;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const splitText = doc.splitTextToSize(text, widthPt);

  for (let i = 0; i < splitText.length; i++) {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = onNewPage();
    }
    doc.text(splitText[i], x, y);
    y += 6;
  }
};

const buildConsultationDoc = async (data, specificTopic = null, omitTopics = []) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const rawTopics = [
    { title: 'Medical History', content: data.medical_history || data.medicalHistoryNotes },
    { title: 'Consultation Notes', content: data.consultation_notes || data.consultationNotes },
    { title: 'Detox Procedure', content: data.detox_procedure || data.detoxProcedureNotes },
    { title: 'Diet Plan', content: data.diet_plan_note || data.dietPlanNotes },
    { title: 'Home Care Guidelines', content: data.home_care ? data.home_care.toString().trim() : 'None' }
  ];

  const normalizedOmit = (omitTopics || []).map(t => String(t).toLowerCase());
  const filteredTopics = rawTopics.filter(t => !normalizedOmit.includes(t.title.toLowerCase()));

  let topics = filteredTopics.filter(t => {
    if (!t.content) return false;
    const txt = stripHtml(t.content);
    return txt && txt !== 'None' && txt.trim() !== '';
  });

  if (specificTopic) {
    topics = topics.filter(t => t.title === specificTopic);
  }

  if (topics.length === 0) {
    topics.push({ title: 'Clinical Notes', content: 'No clinical notes were recorded for this session.' });
  }

  const drawConsultChrome = () => {
    addTemplateHeader(doc, "CLINICAL CONSULTATION REPORT");
    addTemplateFooter(doc);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Date: ${data.date}`, pageWidth - 14, 65, { align: 'right' });
    doc.text(`Patient Name: ${data.patient_name}`, 14, 72);
    doc.text(`Consulting Doctor: ${data.doctor_name}`, 14, 79);
  };

  const onNewPage = () => {
    drawConsultChrome();
    return 95;
  };

  for (let index = 0; index < topics.length; index++) {
    const topic = topics[index];
    if (index > 0) {
      doc.addPage();
    }

    drawConsultChrome();

    let currentY = 95;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(topic.title, 14, currentY);
    currentY += 10;

    await drawTopicContent(doc, topic.content, 14, currentY, pageWidth - 28, pageHeight, onNewPage);
  }

  const fileName = specificTopic 
    ? `${data.patient_name}_${specificTopic.replace(/\s+/g, '_')}_${data.date}.pdf`
    : `${data.patient_name}_Consultation_${data.date}.pdf`;

  return { doc, fileName };
};

export const generateConsultationPDF = async (data, specificTopic = null, omitTopics = []) => {
  const { doc, fileName } = await buildConsultationDoc(data, specificTopic, omitTopics);
  doc.save(fileName);
};

export const buildConsultationPdfBlob = async (data, specificTopic = null, omitTopics = []) => {
  const { doc, fileName } = await buildConsultationDoc(data, specificTopic, omitTopics);
  const blob = doc.output('blob');
  return { blob, fileName };
};

export const generateSingleTopicPDF = async (data, title, htmlContent) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const drawChrome = () => {
    addTemplateHeader(doc, "CLINICAL REPORT");
    addTemplateFooter(doc);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Date: ${data.date}`, pageWidth - 14, 65, { align: 'right' });
    doc.text(`Patient Name: ${data.patient_name}`, 14, 72);
    doc.text(`Consulting Doctor: ${data.doctor_name}`, 14, 79);
  };

  drawChrome();

  let currentY = 95;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 14, currentY);
  currentY += 10;

  const onNewPage = () => {
    drawChrome();
    return 95;
  };

  await drawTopicContent(doc, htmlContent, 14, currentY, pageWidth - 28, pageHeight, onNewPage);

  doc.save(`${title.replace(/\s+/g, '_')}_${data.patient_name.replace(/\s+/g, '_')}_${data.date}.pdf`);
};

export const generateDetoxPDF = async (data) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const rawTopics = [
    { title: 'Detox Notes', content: data.detoxNotes }
  ];

  if (data.followupDate) {
    rawTopics.push({ 
      title: 'Follow-up Instructions', 
      content: `Follow-up Date: ${data.followupDate}\nRemarks: ${data.followupRemarks}` 
    });
  }

  const topics = rawTopics.filter(t => {
    if (!t.content) return false;
    const txt = stripHtml(t.content);
    return txt && txt !== 'None' && txt.trim() !== '';
  });

  if (topics.length === 0) {
    topics.push({ title: 'Detox Session', content: 'No detox notes were recorded for this session.' });
  }

  const drawDetoxChrome = () => {
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
  };

  const onNewPage = () => {
    drawDetoxChrome();
    return 108;
  };

  for (let index = 0; index < topics.length; index++) {
    const topic = topics[index];
    if (index > 0) {
      doc.addPage();
    }

    drawDetoxChrome();

    let currentY = 108;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(topic.title, 14, currentY);
    currentY += 10;

    await drawTopicContent(doc, topic.content, 14, currentY, pageWidth - 28, pageHeight, onNewPage);
  }

  doc.save(`DetoxSession_${data.patient_name.replace(/\s+/g, '_')}_${data.sessionDate}.pdf`);
};