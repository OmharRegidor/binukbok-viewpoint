import { BookingStatus } from "@prisma/client";
import { prisma } from "../prisma";
import { addDays, DAY_MS, manilaToday } from "./dates";

// Availability-calendar reads for the admin Calendar page. Everything here is LIVE,
// derived from real room_units + bookings — no mock data.
//
// Date convention (see lib/db/dates.ts): DATE columns come back as UTC-midnight
// Dates; a "Manila calendar date" is represented as a UTC-midnight Date so it
// compares directly against check_in / check_out.

// Bookings in these states no longer hold their unit, so they don't count as occupancy.
const RELEASED_STATES: BookingStatus[] = [BookingStatus.CANCELLED, BookingStatus.EXPIRED];
// A real expected guest arriving / a guest leaving (drives the day badges + Today's Activity).
const ARRIVAL_STATES: BookingStatus[] = [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN];
const DEPARTURE_STATES: BookingStatus[] = [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.COMPLETED];

// Days since the most recent Monday (0 = Monday … 6 = Sunday).
function mondayOffset(d: Date): number {
  return (d.getUTCDay() + 6) % 7;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function paramFor(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

// Parse a "YYYY-MM" param into a {year, monthIndex}; fall back to the current
// Manila month if the param is missing or malformed.
function parseMonthParam(param: string | undefined): { year: number; monthIndex: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(param ?? "");
  if (m) {
    const year = Number(m[1]);
    const monthIndex = Number(m[2]) - 1;
    if (year >= 1970 && year <= 9999 && monthIndex >= 0 && monthIndex <= 11) {
      return { year, monthIndex };
    }
  }
  const today = manilaToday();
  return { year: today.getUTCFullYear(), monthIndex: today.getUTCMonth() };
}

export type CalendarDay = {
  date: string; // "YYYY-MM-DD" (Manila calendar date)
  day: number; // day-of-month
  inMonth: boolean; // false for leading/trailing padding days
  isToday: boolean;
  isPast: boolean;
  totalUnits: number;
  bookedUnits: number; // physical units occupied that night
  freeUnits: number;
  arrivals: number; // guests checking in that day
  departures: number; // guests checking out that day
};

export type CalendarMonth = {
  year: number;
  month: number; // 1-12
  label: string; // e.g. "October 2024"
  prevParam: string; // "YYYY-MM" for the previous month
  nextParam: string;
  todayParam: string;
  isCurrentMonth: boolean;
  totalUnits: number;
  weeks: CalendarDay[][]; // rows of 7, Monday-first
};

const monthLabelFmt = new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric", timeZone: "UTC" });

// Per-day availability + arrivals/departures for a whole month grid (Monday-first,
// padded to full weeks). One bookings query covers the visible grid; the per-day
// math runs in memory (≤42 days × a handful of bookings).
export async function getCalendarMonth(monthParam?: string, today: Date = manilaToday()): Promise<CalendarMonth> {
  const { year, monthIndex } = parseMonthParam(monthParam);

  const monthStart = new Date(Date.UTC(year, monthIndex, 1));
  const monthLastDay = new Date(Date.UTC(year, monthIndex + 1, 0)); // day 0 of next month = last of this
  const gridStart = addDays(monthStart, -mondayOffset(monthStart));
  const gridEnd = addDays(monthLastDay, 6 - mondayOffset(monthLastDay)); // Sunday of the last week
  const gridEndExclusive = addDays(gridEnd, 1);

  const [totalUnits, bookings] = await Promise.all([
    prisma.roomUnit.count({ where: { status: "ACTIVE" } }),
    prisma.booking.findMany({
      where: {
        status: { notIn: RELEASED_STATES },
        roomUnit: { status: "ACTIVE" }, // count only against the units in totalUnits
        checkIn: { lt: gridEndExclusive },
        checkOut: { gt: gridStart },
      },
      select: { checkIn: true, checkOut: true, status: true },
    }),
  ]);

  // Pre-extract timestamps once.
  const rows = bookings.map((b) => ({ in: b.checkIn.getTime(), out: b.checkOut.getTime(), status: b.status }));

  const totalDays = Math.round((gridEndExclusive.getTime() - gridStart.getTime()) / DAY_MS);
  const days: CalendarDay[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(gridStart, i);
    const t = d.getTime();

    let bookedUnits = 0;
    let arrivals = 0;
    let departures = 0;
    for (const b of rows) {
      if (b.in <= t && b.out > t) bookedUnits++; // occupies this night
      if (b.in === t && ARRIVAL_STATES.includes(b.status)) arrivals++;
      if (b.out === t && DEPARTURE_STATES.includes(b.status)) departures++;
    }

    days.push({
      date: ymd(d),
      day: d.getUTCDate(),
      inMonth: d.getUTCMonth() === monthIndex && d.getUTCFullYear() === year,
      isToday: t === today.getTime(),
      isPast: t < today.getTime(),
      totalUnits,
      bookedUnits: Math.min(bookedUnits, totalUnits),
      freeUnits: Math.max(totalUnits - bookedUnits, 0),
      arrivals,
      departures,
    });
  }

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const prevYear = monthIndex === 0 ? year - 1 : year;
  const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
  const nextYear = monthIndex === 11 ? year + 1 : year;
  const nextMonthIndex = monthIndex === 11 ? 0 : monthIndex + 1;

  return {
    year,
    month: monthIndex + 1,
    label: monthLabelFmt.format(monthStart),
    prevParam: paramFor(prevYear, prevMonthIndex),
    nextParam: paramFor(nextYear, nextMonthIndex),
    todayParam: paramFor(today.getUTCFullYear(), today.getUTCMonth()),
    isCurrentMonth: today.getUTCFullYear() === year && today.getUTCMonth() === monthIndex,
    totalUnits,
    weeks,
  };
}

export type TodayStats = {
  arrivals: number;
  departures: number;
  totalUnits: number;
  occupied: number;
  free: number;
  occupancyPct: number;
};

// Live "Today's Activity" + room status for the sidebar (always about *today*,
// regardless of which month is being viewed).
export async function getTodayStats(today: Date = manilaToday()): Promise<TodayStats> {
  const next = addDays(today, 1);

  const [totalUnits, occupied, arrivals, departures] = await Promise.all([
    prisma.roomUnit.count({ where: { status: "ACTIVE" } }),
    // One non-released booking on an ACTIVE unit == one occupied unit (the EXCLUDE
    // constraint forbids two overlapping bookings on the same unit). Scoping to ACTIVE
    // keeps `occupied` in the same population as `totalUnits` so `free` can't go negative.
    prisma.booking.count({ where: { status: { notIn: RELEASED_STATES }, roomUnit: { status: "ACTIVE" }, checkIn: { lte: today }, checkOut: { gt: today } } }),
    prisma.booking.count({ where: { status: { in: ARRIVAL_STATES }, checkIn: { gte: today, lt: next } } }),
    prisma.booking.count({ where: { status: { in: DEPARTURE_STATES }, checkOut: { gte: today, lt: next } } }),
  ]);

  const free = Math.max(totalUnits - occupied, 0);
  const occupancyPct = totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : 0;
  return { arrivals, departures, totalUnits, occupied, free, occupancyPct };
}

// Guests due to arrive today who are confirmed but not yet checked in.
export async function getPendingCheckIns(today: Date = manilaToday()) {
  const next = addDays(today, 1);
  return prisma.booking.findMany({
    where: { status: BookingStatus.CONFIRMED, checkIn: { gte: today, lt: next } },
    orderBy: { checkIn: "asc" },
    take: 8,
    select: {
      id: true,
      confirmationCode: true,
      checkIn: true,
      guest: { select: { fullName: true } },
      roomUnit: { select: { label: true, roomType: { select: { name: true } } } },
    },
  });
}

export type PendingCheckIn = Awaited<ReturnType<typeof getPendingCheckIns>>[number];
