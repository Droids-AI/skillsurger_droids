// Supabase Edge Function: sheets-sync
//
// Triggered by a Database Webhook on INSERT into public.leads. Appends the
// new row to the correct tab of a Google Sheet using a Google service
// account (no user OAuth flow, no Apps Script deployment).
//
// Required secrets (Project Settings > Edge Functions > Secrets, or
// `supabase secrets set`):
//   GOOGLE_SHEET_ID             - the spreadsheet ID from its URL
//   GOOGLE_SERVICE_ACCOUNT_EMAIL - client_email from the service account JSON key
//   GOOGLE_PRIVATE_KEY           - private_key from the service account JSON key
//
// The Google Sheet must be shared with GOOGLE_SERVICE_ACCOUNT_EMAIL as
// Editor. See supabase/functions/sheets-sync/README.md for full setup.

import { GoogleAuth } from "npm:google-auth-library@9";

const SHEET_ID = Deno.env.get("GOOGLE_SHEET_ID") ?? "";
const SERVICE_ACCOUNT_EMAIL = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL") ?? "";
const PRIVATE_KEY = (Deno.env.get("GOOGLE_PRIVATE_KEY") ?? "").replace(/\\n/g, "\n");

interface SheetConfig {
  tab: string;
  columns: string[];
}

// Each known form_type gets its own tab with a fixed, matching column set.
const SHEET_CONFIG: Record<string, SheetConfig> = {
  diagnosis_booking: {
    tab: "Book a Call",
    columns: [
      "receivedAt", "name", "email", "phoneNumber", "currentRole",
      "targetRole", "yearsOfExperience", "currentJobStatus", "preferredSlot",
      "biggestChallenge", "timestamp",
    ],
  },
  resume_audit: {
    tab: "Resume Audit",
    columns: [
      "receivedAt", "fullName", "email", "phoneNumber", "currentRole",
      "targetRole", "yearsOfExperience", "currentCTC", "expectedCTC",
      "noticePeriodStatus", "linkedinUrl", "jobDescription",
      "resumeStoragePath", "timestamp",
    ],
  },
};

// Any form_type not listed above falls back to a generic tab whose columns
// are derived from whatever keys are present on the payload.
function genericConfig(payload: Record<string, unknown>): SheetConfig {
  return { tab: "Other Leads", columns: ["receivedAt", "formType", ...Object.keys(payload)] };
}

async function getAccessToken(): Promise<string> {
  const auth = new GoogleAuth({
    credentials: { client_email: SERVICE_ACCOUNT_EMAIL, private_key: PRIVATE_KEY },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("Failed to obtain Google access token");
  return token.token;
}

async function sheetExists(accessToken: string, tab: string): Promise<boolean> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`Failed to read spreadsheet metadata: ${res.status} ${await res.text()}`);
  const meta = await res.json();
  const sheets = (meta.sheets ?? []) as { properties: { title: string } }[];
  return sheets.some((s) => s.properties.title === tab);
}

async function createSheetTab(accessToken: string, tab: string, columns: string[]): Promise<void> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tab } } }] }),
  });
  if (!res.ok) throw new Error(`Failed to create sheet tab "${tab}": ${res.status} ${await res.text()}`);
  await appendRow(accessToken, tab, columns);
}

async function appendRow(accessToken: string, tab: string, row: unknown[]): Promise<void> {
  const range = encodeURIComponent(`${tab}!A1`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [row] }),
    },
  );
  if (!res.ok) throw new Error(`Failed to append row to "${tab}": ${res.status} ${await res.text()}`);
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    // Called directly from the browser (src/lib/googleSheets.ts submitLead),
    // same flat shape it already POSTs: { ...formFields, formType, timestamp }.
    const payload = (await req.json()) as Record<string, unknown>;
    const formType = String(payload.formType ?? "");

    const config = SHEET_CONFIG[formType] ?? genericConfig(payload);
    const accessToken = await getAccessToken();

    if (!(await sheetExists(accessToken, config.tab))) {
      await createSheetTab(accessToken, config.tab, config.columns);
    }

    const row = config.columns.map((col) => {
      if (col === "receivedAt") return new Date().toISOString();
      if (col === "formType") return formType;
      return payload[col] ?? "";
    });

    await appendRow(accessToken, config.tab, row);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sheets-sync failed:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
