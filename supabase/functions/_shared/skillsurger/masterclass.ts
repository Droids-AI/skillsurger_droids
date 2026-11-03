import { GoogleAuth } from 'npm:google-auth-library@9';
export async function submitMasterclass(body: Record<string, unknown>) {
  const name = String(body.name || '').trim(), email = String(body.email || '').trim(), phone = String(body.phoneNumber || '').trim();
  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !phone || phone.length > 40) throw new Error('Name, email, and phone number are required');
  const id = Deno.env.get('SKILLSURGER_MASTERCLASS_SHEET_ID');
  const auth = new GoogleAuth({ credentials: { client_email: Deno.env.get('SKILLSURGER_MASTERCLASS_CLIENT_EMAIL'), private_key: (Deno.env.get('SKILLSURGER_MASTERCLASS_PRIVATE_KEY') || '').replace(/\\n/g, '\n') }, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  if (!id) throw new Error('Masterclass sheet is not configured');
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token;
  if (!token) throw new Error('Masterclass sheet authentication failed');
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent('Sheet1!A:D')}:append?valueInputOption=RAW`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ values: [[String(body.timestamp || new Date().toISOString()).slice(0,100), name, email, phone]] }), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Masterclass sheet could not save the submission');
  return { message: 'Submitted successfully' };
}
