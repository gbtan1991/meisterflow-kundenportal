import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GMAIL_CONNECTOR_ID = '6a2a5b185cd48e6a3e73dbe0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, body, pdfBase64, pdfFilename } = await req.json();

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(GMAIL_CONNECTOR_ID);

    // Build MIME message with PDF attachment
    const boundary = 'boundary_meisterflow_' + Date.now();
    
    let mimeMessage = [
      `MIME-Version: 1.0`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      btoa(unescape(encodeURIComponent(body))),
    ];

    if (pdfBase64 && pdfFilename) {
      mimeMessage = mimeMessage.concat([
        `--${boundary}`,
        `Content-Type: application/pdf; name="${pdfFilename}"`,
        `Content-Transfer-Encoding: base64`,
        `Content-Disposition: attachment; filename="${pdfFilename}"`,
        ``,
        pdfBase64,
      ]);
    }

    mimeMessage.push(`--${boundary}--`);

    const rawMessage = mimeMessage.join('\r\n');
    const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: err }, { status: response.status });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});