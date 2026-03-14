import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;
    // #region agent log
    fetch('http://127.0.0.1:7754/ingest/f9ecae41-8d2e-4030-8549-ba19d6e46d59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c47cc6'},body:JSON.stringify({sessionId:'c47cc6',location:'register/route.ts:entry',message:'Register attempt',data:{hasEmail:!!email,hasPassword:!!password,dbUrlPresent:!!process.env.DATABASE_URL,dbUrlPrefix:process.env.DATABASE_URL?.slice(0,40)??'MISSING'},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: name ?? null },
    });
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (e) {
    console.error("Register error:", e);
    // #region agent log
    fetch('http://127.0.0.1:7754/ingest/f9ecae41-8d2e-4030-8549-ba19d6e46d59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c47cc6'},body:JSON.stringify({sessionId:'c47cc6',location:'register/route.ts:catch',message:'Registration error',data:{errorMessage:(e instanceof Error ? e.message : String(e)),errorCode:(e as Record<string,unknown>)?.code,errorName:(e instanceof Error ? e.name : undefined),dbUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:([^@]+)@/,':*****@').slice(0,80) : 'MISSING'},timestamp:Date.now(),hypothesisId:'A-B-C-D'})}).catch(()=>{});
    // #endregion
    const errorMsg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Registration failed", detail: errorMsg },
      { status: 500 }
    );
  }
}
