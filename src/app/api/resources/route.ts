import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resourceSchema } from "@/lib/validation";

export async function GET() {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: { _count: { select: { reservations: true } } },
    });
    return NextResponse.json(resources);
  } catch {
    return NextResponse.json({ error: "Unable to load resources. Check the database connection." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = resourceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid resource details" }, { status: 400 });

  try {
    const resource = await prisma.resource.create({ data: { ...parsed.data, description: parsed.data.description || null } });
    return NextResponse.json(resource, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create resource." }, { status: 500 });
  }
}
