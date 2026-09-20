# lara-elamine

Website for Lara El Amine — executive coach, human capital consultant, HR leader.

- **Live:** https://lara-elamine.web.app
- **Firebase project:** `lara-elamine` ([console](https://console.firebase.google.com/u/0/project/lara-elamine/overview))
- **Copy source of truth:** `Lara_El_Amine_Final_Approved_Narrative.docx` (approved 18 Sep 2026)

Hand-written static HTML. No build step, no dependencies, no framework. What is in
`public/` is exactly what is served.

```
public/
  index.html              the whole site, one page
  assets/css/styles.css   one stylesheet, sectioned and commented
  assets/js/main.js       vanilla JS: nav, scroll reveal, contact form
  assets/img/             portrait (jpg + webp), share card, favicon
firebase.json             hosting config — CSP and cache headers live here
docs/contact-form.gs      Google Apps Script that receives the contact form
```

## One language

The site is English-only. An Arabic version was built and then removed at the
client's request; the full translation, RTL layer and language switch are in git
history at `4dd82f7` if it is ever wanted back.

> **If Arabic ever returns, two RTL rules matter.** Never hide anything with a
> negative `left`/`right` — in LTR that is backward overflow and harmlessly
> clipped, but in RTL it becomes real scrollable overflow and pushes the whole
> page off-screen (`.skip-link` and `.hp` show the safe pattern). And never put
> `letter-spacing` on Arabic text; it breaks the joins between letters.

## Run it locally

```bash
python3 -m http.server 8811 --directory public
```

Then open http://localhost:8811.

## Deploy

Preview first — this does not touch the live site:

```bash
firebase hosting:channel:deploy review --expires 7d --project lara-elamine
```

Then to production:

```bash
firebase deploy --only hosting --project lara-elamine
```

> `firebase.json` carries the Content-Security-Policy, HSTS and cache headers.
> Deploying without it silently drops all six security headers.

## Contact form

Enquiries POST to a Google Apps Script web app that emails them to Lara. This was
chosen over Formspree and similar so there is no extra service account to maintain
or lose — the script lives in Google Drive under the owner's existing account.

**Deployed and live.** The script project is *Lara El Amine website - contact form*
in `mywonderbooks@gmail.com`'s Drive; `FORM_ENDPOINT` in `main.js` already points at
it. Enquiries go to the address in `TO` (currently Lara), with reply-to set to the
enquirer so a plain Reply answers them directly.

> **Keep `docs/contact-form.gs` ASCII-only.** The Apps Script editor mangles pasted
> UTF-8 — an em-dash arrives as `,Aî` and would go out in every enquiry subject.

The script source is version-controlled at `docs/contact-form.gs`. If it ever gets
deleted from Drive, paste that file back in and redeploy.

### Re-creating it from scratch (only if the script is lost)

1. https://script.google.com/home/projects/create
2. Replace the editor contents with `docs/contact-form.gs`, then Save.
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (not "Anyone with a Google account" — the site's
     visitors are not signed in, and that setting will reject every enquiry)
4. Authorise it. Google shows an "unverified app" warning because it is your own
   unpublished script: **Advanced → Go to *project name* (unsafe)**. Expected.
5. Copy the Web app URL (ends in `/exec`) into `FORM_ENDPOINT` at the top of
   `public/assets/js/main.js`.
6. Redeploy the site.

Open the `/exec` URL in a browser to confirm the deployment is live — a GET returns
`{"ok":true,"status":"Contact form handler is live."}`.

### Changing where enquiries go

Edit `TO` at the top of `docs/contact-form.gs`, paste into the Apps Script editor,
then **Deploy → Manage deployments → edit → Version: New version**. Creating a *new
deployment* instead would produce a different URL and break the form.

### If `FORM_ENDPOINT` is empty

The form falls back to opening the visitor's own mail app. That fails silently for
anyone using webmail or a phone with no mail account configured — so an empty
endpoint means enquiries are being lost, not queued.

### Known tidy-up

The script project has two leftover Web app deployments from failed first attempts,
alongside the live one described above. They are unlinked, have unguessable URLs and
behave identically, so they are harmless — but archiving them under
**Deploy → Manage deployments** would be tidier.

## History

The original source was lost with a previous laptop and had never been pushed to
git. On 18 Sep 2026 it was recovered byte-for-byte from the deployed Firebase
Hosting site; `firebase.json` was reconstructed from the live response headers.

The first commit is that untouched recovered baseline. Sections removed since —
the Experience timeline, Credentials, Track record and FAQ — are all still there
if they are ever wanted back:

```bash
git show c053a4e:public/index.html
```
