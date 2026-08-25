/**
 * Code.gs — Radiance Beauty Studio booking backend
 * ---------------------------------------------------
 * Free serverless backend for the booking form, built on Google Apps Script.
 * Deploy this bound to a Google Sheet (see SETUP_GUIDE.md for step-by-step
 * instructions). It does two things when a booking comes in:
 *
 *   1. Appends the booking as a new row in the bound Google Sheet.
 *   2. Emails the salon owner instantly with all the booking details,
 *      including clickable tel: and wa.me links.
 *
 * No paid API, no business verification required.
 */

// ---- EDIT THESE THREE VALUES, then Deploy > New deployment > Web app ----
const OWNER_EMAIL = "hello@radiancebeauty.in";      // where booking alerts are sent
const OWNER_WHATSAPP_NUMBER = "919876543210";        // country code + number, no + or spaces
const SALON_NAME = "Radiance Beauty Studio";
// ---------------------------------------------------------------------

const SHEET_NAME = "Bookings";
const SHEET_HEADERS = [
  "Timestamp", "Visit Type", "Name", "Mobile", "Date", "Time", "Purpose"
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    validateBooking(data);

    appendToSheet(data);
    emailOwner(data);

    return jsonResponse({ status: "success" });
  } catch (err) {
    return jsonResponse({ status: "error", message: err.message });
  }
}

// Lets you open the Web App URL directly in a browser to confirm it's live.
function doGet(e) {
  return jsonResponse({ status: "ok", message: SALON_NAME + " booking endpoint is live." });
}

function validateBooking(data) {
  if (!data.name) throw new Error("Missing name");
  if (!data.mobile || !/^[6-9]\d{9}$/.test(data.mobile)) throw new Error("Invalid mobile number");
  if (!data.date) throw new Error("Missing date");
  if (!data.visitType) throw new Error("Missing visit type");
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function appendToSheet(data) {
  const sheet = getSheet();
  sheet.appendRow([
    new Date(),
    data.visitType || "",
    data.name || "",
    data.mobile || "",
    data.date || "",
    data.time || "",
    data.purpose || ""
  ]);
}

function emailOwner(data) {
  const waLink = "https://wa.me/91" + data.mobile;
  const telLink = "tel:+91" + data.mobile;

  const subject = "New Booking: " + data.name + " — " + data.date + (data.time ? " " + data.time : "");

  const htmlBody =
    "<div style='font-family:Arial,sans-serif;font-size:14px;color:#2A2620;line-height:1.6;'>" +
    "<h2 style='color:#16281F;'>New Appointment Booking</h2>" +
    "<table cellpadding='6' style='border-collapse:collapse;'>" +
    row("Visit Type", data.visitType) +
    row("Name", data.name) +
    row("Mobile", "<a href='" + telLink + "'>" + data.mobile + "</a> &nbsp;|&nbsp; <a href='" + waLink + "'>Message on WhatsApp</a>") +
    row("Date", data.date) +
    row("Time", data.time || "Not specified") +
    row("Purpose", data.purpose || "Not specified") +
    "</table>" +
    "<p style='margin-top:18px;color:#5B564C;'>Logged automatically to your Bookings sheet.</p>" +
    "</div>";

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: subject,
    htmlBody: htmlBody,
    body: subject // plain-text fallback
  });
}

function row(label, value) {
  return "<tr><td style='color:#5B564C;font-weight:bold;'>" + label + ":</td><td>" + value + "</td></tr>";
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
