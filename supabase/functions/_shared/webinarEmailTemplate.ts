import { escapeHtml } from './twilio-email.ts';

interface WebinarEmailDetails {
  name: string;
  startsAt: string;
  durationMinutes: number;
  whatsappGroupUrl: string;
}

const SITE = 'https://skillsurger.com';
const FONT = 'Arial,Helvetica,sans-serif';
const utcStamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

// Table layout, inline styles and PNG icons keep the actions usable in email
// clients without JavaScript, external stylesheets, SVG support or web fonts.
export function buildWebinarConfirmation(details: WebinarEmailDetails): {
  subject: string; body: string; html: string;
} {
  const start = new Date(details.startsAt);
  const end = new Date(start.getTime() + details.durationMinutes * 60000);
  const date = start.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const time = (value: Date) => value.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true,
  }).toUpperCase();
  const timeRange = `${time(start)} – ${time(end)} IST`;
  const calendar = new URL('https://calendar.google.com/calendar/render');
  calendar.search = new URLSearchParams({
    action: 'TEMPLATE', text: 'Skillsurger job switch webinar',
    dates: `${utcStamp(start)}/${utcStamp(end)}`, ctz: 'Asia/Kolkata',
    details: `Free ${details.durationMinutes}-minute Skillsurger webinar. Join the WhatsApp group for the meeting link and reminders: ${details.whatsappGroupUrl}`,
    location: 'Online (meeting link in the webinar WhatsApp group)',
  }).toString();
  const whatsappUrl = escapeHtml(details.whatsappGroupUrl);
  const calendarUrl = escapeHtml(calendar.href);
  const name = escapeHtml(details.name);
  const prep = [
    'Keep your current resume handy as a PDF.',
    'Write down 2–3 roles or companies you want to move to next.',
    'Note where your search is stuck: callbacks, interviews or offers.',
  ];
  const subject = 'Your Skillsurger webinar registration is confirmed';
  const body = `Hi ${details.name},\n\nYour registration for the free Skillsurger job switch webinar is confirmed.\n\n${date}\n${timeRange} · ${details.durationMinutes} minutes · Online\n\nJoin the WhatsApp group for the meeting link and reminders:\n${details.whatsappGroupUrl}\n\nAdd the session to Google Calendar:\n${calendar.href}\n\nBefore the webinar (10 minutes):\n${prep.map((item, index) => `${index + 1}. ${item}`).join('\n')}\n\nJoining the WhatsApp group is optional; your number may be visible to other members. Need another way to get the joining details? Contact support@skillsurger.com.\n\nTeam Skillsurger\n${SITE}`;

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${subject}</title>
  <!--[if mso]><style>body,table,td,a,h1,h2,p{font-family:Arial,sans-serif!important}</style><![endif]-->
  <style>
    body{margin:0!important;padding:0!important}table{border-collapse:collapse}a{color:#2563eb}
    @media only screen and (max-width:620px){.outer{padding:12px 8px!important}.content{padding:28px 20px!important}.brand{padding:24px 20px!important}.heading{font-size:30px!important;line-height:36px!important}.button{display:block!important}.event{padding:20px!important}}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:${FONT};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;color:#172033;">
  <div style="display:none;font-size:1px;line-height:1px;color:#f1f5f9;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">You're registered. ${escapeHtml(date)}, ${escapeHtml(timeRange)}. Join the group for your meeting link.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9">
    <tr><td class="outer" align="center" style="padding:32px 16px;">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
        <tr><td class="brand" bgcolor="#020420" style="padding:28px 32px;border-radius:16px 16px 0 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="40" style="width:40px;"><a href="${SITE}" style="text-decoration:none;"><img src="${SITE}/apple-touch-icon.png" width="40" height="40" alt="" border="0" style="display:block;border:0;border-radius:8px;"></a></td>
            <td style="padding-left:12px;"><a href="${SITE}" style="font-family:${FONT};font-size:24px;line-height:30px;font-weight:bold;color:#ffffff;text-decoration:none;">Skillsurger</a><p style="margin:2px 0 0;font-size:12px;line-height:18px;color:#a5c9ff;">YOUR JOB SEARCH, WITH A CLEARER PLAN</p></td>
          </tr></table>
        </td></tr>
        <tr><td class="content" style="padding:32px;">
          <p style="margin:0 0 14px;font-size:12px;line-height:18px;font-weight:bold;letter-spacing:1.5px;color:#2563eb;">FREE LIVE WEBINAR · REGISTRATION CONFIRMED</p>
          <h1 class="heading" style="margin:0 0 22px;font-size:36px;line-height:42px;letter-spacing:-1px;color:#0f172a;font-weight:bold;">You're registered.</h1>
          <p style="margin:0 0 10px;font-size:16px;line-height:26px;color:#334155;">Hi ${name},</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:26px;color:#334155;">Your registration for the free Skillsurger job switch webinar is confirmed. Here are your session details and next steps.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eff6ff" style="background-color:#eff6ff;border:1px solid #dbeafe;border-radius:12px;">
            <tr><td class="event" style="padding:24px;">
              <p style="margin:0 0 8px;font-size:12px;line-height:18px;font-weight:bold;letter-spacing:1px;color:#1d4ed8;">JOB SWITCH WEBINAR</p>
              <p style="margin:0 0 5px;font-size:20px;line-height:28px;font-weight:bold;color:#0f172a;">${escapeHtml(date)}</p>
              <p style="margin:0 0 10px;font-size:18px;line-height:26px;font-weight:bold;color:#1d4ed8;">${escapeHtml(timeRange)}</p>
              <p style="margin:0;font-size:14px;line-height:22px;color:#475569;">${details.durationMinutes} minutes &nbsp;·&nbsp; Live online &nbsp;·&nbsp; Free</p>
            </td></tr>
          </table>

          <h2 style="margin:28px 0 8px;font-size:20px;line-height:28px;color:#0f172a;">1. Get your joining link</h2>
          <p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Join the webinar WhatsApp group for the meeting link and reminders.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#128c4a" style="background-color:#128c4a;border-radius:8px;">
            <!--[if mso]><v:roundrect href="${whatsappUrl}" style="height:54px;v-text-anchor:middle;width:480px;" arcsize="14%" stroke="f" fillcolor="#128c4a"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Join the WhatsApp group</center></v:roundrect><![endif]-->
            <!--[if !mso]><!--><a class="button" href="${whatsappUrl}" target="_blank" style="display:block;padding:15px 12px;border:1px solid #128c4a;border-radius:8px;font-family:${FONT};font-size:16px;line-height:24px;font-weight:bold;color:#ffffff;text-align:center;text-decoration:none;"><img src="${SITE}/email/whatsapp-white.png" width="24" height="24" alt="" border="0" style="display:inline-block;vertical-align:middle;border:0;margin-right:8px;">&nbsp;Join the WhatsApp group</a><!--<![endif]-->
          </td></tr></table>
          <p style="margin:12px 0 0;font-size:12px;line-height:19px;color:#64748b;">Joining is optional; your number may be visible to other group members. Need another way to get the joining details? <a href="mailto:support@skillsurger.com" style="color:#2563eb;text-decoration:underline;">Contact support</a>.</p>

          <h2 style="margin:28px 0 8px;font-size:20px;line-height:28px;color:#0f172a;">2. Save the date</h2>
          <p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#475569;">Add the session to your calendar. The event includes the WhatsApp group link so you can find it again.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#eff6ff" style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
            <!--[if mso]><v:roundrect href="${calendarUrl}" style="height:54px;v-text-anchor:middle;width:480px;" arcsize="14%" strokecolor="#bfdbfe" fillcolor="#eff6ff"><w:anchorlock/><center style="color:#1d4ed8;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Add to Google Calendar</center></v:roundrect><![endif]-->
            <!--[if !mso]><!--><a class="button" href="${calendarUrl}" target="_blank" style="display:block;padding:15px 12px;border-radius:8px;font-family:${FONT};font-size:16px;line-height:24px;font-weight:bold;color:#1d4ed8;text-align:center;text-decoration:none;"><img src="${SITE}/email/calendar-blue.png" width="24" height="24" alt="" border="0" style="display:inline-block;vertical-align:middle;border:0;margin-right:8px;">&nbsp;Add to Google Calendar</a><!--<![endif]-->
          </td></tr></table>

          <h2 style="margin:28px 0 14px;font-size:20px;line-height:28px;color:#0f172a;">Before the webinar: 10 minutes</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${prep.map((item, index) => `
            <tr><td width="32" valign="top" style="width:32px;padding:0 8px 12px 0;font-size:14px;line-height:24px;font-weight:bold;color:#2563eb;">0${index + 1}</td><td valign="top" style="padding:0 0 12px;font-size:15px;line-height:24px;color:#475569;">${escapeHtml(item)}</td></tr>`).join('')}
          </table>
          <p style="margin:14px 0 0;font-size:15px;line-height:24px;color:#334155;">See you at the session,<br><strong style="color:#0f172a;">Team Skillsurger</strong></p>
        </td></tr>
        <tr><td class="content" bgcolor="#f8fafc" style="padding:24px 32px;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;">
          <p style="margin:0 0 8px;font-size:12px;line-height:20px;color:#64748b;">Button not opening? <a href="${whatsappUrl}" style="color:#2563eb;text-decoration:underline;">Open the WhatsApp group</a> or <a href="${calendarUrl}" style="color:#2563eb;text-decoration:underline;">open the calendar event</a>.</p>
          <p style="margin:0;font-size:12px;line-height:20px;color:#64748b;">You received this email because you registered for the free Skillsurger webinar.<br><a href="${SITE}" style="color:#475569;text-decoration:underline;">skillsurger.com</a> &nbsp;·&nbsp; <a href="mailto:support@skillsurger.com" style="color:#475569;text-decoration:underline;">Support</a> &nbsp;·&nbsp; <a href="${SITE}/privacy" style="color:#475569;text-decoration:underline;">Privacy</a></p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`;
  return { subject, body, html };
}
