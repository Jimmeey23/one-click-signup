import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  momenceDashboardFetch,
  momenceFetch,
  momenceReadonlyFetch,
  MOMENCE_HOST_ID,
  type MomenceApiAccount,
} from "./momence.server";
import {
  buildCompatibleMembershipsRequest,
  findCompatibleBoughtMembershipId,
  findMembershipIncompatibility,
  OPEN_BARRE_MEMBERSHIP_ID,
  BENGALURU_INDIRANAGAR_LOCATION_ID,
  BENGALURU_PLASH_PILATES_LOCATION_ID,
  BENGALURU_PLASH_PILATES_TAG_ID,
  isBengaluruLocation,
  type CompatibleMembershipsResponse,
} from "./momence-booking.helpers";

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
    const isBengaluru = isBengaluruLocation(data.locationId);
    const isPlashPilates = data.locationId === BENGALURU_PLASH_PILATES_LOCATION_ID;
    const params = new URLSearchParams({
      page: "0",
      pageSize: isBengaluru ? "200" : "100",
      sortBy: "startsAt",
      sortOrder: "ASC",
      ...(!isPlashPilates ? { locationId: String(data.locationId) } : {}),
      startAfter: start.toISOString(),
      startBefore: end.toISOString(),
      ...(isBengaluru ? { includeCancelled: "false", includeChildLocations: "true" } : {}),
    });
    let payload: HostSession[];
    if (isPlashPilates) {
      const readonlyParams = new URLSearchParams({
        sortBy: "startsAt",
        sortOrder: "ASC",
        dateFrom: start.toISOString(),
        page: "0",
        pageSize: "200",
        timeZone: "Asia/Kolkata",
        grouped: "false",
      });
      readonlyParams.append("locationIds[]", String(BENGALURU_PLASH_PILATES_LOCATION_ID));
      readonlyParams.append("locationIds[]", String(BENGALURU_INDIRANAGAR_LOCATION_ID));
      readonlyParams.append("status[]", "published");
      readonlyParams.append("status[]", "unpublished");
      readonlyParams.append("tagIds[]", String(BENGALURU_PLASH_PILATES_TAG_ID));
      const res = await momenceReadonlyFetch<
        | HostSession[]
        | { payload?: HostSession[] | { sessions?: HostSession[] }; sessions?: HostSession[] }
      >(`/host/33905/sessions?${readonlyParams.toString()}`);
      payload = Array.isArray(res)
        ? res
        : Array.isArray(res.payload)
          ? res.payload
          : res.payload?.sessions ?? res.sessions ?? [];
    } else {
      const res = await momenceFetch<{ payload: HostSession[] }>(
        `/host/sessions?${params.toString()}`,
        {},
        isBengaluru ? "bengaluru" : "default",
      );
      payload = res.payload ?? [];
    }
    const sessions = payload
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
        spotsLeft: s.capacity != null ? Math.max(0, s.capacity - (s.bookingCount ?? 0)) : null,
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

export type BookWithMomenceMembershipInput = z.infer<typeof BookInput> & {
  membershipId: number;
  membershipLabel: string;
  hostId?: number;
  momenceAccount?: MomenceApiAccount;
};

export async function bookSessionWithMomenceMembership({
  membershipId,
  membershipLabel,
  hostId = MOMENCE_HOST_ID,
  momenceAccount = "default",
  ...data
}: BookWithMomenceMembershipInput) {
  let compatibleMemberships: CompatibleMembershipsResponse;
  const compatibilityRequest = buildCompatibleMembershipsRequest(data);
  try {
    compatibleMemberships = await momenceFetch<CompatibleMembershipsResponse>(
      compatibilityRequest.path,
      {
        method: "POST",
        body: JSON.stringify(compatibilityRequest.body),
      },
      momenceAccount,
    );
  } catch (e) {
    throw new Error(
      `Could not verify ${membershipLabel} membership before booking: ${
        e instanceof Error ? e.message : "membership compatibility lookup failed"
      }`,
    );
  }

  const boughtMembershipId = findCompatibleBoughtMembershipId(compatibleMemberships, membershipId);

  if (!boughtMembershipId) {
    const incompatibility = findMembershipIncompatibility(compatibleMemberships, membershipId);
    if (incompatibility) {
      throw new Error(
        `${membershipLabel} membership cannot be used for this class: ${incompatibility}.`,
      );
    }
    throw new Error(
      `No compatible active ${membershipLabel} membership was found for this member and class.`,
    );
  }

  await momenceDashboardFetch(
    `/host/${hostId}/auto-book/member/${data.memberId}/session/${data.sessionId}`,
    {
      method: "POST",
      headers: {
        Referer: `https://momence.com/dashboard/${hostId}/sessions/${data.sessionId}`,
        "X-Origin": `https://momence.com/dashboard/${hostId}/sessions/${data.sessionId}`,
        "X-Idempotence-Key": globalThis.crypto.randomUUID(),
      },
      body: JSON.stringify({
        autoCheckin: false,
        membershipIds: [boughtMembershipId],
        addToWaitlist: false,
        isCapacityOverriden: false,
        isAgeRestrictionOverridden: false,
      }),
    },
  );

  return { booked: true as const, method: "membership-auto-book" as const };
}

export const bookWithMembership = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => BookInput.parse(i))
  .handler(async ({ data }) => {
    return bookSessionWithMomenceMembership({
      ...data,
      membershipId: OPEN_BARRE_MEMBERSHIP_ID,
      membershipLabel: "Open Barre",
    });
  });
