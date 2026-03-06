import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { Recruiter } from "@/lib/models/recruiter";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    await connectDB();

    const existing = await Recruiter.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await Recruiter.create({
      name,
      email,
      passwordHash,
      provider: "credentials",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup failed:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
