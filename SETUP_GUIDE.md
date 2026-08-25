# Setup Guide — Radiance Beauty Studio Website

This covers everything needed to go from these files to a live, working site.
Total cost: **₹0**. No paid APIs, no business verification.

Legend used below:
- 🟢 **Fully automatic** — happens with no manual step once set up.
- 🟡 **Manual tap** — one tap by the owner or customer, but no typing/paid API.

---

## 1. Install requirements & generate the site locally

```bash
pip install jinja2
python generate_site.py
```

This reads `config.json` + `templates/index.html.j2` and writes the finished
site into `docs/`. Re-run this any time you change `config.json` (prices,
address, phone number, hours, etc.) or edit the template/CSS.

Open `docs/index.html` directly in a browser to preview locally before you
deploy anything.

Replace the placeholder images in `static/images/gallery-1.jpg`,
`gallery-2.jpg`, `gallery-3.jpg` with real salon photos (same filenames, or
update the filenames referenced in `templates/index.html.j2`), then re-run
the script.

---

## 2. Create the Google Sheet (your free booking database) 🟢

1. Go to [sheets.google.com](https://sheets.google.com) and create a new
   blank spreadsheet. Name it something like **"Radiance Bookings"**.
2. Keep it open — you'll attach the script to it in the next step. You don't
   need to create any columns yourself; the script creates a "Bookings" tab
   with headers automatically on the first submission.

---

## 3. Deploy the Google Apps Script backend 🟢

1. In your new Sheet, click **Extensions → Apps Script**.
2. Delete any starter code in the editor, then paste in the full contents of
   `gas/Code.gs` from this project.
3. At the top of the script, edit these three lines with your real details:
   ```js
   const OWNER_EMAIL = "hello@radiancebeauty.in";
   const OWNER_WHATSAPP_NUMBER = "919876543210";
   const SALON_NAME = "Radiance Beauty Studio";
   ```
4. Click **Deploy → New deployment**.
5. Click the gear icon next to "Select type" and choose **Web app**.
6. Set:
   - **Execute as:** Me (your Google account)
   - **Who has access:** Anyone
7. Click **Deploy**. Google will ask you to authorize the script the first
   time — approve the permissions (it needs access to Sheets and Gmail
   under your own account, which is why "Execute as: Me" is required).
8. Copy the **Web app URL** you're given (looks like
   `https://script.google.com/macros/s/AKfycb.../exec`).
9. Paste that URL into `config.json` under `"gas_web_app_url"`, replacing
   the placeholder text, then re-run `python generate_site.py`.

**Test it:** open the Web app URL directly in a browser. You should see
`{"status":"ok","message":"Radiance Beauty Studio booking endpoint is live."}`.

From now on, every booking form submission will:
- 🟢 Add a row to the "Bookings" tab in your Sheet automatically.
- 🟢 Email you instantly at `OWNER_EMAIL` with all the details, including a
  clickable phone number and a clickable "Message on WhatsApp" link.

> **Note:** if you ever edit `Code.gs` again, you must create a **new
> deployment version** (Deploy → Manage deployments → pencil icon → New
> version) for the changes to go live at the same URL.

---

## 4. Customer-side WhatsApp confirmation 🟡

Fully automatic WhatsApp messages **to customers** require a paid,
verified WhatsApp Business API account (Twilio, Gupshup, or Meta's Cloud
API) — this isn't something a free static site + Apps Script can do, since
WhatsApp doesn't allow businesses to message a number that hasn't messaged
them first, without a paid pre-approved template.

The free workaround already built into the site: after a customer submits
the form, they see an on-screen confirmation plus a **"Confirm on
WhatsApp"** button. Tapping it opens WhatsApp with a pre-filled message
(their name, visit type, date, time, purpose) addressed to your salon
number — they just tap Send. This is instant, free, and needs no setup
beyond your WhatsApp number already being correct in `config.json`.

If you later want fully automatic WhatsApp messages to customers with no
tap required, that's the natural upgrade path — let me know and I can wire
up Twilio or Meta's Cloud API on top of this same Apps Script backend.

---

## 5. Instagram gallery embed 🟢

1. Sign up for a free plan at one of:
   - [SnapWidget](https://snapwidget.com/) (simplest, free tier)
   - [Elfsight](https://elfsight.com/instagram-feed-instagram-widget/)
   - [LightWidget](https://lightwidget.com/)
2. Connect your **public** Instagram account (`@radiancebeauty.in` or your
   real handle) and generate an embed snippet — it'll look like an
   `<iframe>` or `<script>` tag.
3. Paste that snippet as the value of `"instagram_embed_widget_html"` in
   `config.json` (replace the placeholder comment).
4. Re-run `python generate_site.py`.

If you'd rather not use a third-party widget, leave a few photos in
`static/images/` and hand-build a simple grid — ask and I can add that as
an alternative gallery layout.

---

## 6. Google Maps location 🟢

1. Open [Google Maps](https://maps.google.com), search for your salon (or
   drop a pin at the exact spot), and click **Share → Embed a map** to get
   the `src` URL, or right-click the pin → "What's here?" to get the exact
   latitude/longitude.
2. In `config.json`, update:
   - `"map_latitude"` / `"map_longitude"` — the exact coordinates.
   - `"map_embed_src"` — the embed URL (the one ending in `&output=embed`
     works well; you can build it as
     `https://www.google.com/maps?q=<lat>,<lng>&z=16&output=embed`).
3. Re-run `python generate_site.py`. Both the embedded map and the "Get
   Directions" link will now point to your real location, and clicking
   anywhere on the map opens it directly in Google Maps.

---

## 7. Deploy to GitHub Pages 🟢

1. Create a new GitHub repository (public) and push this whole project to
   it, including the generated `docs/` folder.
   ```bash
   git init
   git add .
   git commit -m "Initial salon website"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. On GitHub, go to your repo's **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a
   branch**.
4. Set **Branch** to `main` and the folder to **`/docs`**, then **Save**.
5. GitHub will give you a live URL, typically
   `https://<your-username>.github.io/<your-repo>/`, live within a minute
   or two.

Any time you change `config.json`, the template, or the CSS/JS, re-run
`python generate_site.py`, commit, and push — GitHub Pages redeploys
automatically.

---

## Quick reference: what's automatic vs. manual

| Step | Type | Notes |
|---|---|---|
| Booking saved to Google Sheet | 🟢 Automatic | Happens on every form submit |
| Owner emailed booking details | 🟢 Automatic | Via Gmail, instant |
| Customer sees on-screen confirmation + map link | 🟢 Automatic | No setup needed |
| Customer sends WhatsApp confirmation | 🟡 One tap | No paid API; customer taps "Confirm on WhatsApp" |
| Owner replies/contacts customer on WhatsApp | 🟡 One tap | Click-to-chat link from the booking email |
| Fully automatic WhatsApp to customer (no tap) | 🚫 Future upgrade | Requires paid WhatsApp Business API (Twilio/Meta) |
| Verified payment confirmation | 🚫 Not built (removed from this version) | Would require a payment gateway with webhooks (Razorpay/Cashfree) if added later |
