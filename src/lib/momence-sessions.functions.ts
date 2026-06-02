import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { momenceFetch, OPEN_BARRE_MEMBERSHIP_ID } from "./momence.server";

const ListInput = z.object({
  locationId: z.number().int().positive(),
  daysAhead: z.number().int().min(1).max(60).default(14),
});

export type SessionDTO = {
  id: number;
  name: string;
  type: string;
  startsAt: string;
  endsAt: string;
  durationInMinutes: number;
  capacity: number | null;
  bookingCount: number;
  spotsLeft: number | null;
  isCancelled: boolean;
  teacherName: string | null;
  locationName: string | null;
  bannerImageUrl: string | null;
};

type HostSession = {
  id: number;
  name: string;
  type: string;
  startsAt: string;
  endsAt: string;
  durationInMinutes: number;
  capacity: number | null;
  bookingCount: number;
  isCancelled: boolean;
  teacher?: { firstName?: string; lastName?: string } | null;
  inPersonLocation?: { name?: string } | null;
  bannerImageUrl?: string | null;
};

export const listSessions = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => ListInput.parse(i))
  .handler(async ({ data }): Promise<{ sessions: SessionDTO[] }> => {
    const start = new Date();
    const end = new Date(Date.now() + data.daysAhead * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      page: "0",
      pageSize: "100",
      sortBy: "startsAt",
      sortOrder: "ASC",
      locationId: String(data.locationId),
      startAfter: start.toISOString(),
      startBefore: end.toISOString(),
    });
    const res = await momenceFetch<{ payload: HostSession[] }>(
      `/host/sessions?${params.toString()}`,
    );
    const sessions = (res.payload ?? [])
      .filter((s) => !s.isCancelled)
      .map<SessionDTO>((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        durationInMinutes: s.durationInMinutes,
        capacity: s.capacity ?? null,
        bookingCount: s.bookingCount ?? 0,
        spotsLeft:
          s.capacity != null ? Math.max(0, s.capacity - (s.bookingCount ?? 0)) : null,
        isCancelled: s.isCancelled,
        teacherName:
          s.teacher && (s.teacher.firstName || s.teacher.lastName)
            ? `${s.teacher.firstName ?? ""} ${s.teacher.lastName ?? ""}`.trim()
            : null,
        locationName: s.inPersonLocation?.name ?? null,
        bannerImageUrl: s.bannerImageUrl ?? null,
      }));
    return { sessions };
  });

const BookInput = z.object({
  memberId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  homeLocationId: z.number().int().positive(),
});

type BoughtMembership = {
  id: number;
  membershipId: number;
  status?: string;
  isActive?: boolean;
};

export const bookWithMembership = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => BookInput.parse(i))
  .handler(async ({ data }) => {
    // 1. Find Open Barre bought membership for this member
    let boughtMembershipId: number | null = null;
    try {
      const list = await momenceFetch<{ payload: BoughtMembership[] } | BoughtMembership[]>(
        `/host/members/${data.memberId}/bought-memberships`,
      );
      const arr = Array.isArray(list) ? list : (list.payload ?? []);
      const match = arr.find(
        (m) =>
          m.membershipId === OPEN_BARRE_MEMBERSHIP_ID &&
          (m.isActive !== false) &&
          (m.status ?? "active") !== "cancelled",
      );
      boughtMembershipId = match?.id ?? null;
    } catch (e) {
      console.warn("List bought memberships failed:", e instanceof Error ? e.message : e);
    }

    // 2. Try checkout against the membership
    if (boughtMembershipId) {
      try {
        await momenceFetch("/host/checkout", {
          method: "POST",
          body: JSON.stringify({
            memberId: data.memberId,
            homeLocationId: data.homeLocationId,
            items: [
              {
                id: "1",
                type: "session",
                sessionId: data.sessionId,
                attemptedPriceInCurrency: "0",
              },
            ],
            paymentMethods: [
              {
                id: "1",
                type: "membership",
                boughtMembershipId,
              },
            ],
          }),
        });
        return { booked: true as const, method: "membership" as const };
      } catch (e) {
        console.warn(
          "Membership checkout failed, falling back to free add:",
          e instanceof Error ? e.message : e,
        );
      }
    }

    // 3. Fallback — add member to session for free (host override)
    await momenceFetch(`/host/sessions/${data.sessionId}/bookings/free`, {
      method: "POST",
      body: JSON.stringify({ memberId: data.memberId }),
    });
    return { booked: true as const, method: "free-add" as const };
  });
