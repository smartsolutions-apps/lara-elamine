/**
 * Lara El Amine - website contact form handler
 * =============================================
 * Receives the enquiry form on lara-elamine.web.app and emails it to Lara as a
 * formatted lead card.
 *
 * KEEP THIS FILE PLAIN ASCII. The Apps Script editor mangles pasted UTF-8 - an
 * em-dash arrives as ",Ai" and would go out in every enquiry subject line. Use
 * HTML entities (&mdash;, &middot;) in the email markup instead of the literal
 * characters.
 *
 * This file is the source of truth. The script itself lives in Google Drive
 * under Amr's Google account as "Lara El Amine website - contact form"; if it is
 * ever deleted, paste this back in and redeploy.
 *
 * Deployed as a Web app: Execute as Me, Who has access Anyone.
 * After editing: Deploy > Manage deployments > edit > Version: New version.
 * Creating a NEW deployment instead would change the URL and break the form.
 *
 * Quota: consumer Gmail allows 100 recipients/day for MailApp.
 */

/** Where enquiries go. Change this one line to redirect them. */
var TO = 'laraelamine@live.com';

/** Optional extra recipients, comma separated. Leave '' for none. */
var CC = '';

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

    var lead = {
      contactType: clean(p.contactType) || 'Not stated',
      name: name,
      email: email,
      organisation: clean(p.organisation) || 'Not given',
      interest: clean(p.interest) || 'General enquiry',
      message: clean(p.message),
      lang: clean(p.lang) === 'ar' ? 'Arabic' : 'English'
    };

    var subject = 'New enquiry: ' + lead.interest + ' - ' + lead.name;

    MailApp.sendEmail({
      to: TO,
      cc: CC,
      subject: subject,
      body: plainBody(lead),        // fallback for text-only clients
      htmlBody: htmlBody(lead),
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

/* ------------------------------------------------------------------ */
/* Email rendering                                                      */
/* ------------------------------------------------------------------ */

/* Brand tokens, matched to the site's palette. */
var INK = '#211A29';
var ACCENT = '#6E3D74';
var PAPER = '#F1EAF3';
var LINE = '#DFD3E2';
var BODY = '#4B4453';
var MUTED = '#6E6677';

function htmlBody(d) {
  /* Built with tables and inline styles on purpose: email clients strip <style>
     blocks and have patchy flexbox support, so this is the layout that survives
     Outlook, Gmail and Apple Mail alike. */
  var row = function (label, value) {
    return '' +
      '<tr>' +
        '<td style="padding:10px 0;border-bottom:1px solid ' + LINE + ';width:150px;' +
                   'font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:1px;' +
                   'text-transform:uppercase;color:' + MUTED + ';vertical-align:top;">' +
          esc(label) +
        '</td>' +
        '<td style="padding:10px 0;border-bottom:1px solid ' + LINE + ';' +
                   'font:400 15px/1.5 Arial,Helvetica,sans-serif;color:' + INK + ';">' +
          value +
        '</td>' +
      '</tr>';
  };

  var mailto = 'mailto:' + encodeURIComponent(d.email) +
               '?subject=' + encodeURIComponent('Re: your enquiry');

  return '' +
'<!doctype html><html><body style="margin:0;padding:0;background:' + PAPER + ';">' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"' +
      ' style="background:' + PAPER + ';padding:28px 12px;">' +
  '<tr><td align="center">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"' +
          ' style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;' +
                  'overflow:hidden;box-shadow:0 2px 10px rgba(33,26,41,.08);">' +

      /* Header */
      '<tr><td style="background:' + INK + ';padding:22px 28px;">' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
          '<td style="width:44px;vertical-align:middle;">' +
            '<div style="width:40px;height:40px;border-radius:20px;background:' + PAPER + ';' +
                        'text-align:center;line-height:40px;font:700 13px Georgia,serif;' +
                        'color:' + INK + ';">LEA</div>' +
          '</td>' +
          '<td style="padding-left:12px;vertical-align:middle;">' +
            '<div style="font:600 16px/1.3 Georgia,serif;color:#F3EAF5;">Lara El Amine</div>' +
            '<div style="font:400 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:1.4px;' +
                        'text-transform:uppercase;color:#C2A2C9;">New website enquiry</div>' +
          '</td>' +
        '</tr></table>' +
      '</td></tr>' +

      /* Body */
      '<tr><td style="padding:28px;">' +
        '<p style="margin:0 0 20px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:' + BODY + ';">' +
          esc(d.name) + ' got in touch through ' + esc(SITE) + '.' +
        '</p>' +

        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
          row('Contacting as', esc(d.contactType)) +
          row('Name', '<strong>' + esc(d.name) + '</strong>') +
          row('Email', '<a href="mailto:' + esc(d.email) + '" style="color:' + ACCENT + ';">' +
                        esc(d.email) + '</a>') +
          row('Organisation', esc(d.organisation)) +
          row('Interested in', esc(d.interest)) +
          row('Page language', esc(d.lang)) +
        '</table>' +

        '<div style="margin-top:24px;padding:18px 20px;background:#FAF7FB;' +
                    'border-left:3px solid ' + ACCENT + ';border-radius:0 8px 8px 0;">' +
          '<div style="font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:1px;' +
                      'text-transform:uppercase;color:' + MUTED + ';margin-bottom:8px;">Message</div>' +
          '<div style="font:400 15px/1.65 Arial,Helvetica,sans-serif;color:' + INK + ';">' +
            (d.message ? nl2br(esc(d.message)) : '<em style="color:' + MUTED + ';">No message given.</em>') +
          '</div>' +
        '</div>' +

        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">' +
          '<tr><td style="background:' + ACCENT + ';border-radius:100px;">' +
            '<a href="' + mailto + '" style="display:inline-block;padding:13px 28px;' +
               'font:600 14px Arial,Helvetica,sans-serif;color:#ffffff;text-decoration:none;">' +
              'Reply to ' + esc(firstName(d.name)) +
            '</a>' +
          '</td></tr>' +
        '</table>' +

        '<p style="margin:20px 0 0;font:400 13px/1.6 Arial,Helvetica,sans-serif;color:' + MUTED + ';">' +
          'Replying to this email goes straight back to ' + esc(d.name) + '.' +
        '</p>' +
      '</td></tr>' +

      /* Footer */
      '<tr><td style="padding:16px 28px;background:#FAF7FB;border-top:1px solid ' + LINE + ';' +
                     'font:400 12px/1.5 Arial,Helvetica,sans-serif;color:' + MUTED + ';">' +
        'Sent automatically by the contact form on ' + esc(SITE) + '.' +
      '</td></tr>' +

    '</table>' +
  '</td></tr>' +
'</table></body></html>';
}

function plainBody(d) {
  return [
    'New enquiry from ' + SITE,
    '',
    'Contacting as:  ' + d.contactType,
    'Name:           ' + d.name,
    'Email:          ' + d.email,
    'Organisation:   ' + d.organisation,
    'Interested in:  ' + d.interest,
    'Page language:  ' + d.lang,
    '',
    'Message:',
    d.message || '(none given)',
    '',
    '--',
    'Sent automatically by the website contact form.',
    'Replying to this email goes straight back to ' + d.name + '.'
  ].join('\n');
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/** Trim and cap every field, so a bot cannot post a megabyte into an email. */
function clean(v) {
  return String(v == null ? '' : v).trim().slice(0, 4000);
}

/** Enquiry text is untrusted and goes into HTML, so escape it. */
function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Run AFTER esc(), so the tags added here are the only ones in the output. */
function nl2br(v) {
  return String(v).replace(/\r\n|\r|\n/g, '<br>');
}

function firstName(v) {
  return String(v).split(/\s+/)[0] || v;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
