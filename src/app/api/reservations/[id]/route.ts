import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Context) {
  const body = await request.json().catch(() => null);
  if (body?.status !== "CANCELLED") {
    return NextResponse.json({ error: "Only cancellation is supported." }, { status: 400 });
  }
  try {
    const reservation = await prisma.reservation.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
      include: { resource: { select: { id: true, name: true, type: true, location: true } } },
    });
    return NextResponse.json(reservation);
  } catch {
    return NextResponse.json({ error: "Reservation not found or could not be cancelled." }, { status: 404 });
  }
}
