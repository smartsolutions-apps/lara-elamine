/**
 * Lara El Amine - website contact form handler
 * =============================================
 * Receives the enquiry form on lara-elamine.web.app and emails it to Lara.
 *
 * This file is kept in the repo on purpose. The script itself lives in Google
 * Drive under Amr's Google account, which is easy to lose track of - if it ever
 * disappears, or needs changing, this is the source of truth. Paste it back in.
 *
 * SETUP (one time, ~5 minutes) - see README.md for the full walkthrough.
 *   1. https://script.google.com/home/projects/create
 *   2. Replace everything in the editor with this file, then Save.
 *   3. Deploy > New deployment > type "Web app"
 *        Execute as:   Me
 *        Who has access: Anyone            <- must be "Anyone", not "Anyone with Google account"
 *   4. Authorise. Google shows an "unverified app" warning because the script is
 *      your own and unpublished: Advanced > Go to <project name> (unsafe).
 *      It is your script sending your own mail - the warning is expected.
 *   5. Copy the Web app URL (ends in /exec) and paste it into
 *      public/assets/js/main.js as FORM_ENDPOINT.
 *
 * To verify it deployed: open the /exec URL in a browser. A GET returns a small
 * JSON "handler is live" response.
 *
 * Quota: consumer Gmail allows 100 recipients/day for MailApp. Not a constraint here.
 */

/** Where enquiries go. Change this one line to redirect them. */
var TO = 'Laraelamine@live.com';

/** Shown in the email so Lara can tell where an enquiry originated. */
var SITE = 'lara-elamine.web.app';

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};

    // Honeypot. The form carries a hidden "website" field that is invisible to
    // people and irresistible to bots. Anything in it means the sender is not
    // human - return success so the bot gets no signal to iterate against.
    if (String(p.website || '').trim() !== '') {
      return json({ ok: true });
    }

    var name = clean(p.name);
    var email = clean(p.email);
    if (!name || !email) {
      return json({ ok: false, error: 'Missing name or email.' });
    }

    var interest = clean(p.interest) || 'General enquiry';
    var org = clean(p.organisation) || '-';
    var contactType = clean(p.contactType) || '-';
    var message = clean(p.message);

    var body = [
      'New enquiry from ' + SITE,
      '',
      'Contacting as:  ' + contactType,
      'Name:           ' + name,
      'Email:          ' + email,
      'Organisation:   ' + org,
      'Interested in:  ' + interest,
      '',
      'Message:',
      message,
      '',
      '-',
      'Sent automatically by the website contact form.',
      'Replying to this email goes straight back to ' + name + '.'
    ].join('\n');

    MailApp.sendEmail({
      to: TO,
      subject: 'Website enquiry - ' + interest + ' (' + name + ')',
      body: body,
      name: 'Lara El Amine website',
      // So Lara can just hit Reply and answer the enquirer directly.
      replyTo: email
    });

    return json({ ok: true });

  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** Opening the /exec URL in a browser confirms the deployment is live. */
function doGet() {
  return json({ ok: true, status: 'Contact form handler is live.' });
}

/** Trim and cap every field, so a bot cannot post a megabyte into an email. */
function clean(v) {
  return String(v == null ? '' : v).trim().slice(0, 4000);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
