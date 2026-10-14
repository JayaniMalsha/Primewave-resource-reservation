import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Context) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "Provide isActive as a boolean." }, { status: 400 });
  }
  try {
    const resource = await prisma.resource.update({ where: { id: params.id }, data: { isActive: body.isActive } });
    return NextResponse.json(resource);
  } catch {
    return NextResponse.json({ error: "Resource not found or could not be updated." }, { status: 404 });
  }
}
