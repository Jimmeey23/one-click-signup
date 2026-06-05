export type MonthCalendarDay = {
  date: Date;
  inCurrentMonth: boolean;
};

export type MonthCalendarWeek = MonthCalendarDay[];

const DAYS_IN_WEEK = 7;

export function addCalendarDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addCalendarMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months, 1);
  return next;
}

export function startOfCalendarMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

export function buildMonthCalendarWeeks(monthAnchor: Date): MonthCalendarWeek[] {
  const monthStart = startOfCalendarMonth(monthAnchor);
  const nextMonthStart = addCalendarMonths(monthStart, 1);
  const calendarStart = addCalendarDays(monthStart, -monthStart.getDay());
  const daysToRender =
    Math.ceil((nextMonthStart.getTime() - calendarStart.getTime()) / 86_400_000 / DAYS_IN_WEEK) *
    DAYS_IN_WEEK;

  return Array.from({ length: daysToRender / DAYS_IN_WEEK }, (_, weekIndex) =>
    Array.from({ length: DAYS_IN_WEEK }, (_, dayIndex) => {
      const date = addCalendarDays(calendarStart, weekIndex * DAYS_IN_WEEK + dayIndex);
      return {
        date,
        inCurrentMonth: date.getMonth() === monthStart.getMonth(),
      };
    }),
  );
}
