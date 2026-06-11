import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GMAIL_CONNECTOR_ID = '6a2a5b185cd48e6a3e73dbe0';
const OUTLOOK_CONNECTOR_ID = '6a2a5b27725e857800ca8e5d';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = { gmail: false, outlook: false };

    try {
      await base44.asServiceRole.connectors.getCurrentAppUserConnection(GMAIL_CONNECTOR_ID);
      result.gmail = true;
    } catch (_) {}

    try {
      await base44.asServiceRole.connectors.getCurrentAppUserConnection(OUTLOOK_CONNECTOR_ID);
      result.outlook = true;
    } catch (_) {}

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});