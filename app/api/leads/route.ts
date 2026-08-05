// app/api/leads/route.ts
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Resend } from "resend";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || "Sheet1!A:G";
const SERVICE_ACCOUNT_KEY_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const OWNER_NOTIFICATION_EMAIL = process.env.OWNER_NOTIFICATION_EMAIL;

function missingEnv(name: string) {
  return new Error(`Missing required environment variable: ${name}`);
}

export async function POST(request: Request) {
  try {
    if (!SHEET_ID) throw missingEnv("GOOGLE_SHEET_ID");
    if (!SERVICE_ACCOUNT_KEY_PATH) throw missingEnv("GOOGLE_SERVICE_ACCOUNT_KEY_PATH");
    if (!RESEND_API_KEY) throw missingEnv("RESEND_API_KEY");
    if (!RESEND_FROM_EMAIL) throw missingEnv("RESEND_FROM_EMAIL");
    if (!OWNER_NOTIFICATION_EMAIL) throw missingEnv("OWNER_NOTIFICATION_EMAIL");

    const body = await request.json();
    const name = body.name ?? "";
    const phone = body.phone ?? "";
    const email = body.email ?? "";
    const location = body.location ?? "";
    const message = body.message ?? "";
    const propertyId = body.propertyId ?? "";

    const serviceAccountPath = path.resolve(process.cwd(), SERVICE_ACCOUNT_KEY_PATH);
    console.log("lead_step", "service_account_path", serviceAccountPath);

    let credentialsJson: string;
    try {
      credentialsJson = fs.readFileSync(serviceAccountPath, "utf8");
    } catch (err) {
      console.error("lead_error", "read_service_account_file", err);
      throw new Error(`Unable to read service account key file at ${serviceAccountPath}`);
    }

    let credentials;
    try {
      credentials = JSON.parse(credentialsJson);
    } catch (err) {
      console.error("lead_error", "parse_service_account_json", err);
      throw new Error("Unable to parse JSON from GOOGLE_SERVICE_ACCOUNT_KEY_PATH");
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Initialize headers if they don't exist
    try {
      const headerCheckResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A1:G1",
      });

      if (!headerCheckResponse.data.values || headerCheckResponse.data.values.length === 0) {
        const headers = [["Timestamp", "Name", "Phone", "Email", "Location", "Message", "Property ID"]];
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: "Sheet1!A1:G1",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: headers },
        });
        console.log("lead_step", "headers_initialized");
      }
    } catch (err) {
      console.warn("lead_step", "header_check_failed", err);
    }

    const timestamp = new Date().toISOString();
    const values = [[timestamp, name, phone, email, location, message, propertyId]];

    console.log("lead_step", "before_sheet_append", {
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
      values: values[0],
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    console.log("lead_step", "sheet_append_success");

    const resend = new Resend(RESEND_API_KEY);
    const html = `
      <h1>New Enquiry Received</h1>
      <p><strong>Name:</strong> ${name || "(not provided)"}</p>
      <p><strong>Phone:</strong> ${phone || "(not provided)"}</p>
      <p><strong>Email:</strong> ${email || "(not provided)"}</p>
      <p><strong>Location:</strong> ${location || "(not provided)"}</p>
      <p><strong>Property ID:</strong> ${propertyId || "(not provided)"}</p>
      <p><strong>Message:</strong><br/>${message || "(not provided)"}</p>
      <p><em>Received at ${timestamp}</em></p>
    `;

    console.log("lead_step", "before_resend_send", { from: RESEND_FROM_EMAIL, to: OWNER_NOTIFICATION_EMAIL });
    const resendResponse = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: OWNER_NOTIFICATION_EMAIL,
      subject: `New lead from ${name || "website"}`,
      html,
    });
    console.log("lead_step", "resend_success", resendResponse);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("lead error", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
