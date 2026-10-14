import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reservationSchema } from "@/lib/validation";

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: { resource: { select: { id: true, name: true, type: true, location: true } } },
      orderBy: { startAt: "asc" },
    });
    return NextResponse.json(reservations);
  } catch {
    return NextResponse.json({ error: "Unable to load reservations. Check the database connection." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid reservation details" }, { status: 400 });

  const { resourceId, startAt, endAt, ...details } = parsed.data;
  if (startAt <= new Date()) {
    return NextResponse.json({ error: "Reservations must start in the future." }, { status: 400 });
  }

  try {
    const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
    if (!resource || !resource.isActive) {
      return NextResponse.json({ error: "This resource is unavailable or inactive." }, { status: 400 });
    }

    // Half-open intervals: an existing booking ending at 10:00 does not conflict with one starting at 10:00.
    const conflict = await prisma.reservation.findFirst({
      where: {
        resourceId,
        status: "CONFIRMED",
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json({ error: "This resource already has a reservation during that time." }, { status: 409 });
    }

    const reservation = await prisma.reservation.create({
      data: { ...details, resourceId, startAt, endAt },
      include: { resource: { select: { id: true, name: true, type: true, location: true } } },
    });
    return NextResponse.json(reservation, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create reservation." }, { status: 500 });
  }
}
