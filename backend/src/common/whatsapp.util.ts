export const sendWhatsappTemplateMessage = async (
  toPhoneNumber: string, 
  templateName: string, 
  parameters: string[] = [],
  languageCode: string = 'en'
) => {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  
  if (!phoneNumberId || !accessToken) {
    console.error('WhatsApp credentials missing in .env file');
    return;
  }
  
  const apiUrl = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

  if (!toPhoneNumber) return;

  // Format phone number
  let phone = toPhoneNumber.replace(/\D/g, '');
  if (phone.length === 10) {
    phone = '91' + phone; // Default to India country code if 10 digits
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: parameters.length > 0 ? [
            {
              type: "body",
              parameters: parameters.map(param => ({
                type: "text",
                text: param || "N/A"
              }))
            }
          ] : []
        }
      })
    });

    const data = await response.json();
    console.log(`WhatsApp API Response:`, data);
    
    if (!response.ok) {
      console.error(`Failed to send WhatsApp message:`, data.error?.message);
    }
    return data;
  } catch (error) {
    console.error(`Error sending WhatsApp message:`, error);
  }
};
