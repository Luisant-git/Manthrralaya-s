// src/common/whatsapp.util.ts
import * as fs from 'fs';
import * as path from 'path';

export const uploadWhatsappMediaBuffer = async (
  buffer: Buffer, 
  filename: string, 
  mimeType = 'application/pdf'
) => {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  
  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp configuration missing');
  }

  if (!buffer || buffer.length === 0) {
    throw new Error('Buffer is empty or invalid');
  }

  const apiUrl = `https://graph.facebook.com/v17.0/${phoneNumberId}/media`;

  // Use WHATWG FormData + Blob (Node 18+) so global fetch handles multipart correctly
  const form = new (globalThis as any).FormData();
  const blob = new (globalThis as any).Blob([buffer], { type: mimeType });
  form.append('file', blob, filename);
  form.append('messaging_product', 'whatsapp');

  console.log(`Uploading ${filename} (${buffer.length} bytes) to WhatsApp...`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        // Do NOT set Content-Type here; node's fetch will set the multipart boundary header for WHATWG FormData
      },
      body: form as any,
    });

    const json = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp upload error:', json);
      throw new Error(`WhatsApp media upload failed: ${JSON.stringify(json)}`);
    }

    console.log('Upload successful, media ID:', json.id);
    return json.id;
  } catch (error: any) {
    console.error('Upload error:', error.message);
    throw error;
  }
};

export const uploadWhatsappMediaFromFile = async (filePath: string) => {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  
  try {
    await fs.promises.access(abs);
    const buf = await fs.promises.readFile(abs);
    const filename = path.basename(abs);
    const mimeType = filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
    return uploadWhatsappMediaBuffer(buf, filename, mimeType);
  } catch (error) {
    console.error(`File not found or cannot be read: ${abs}`, error);
    throw error;
  }
};

export const sendWhatsappTemplateMessage = async (
  toPhoneNumber: string,
  templateName: string,
  parameters: string[] = [],
  languageCode: string = 'en',
  mediaId?: string,
  fileName: string = 'file.pdf'
) => {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp configuration missing');
  }

  const apiUrl = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

  // Format phone number
  let phone = toPhoneNumber.replace(/\D/g, '');
  if (phone.length === 10) phone = '91' + phone;
  
  if (phone.length < 10) {
    throw new Error(`Invalid phone number: ${toPhoneNumber}`);
  }

  try {
    const components: any[] = [];

    // ✅ Add document header if mediaId exists
    if (mediaId) {
      components.push({
        type: 'header',
        parameters: [
          {
            type: 'document',
            document: {
              id: mediaId,
              filename: fileName || 'consultation.pdf'
            }
          }
        ]
      });
    }

    // ✅ Add body parameters
    if (parameters.length > 0) {
      components.push({
        type: "body",
        parameters: parameters.map(param => ({
          type: "text",
          text: param || "N/A"
        }))
      });
    }

    const payload: any = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode }
      }
    };

    if (components.length > 0) {
      payload.template.components = components;
    }

    console.log('Sending WhatsApp template:', JSON.stringify(payload, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp API error:', data);
      
      // If it's a template mismatch error, try sending without media
      if (data.error?.code === 132012) {
        console.log('Template header mismatch, retrying without media...');
        return await sendWhatsappTemplateMessageWithoutMedia(
          toPhoneNumber, 
          templateName, 
          parameters, 
          languageCode
        );
      }
      
      throw new Error(`WhatsApp API error: ${JSON.stringify(data)}`);
    }

    console.log('WhatsApp message sent successfully:', data);
    return data;
  } catch (error: any) {
    console.error('WhatsApp send error:', error.message);
    throw error;
  }
};

// Fallback: Send without media
export const sendWhatsappTemplateMessageWithoutMedia = async (
  toPhoneNumber: string,
  templateName: string,
  parameters: string[] = [],
  languageCode: string = 'en'
) => {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  
  const apiUrl = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

  let phone = toPhoneNumber.replace(/\D/g, '');
  if (phone.length === 10) phone = '91' + phone;

  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components: parameters.length > 0 ? [
        {
          type: "body",
          parameters: parameters.map(param => ({
            type: "text",
            text: param || "N/A"
          }))
        }
      ] : undefined
    }
  };

  // Remove components if empty
  if (!payload.template.components) {
    delete payload.template.components;
  }

  console.log('Sending WhatsApp without media:', JSON.stringify(payload, null, 2));

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`WhatsApp API error: ${JSON.stringify(data)}`);
  }

  return data;
};