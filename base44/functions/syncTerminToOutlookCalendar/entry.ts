import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const OUTLOOK_CONNECTOR_ID = "6a2a5b27725e857800ca8e5d";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { termin, action } = body;

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(OUTLOOK_CONNECTOR_ID);

    const authHeader = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const buildEvent = (t) => {
      const startDate = t.datum;
      const time = t.uhrzeit || "09:00";
      const dauer = t.dauer_minuten || 60;

      const startDateTime = `${startDate}T${time}:00`;
      const endDate = new Date(`${startDate}T${time}:00`);
      endDate.setMinutes(endDate.getMinutes() + dauer);
      const endDateTime = endDate.toISOString().slice(0, 19);

      return {
        subject: t.titel,
        location: t.ort ? { displayName: t.ort } : undefined,
        body: {
          contentType: 'Text',
          content: [
            t.kunde_name ? `Kunde: ${t.kunde_name}` : null,
            t.notizen || null,
          ].filter(Boolean).join('\n') || '',
        },
        start: { dateTime: startDateTime, timeZone: 'Europe/Zurich' },
        end: { dateTime: endDateTime, timeZone: 'Europe/Zurich' },
      };
    };

    if (action === 'create') {
      const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify(buildEvent(termin)),
      });
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: err }, { status: res.status });
      }
      const event = await res.json();
      return Response.json({ success: true, eventId: event.id });
    }

    if (action === 'update' && termin.google_event_id) {
      const res = await fetch(`https://graph.microsoft.com/v1.0/me/events/${termin.google_event_id}`, {
        method: 'PATCH',
        headers: authHeader,
        body: JSON.stringify(buildEvent(termin)),
      });
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: err }, { status: res.status });
      }
      return Response.json({ success: true });
    }

    if (action === 'delete' && termin.google_event_id) {
      await fetch(`https://graph.microsoft.com/v1.0/me/events/${termin.google_event_id}`, {
        method: 'DELETE',
        headers: authHeader,
      });
      return Response.json({ success: true });
    }

    return Response.json({ success: false, message: 'No action taken' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});