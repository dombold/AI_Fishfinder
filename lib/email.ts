/**
 * Email utility — nodemailer transport + branded HTML templates.
 *
 * Required env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
 */

import nodemailer from 'nodemailer'
import type { CrowdSummary, SpeciesActivity } from '@/lib/crowd-source-aggregator'

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transporter = createTransport()
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'AI Fishfinder <noreply@aifishfinder.com.au>',
    to,
    subject,
    html,
  })
}

// ---------------------------------------------------------------------------
// Shared layout primitives
// ---------------------------------------------------------------------------

const ABYSS   = '#0B1929'
const DEPTHS  = '#0E2A45'
const CURRENT = '#0A7EA4'
const SEAFOAM = '#3CBFAE'
const SAND    = '#C9A84C'
const FOAM    = '#E8F4F8'
const MIST    = '#6B8FA3'

function emailWrapper(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Fishfinder</title>
</head>
<body style="margin:0;padding:0;background-color:${ABYSS};font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:${ABYSS};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:${DEPTHS};border-radius:12px 12px 0 0;
              padding:32px 40px;text-align:center;
              border-bottom:2px solid ${CURRENT};">
              <p style="margin:0 0 4px 0;font-family:Georgia,serif;font-size:28px;font-weight:700;
                color:${SEAFOAM};letter-spacing:-0.03em;">AI Fishfinder</p>
              <p style="margin:0;font-size:12px;color:${MIST};letter-spacing:0.08em;
                text-transform:uppercase;">Western Australia Fishing Intelligence</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:${DEPTHS};padding:40px;border-radius:0 0 12px 12px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:12px;color:${MIST};">
                AI Fishfinder &mdash; Personalised fishing intelligence for WA waters.
              </p>
              <p style="margin:0;font-size:11px;color:${MIST};opacity:0.7;">
                You're receiving this because you have an account with AI Fishfinder. To Unsubscribe login to Ai Fishfinder, go to your profile and uncheck the Weekly fishing intelligence email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(href: string, label: string): string {
  const appUrl = process.env.NEXTAUTH_URL ?? 'https://aifishfinder.com.au'
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px auto 0;">
    <tr>
      <td align="center" style="background-color:${CURRENT};border-radius:8px;">
        <a href="${appUrl}${href}"
          style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;
          color:${FOAM};text-decoration:none;letter-spacing:0.02em;">${label}</a>
      </td>
    </tr>
  </table>`
}

function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="margin:28px 0;">
    <tr><td style="border-top:1px solid rgba(10,126,164,0.25);font-size:0;">&nbsp;</td></tr>
  </table>`
}

// ---------------------------------------------------------------------------
// Welcome email
// ---------------------------------------------------------------------------

function welcomeEmailHtml(username: string): string {
  const body = `
    <h1 style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:26px;font-weight:700;
      color:${SEAFOAM};letter-spacing:-0.03em;">
      Welcome aboard, ${username}!
    </h1>
    <p style="margin:0 0 24px 0;font-size:14px;color:${MIST};">
      Your account is ready — let's get you on the water.
    </p>

    <p style="margin:0 0 20px 0;font-size:15px;color:${FOAM};line-height:1.7;">
      AI Fishfinder is your personalised fishing intelligence platform for Western Australia.
      Every day we crunch live marine data, tide charts, swell forecasts and crowd-sourced
      sightings to give you a targeted briefing before you leave the dock.
    </p>

    ${divider()}

    <p style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:16px;font-weight:700;
      color:${SAND};letter-spacing:-0.01em;">What you can do</p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding:10px 0;vertical-align:top;width:32px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;
            background-color:${SEAFOAM};margin-top:6px;"></span>
        </td>
        <td style="padding:10px 0;">
          <p style="margin:0;font-size:14px;color:${FOAM};line-height:1.6;">
            <strong style="color:${SEAFOAM};">Live Marine Briefings</strong> &mdash;
            Tides, swell, wind speed, sea temperature and bite windows tailored to your
            chosen location.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;vertical-align:top;width:32px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;
            background-color:${SEAFOAM};margin-top:6px;"></span>
        </td>
        <td style="padding:10px 0;">
          <p style="margin:0;font-size:14px;color:${FOAM};line-height:1.6;">
            <strong style="color:${SEAFOAM};">AI Fishing Plans</strong> &mdash;
            Claude AI analyses all conditions and generates a day-by-day plan covering
            where, when, and what to target.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;vertical-align:top;width:32px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;
            background-color:${SEAFOAM};margin-top:6px;"></span>
        </td>
        <td style="padding:10px 0;">
          <p style="margin:0;font-size:14px;color:${FOAM};line-height:1.6;">
            <strong style="color:${SEAFOAM};">Species &amp; Closures</strong> &mdash;
            WA-specific bag limits, size limits, and current fishing closure alerts
            built into every plan.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;vertical-align:top;width:32px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;
            background-color:${SEAFOAM};margin-top:6px;"></span>
        </td>
        <td style="padding:10px 0;">
          <p style="margin:0;font-size:14px;color:${FOAM};line-height:1.6;">
            <strong style="color:${SEAFOAM};">Crowd Intelligence</strong> &mdash;
            Aggregated catch reports from fellow AI Fishfinder anglers reveal what's
            active in your bioregion right now.
          </p>
        </td>
      </tr>
    </table>

    ${ctaButton('', 'Plan Your First Trip')}
  `
  return emailWrapper(body)
}

export async function sendWelcomeEmail(username: string, email: string): Promise<void> {
  const html = welcomeEmailHtml(username)
  await sendEmail(email, `Welcome aboard, ${username} — AI Fishfinder`, html)
}

// ---------------------------------------------------------------------------
// Password reset email
// ---------------------------------------------------------------------------

function passwordResetEmailHtml(username: string, resetUrl: string): string {
  const body = `
    <h1 style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:26px;font-weight:700;
      color:${SEAFOAM};letter-spacing:-0.03em;">
      Reset your password
    </h1>
    <p style="margin:0 0 24px 0;font-size:14px;color:${MIST};">
      Hi ${username}, we received a request to reset your AI Fishfinder password.
    </p>

    <p style="margin:0 0 20px 0;font-size:15px;color:${FOAM};line-height:1.7;">
      Click the button below to choose a new password. This link expires in
      <strong style="color:${SEAFOAM};">1 hour</strong>.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px auto 0;">
      <tr>
        <td align="center" style="background-color:${CURRENT};border-radius:8px;">
          <a href="${resetUrl}"
            style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;
            color:${FOAM};text-decoration:none;letter-spacing:0.02em;">Reset Password</a>
        </td>
      </tr>
    </table>

    ${divider()}

    <p style="margin:0;font-size:13px;color:${MIST};line-height:1.6;">
      If you didn't request a password reset, you can safely ignore this email —
      your password won't change. If you're concerned, contact us.
    </p>
  `
  return emailWrapper(body)
}

export async function sendPasswordResetEmail(to: string, username: string, resetUrl: string): Promise<void> {
  const html = passwordResetEmailHtml(username, resetUrl)
  await sendEmail(to, 'Reset your AI Fishfinder password', html)
}

// ---------------------------------------------------------------------------
// Weekly crowd digest
// ---------------------------------------------------------------------------

const BIOREGION_LABELS: Record<string, string> = {
  'north-coast': 'North Coast (Pilbara &amp; Kimberley)',
  'gascoyne':    'Gascoyne &amp; Mid West',
  'west-coast':  'West Coast (Perth Metro)',
  'south-coast': 'South Coast (Albany &amp; Esperance)',
}

function trendBadge(trend: SpeciesActivity['trend']): string {
  const map = {
    increasing: { symbol: '&#8593;', color: '#2ECC8A' },
    stable:     { symbol: '&#8594;', color: MIST },
    decreasing: { symbol: '&#8595;', color: '#E05C2A' },
  }
  const { symbol, color } = map[trend]
  return `<span style="color:${color};font-weight:700;margin-left:6px;">${symbol}</span>`
}

function bioregionSection(summary: CrowdSummary): string {
  const label = BIOREGION_LABELS[summary.bioregion] ?? summary.bioregion
  const topThree = summary.topSpecies.slice(0, 3)
  const hotspotCount = summary.hotspots.length
  const totalDataPoints = summary.catchLogCount

  const speciesRows = topThree.map((s, i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid rgba(10,126,164,0.15);">
        <span style="font-size:13px;color:${MIST};">#${i + 1}</span>
        <span style="font-size:14px;color:${FOAM};margin-left:10px;font-weight:600;">
          ${s.species}
        </span>
        ${trendBadge(s.trend)}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid rgba(10,126,164,0.15);
        text-align:right;font-size:13px;color:${MIST};">
        ${s.totalSightings} sightings &bull; ${s.last30Days} this month
      </td>
    </tr>
  `).join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="margin-bottom:24px;background-color:rgba(10,126,164,0.08);
      border-radius:8px;border:1px solid rgba(10,126,164,0.2);overflow:hidden;">
      <tr>
        <td colspan="2" style="padding:14px 20px;
          background-color:rgba(10,126,164,0.15);border-bottom:1px solid rgba(10,126,164,0.2);">
          <p style="margin:0;font-family:Georgia,serif;font-size:15px;font-weight:700;
            color:${SAND};">${label}</p>
          <p style="margin:4px 0 0 0;font-size:12px;color:${MIST};">
            ${totalDataPoints} data points &bull; ${hotspotCount} active hotspot${hotspotCount !== 1 ? 's' : ''}
          </p>
        </td>
      </tr>
      ${topThree.length > 0 ? `
      <tr>
        <td colspan="2" style="padding:4px 20px 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${speciesRows}
          </table>
        </td>
      </tr>` : `
      <tr>
        <td colspan="2" style="padding:16px 20px;">
          <p style="margin:0;font-size:13px;color:${MIST};font-style:italic;">
            No sightings recorded this period.
          </p>
        </td>
      </tr>`}
    </table>
  `
}

function weeklyDigestHtml(summaries: CrowdSummary[]): string {
  const weekStr = new Date().toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const bioregionOrder = ['north-coast', 'gascoyne', 'west-coast', 'south-coast']
  const sorted = bioregionOrder
    .map(id => summaries.find(s => s.bioregion === id))
    .filter((s): s is CrowdSummary => !!s)

  const totalObs = summaries.reduce((n, s) => n + s.catchLogCount, 0)

  const body = `
    <h1 style="margin:0 0 6px 0;font-family:Georgia,serif;font-size:24px;font-weight:700;
      color:${SEAFOAM};letter-spacing:-0.03em;">
      WA Fishing Intelligence
    </h1>
    <p style="margin:0 0 6px 0;font-size:14px;color:${MIST};">
      Weekly crowd-sourced digest &mdash; ${weekStr}
    </p>
    <p style="margin:0 0 28px 0;font-size:13px;color:${MIST};
      background-color:rgba(201,168,76,0.1);border-left:3px solid ${SAND};
      padding:10px 14px;border-radius:0 4px 4px 0;">
      Based on <strong style="color:${SAND};">${totalObs.toLocaleString()} observations</strong>
      from AI Fishfinder anglers across all four WA bioregions.
    </p>

    <p style="margin:0 0 20px 0;font-family:Georgia,serif;font-size:16px;font-weight:700;
      color:${SAND};">This week's activity by region</p>

    ${sorted.map(bioregionSection).join('')}

    <p style="margin:24px 0 0 0;font-size:14px;color:${FOAM};line-height:1.7;">
      Ready to turn this intelligence into an action plan? Generate a personalised
      AI briefing for your next trip — we'll factor in current tides, swell, and
      which species are active right now.
    </p>

    ${ctaButton('', 'Generate My Fishing Plan')}
  `
  return emailWrapper(body)
}

// ---------------------------------------------------------------------------
// Group invite email
// ---------------------------------------------------------------------------

export async function sendGroupInviteEmail(
  to: string,
  groupName: string,
  inviterUsername: string,
): Promise<void> {
  const subject = `${inviterUsername} invited you to join "${groupName}" on AI Fishfinder`
  const body = `
    <h1 style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:24px;font-weight:700;
      color:${SEAFOAM};letter-spacing:-0.03em;">
      You've been invited!
    </h1>
    <p style="margin:0 0 24px 0;font-size:14px;color:${MIST};">
      A fellow AI Fishfinder angler wants you to join their crew.
    </p>

    <p style="margin:0 0 20px 0;font-size:15px;color:${FOAM};line-height:1.7;">
      <strong style="color:${SEAFOAM};">${inviterUsername}</strong> has invited you to join
      the fishing group <strong style="color:${SEAFOAM};">${groupName}</strong>.
      Group members can share catch logs with each other to keep tabs on what's biting.
    </p>

    ${ctaButton('/invites', 'View Invite')}

    ${divider()}

    <p style="margin:0;font-size:13px;color:${MIST};line-height:1.6;">
      Log in and visit <em>Invites</em> in the menu to accept or decline. You can also
      ignore this email — the invite will remain pending until you respond.
    </p>
  `
  await sendEmail(to, subject, emailWrapper(body))
}

export async function sendWeeklyDigest(
  users: Array<{ username: string; email: string }>,
  summaries: CrowdSummary[],
): Promise<{ sent: number; failed: number }> {
  const html = weeklyDigestHtml(summaries)
  const weekStr = new Date().toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const subject = `WA Fishing Intelligence — Week of ${weekStr}`

  let sent = 0
  let failed = 0

  for (const user of users) {
    try {
      await sendEmail(user.email, subject, html)
      sent++
    } catch (err) {
      console.error(`[email] Failed to send digest to ${user.email}:`, err)
      failed++
    }
  }

  return { sent, failed }
}
