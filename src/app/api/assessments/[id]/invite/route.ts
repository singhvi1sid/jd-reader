import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { connectDB } from "@/lib/mongodb";
import { Assessment } from "@/lib/models/assessment";

function getTransporter() {
  const user = process.env.GMAIL_USER
    ?.trim()
    .replace(/^['"]|['"]$/g, "");
  const pass = process.env.GMAIL_APP_PASSWORD
    ?.trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\s+/g, "");
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { emails } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "At least one email is required" }, { status: 400 });
    }

    const transporter = getTransporter();
    if (!transporter) {
      return NextResponse.json(
        { error: "Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in environment." },
        { status: 500 }
      );
    }

    await connectDB();
    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (assessment.status !== "finalized" || !assessment.accessCode) {
      return NextResponse.json({ error: "Assessment must be finalized before sharing" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const testLink = `${baseUrl}/test/${assessment.accessCode}`;
    const companyName = assessment.companyName || "";
    const hasCompany = companyName.length > 0;
    const questionCount = assessment.questions.length;
    const timeLimit = assessment.timeLimit;

    const subject = `Assessment Invitation: ${assessment.jobTitle}${hasCompany ? ` at ${companyName}` : ""}`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#18181b;border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden;">
        
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">You're Invited to Take an Assessment</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">for the role of <strong>${assessment.jobTitle}</strong>${hasCompany ? ` at <strong>${companyName}</strong>` : ""}</p>
        </td></tr>

        <tr><td style="padding:32px 40px;">
          <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Hello,<br><br>
            You have been invited to complete an assessment for the <strong style="color:#e4e4e7;">${assessment.jobTitle}</strong> position${hasCompany ? ` at <strong style="color:#e4e4e7;">${companyName}</strong>` : ""}. This assessment has been specifically tailored to evaluate skills relevant to the role.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#27272a;border-radius:12px;margin-bottom:24px;">
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
                <span style="color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Questions</span>
                <p style="margin:4px 0 0;color:#e4e4e7;font-size:16px;font-weight:600;">${questionCount} questions</p>
              </td>
              <td style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
                <span style="color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Time Limit</span>
                <p style="margin:4px 0 0;color:#e4e4e7;font-size:16px;font-weight:600;">${timeLimit} minutes</p>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding:16px 20px;">
                <span style="color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Access Code</span>
                <p style="margin:4px 0 0;color:#a78bfa;font-size:24px;font-weight:700;letter-spacing:4px;font-family:monospace;">${assessment.accessCode}</p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${testLink}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;">
                Start Assessment
              </a>
            </td></tr>
          </table>

          <p style="color:#71717a;font-size:13px;line-height:1.6;margin:24px 0 0;">
            Or copy this link into your browser:<br>
            <a href="${testLink}" style="color:#a78bfa;text-decoration:none;word-break:break-all;">${testLink}</a>
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#27272a;border-radius:12px;margin-top:24px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 8px;color:#e4e4e7;font-size:13px;font-weight:600;">Before you begin:</p>
              <ul style="margin:0;padding-left:18px;color:#a1a1aa;font-size:13px;line-height:1.8;">
                <li>Find a quiet environment with stable internet</li>
                <li>The timer starts when you click "Start Assessment"</li>
                <li>Your progress is auto-saved every 30 seconds</li>
                <li>You cannot pause once started</li>
              </ul>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;color:#52525b;font-size:12px;text-align:center;">
            Sent via AssessAI — AI-Powered Assessment Platform
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const results = [];
    for (const email of emails) {
      const trimmed = email.trim();
      try {
        await transporter.sendMail({
          from: `AssessAI <${process.env.GMAIL_USER}>`,
          to: trimmed,
          subject,
          html,
        });
        results.push({ email: trimmed, sent: true });
      } catch (emailErr) {
        console.error(`Failed to send to ${trimmed}:`, emailErr);
        results.push({ email: trimmed, sent: false, error: emailErr instanceof Error ? emailErr.message : "Send failed" });
      }
    }

    const sentCount = results.filter((r) => r.sent).length;
    if (sentCount === 0) {
      const firstError = results.find((r) => !r.sent && "error" in r)?.error;
      return NextResponse.json(
        {
          error: "Failed to send invitations. Check Gmail app password and sender account settings.",
          details: firstError,
          sent: 0,
          total: emails.length,
          results,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ sent: sentCount, total: emails.length, results });
  } catch (error) {
    console.error("Invite failed:", error);
    return NextResponse.json({ error: "Failed to send invitations" }, { status: 500 });
  }
}
