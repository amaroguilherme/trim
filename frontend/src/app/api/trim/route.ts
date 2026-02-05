import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // To prevent the api from blocking the proxy.
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(',')[0] : "127.0.0.1";

    const res = await fetch(`${process.env.FLASK_API_URL}/api/v1/trim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
        'X-Forwarded-For': ip 
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Communication error with the optimization server.", details: error.message },
      { status: 502 }
    );
  }
}