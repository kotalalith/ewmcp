import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["Administrator", "Manager"].includes(role)) {
      return NextResponse.json({ error: "Forbidden: Only Admins and Managers can invite members" }, { status: 403 });
    }

    const { email, assignedRole } = await req.json();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const inviteLink = `http://localhost:3000/register?inviteToken=demo123&email=${encodeURIComponent(email)}&role=${encodeURIComponent(assignedRole)}`;

    const mailOptions = {
      from: `"EWMCP System" <noreply@ewmcp.com>`,
      to: email,
      subject: `Invitation to join EWMCP as ${assignedRole}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>You've been invited!</h2>
          <p>${session.user?.name} has invited you to join the Enterprise Work Management & Collaboration Platform as a <strong>${assignedRole}</strong>.</p>
          <p>Click the link below to set up your account and get started:</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Join Workspace</a>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Invite Email Sent to:", email);

    return NextResponse.json({ message: "Invitation sent successfully!" });
  } catch (error) {
    console.error("Invite Error:", error);
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 });
  }
}
