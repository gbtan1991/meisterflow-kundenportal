import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DRIVE_CONNECTOR_ID = '6a2a6df2e3b39da37f1f47cc';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pdfBase64, fileName, folderName } = await req.json();

    if (!pdfBase64 || !fileName) {
      return Response.json({ error: 'pdfBase64 and fileName are required' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(DRIVE_CONNECTOR_ID);

    // Check or create MeisterFlow folder
    const targetFolder = folderName || 'MeisterFlow';
    let folderId = null;

    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${targetFolder}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
      folderId = searchData.files[0].id;
    } else {
      // Create folder
      const folderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: targetFolder,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });
      const folderData = await folderRes.json();
      folderId = folderData.id;
    }

    // Upload PDF via multipart upload
    const pdfBytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

    const metadata = JSON.stringify({
      name: fileName,
      mimeType: 'application/pdf',
      parents: folderId ? [folderId] : [],
    });

    const boundary = '-------meisterflow_boundary';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metaPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${metadata}`;
    const filePart = `${delimiter}Content-Type: application/pdf\r\nContent-Transfer-Encoding: base64\r\n\r\n${pdfBase64}`;
    const body = metaPart + filePart + closeDelimiter;

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary="${boundary}"`,
        },
        body,
      }
    );

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      return Response.json({ error: uploadData.error?.message || 'Upload failed' }, { status: 500 });
    }

    return Response.json({
      success: true,
      fileId: uploadData.id,
      fileName: uploadData.name,
      webViewLink: uploadData.webViewLink,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});