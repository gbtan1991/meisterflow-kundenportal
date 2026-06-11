import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const OUTLOOK_CONNECTOR_ID = '6a2a5b27725e857800ca8e5d';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, body, pdfBase64, pdfFilename } = await req.json();

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(OUTLOOK_CONNECTOR_ID);

    const message = {
      subject,
      body: {
        contentType: 'HTML',
        content: body,
      },
      toRecipients: [{ emailAddress: { address: to } }],
    };

    if (pdfBase64 && pdfFilename) {
      message.attachments = [{
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: pdfFilename,
        contentType: 'application/pdf',
        contentBytes: pdfBase64,
      }];
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
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