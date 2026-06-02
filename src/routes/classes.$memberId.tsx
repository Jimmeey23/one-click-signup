import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { LOCATIONS } from "@/lib/momence-locations";
import { MomenceWidget } from "@/components/MomenceWidget";

const searchSchema = z.object({
  locationId: z.coerce.number().int().positive().default(LOCATIONS[0].id),
});

const logoUrl = "/Physique57-800x600-1.jpg";

export const Route = createFileRoute("/classes/$memberId")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Your Classes — Physique 57 India" }],
  }),
  component: ClassesPage,
});

// Tag IDs per studio (Open Barre)
const TAG_ID_OPEN_BARRE = "284832";

function ClassesPage() {
  const { memberId } = Route.useParams();
  const { locationId } = Route.useSearch();
  const navigate = Route.useNavigate();

  const currentLoc = LOCATIONS.find((l) => l.id === locationId) ?? LOCATIONS[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="Physique 57"
              className="h-9 w-auto"
            />
          </Link>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Member #{memberId}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-primary-deep font-bold mb-3">
              You're in. Open Barre membership active.
            </p>
            <h1 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05]">
              Book your first class
            </h1>
            <p className="text-muted-foreground mt-3 max-w-lg">
              Live schedule from{" "}
              <span className="text-foreground font-semibold">
                {currentLoc.name}
              </span>
              . Tap any class to book — your Open Barre pass covers it.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {LOCATIONS.map((l) => (
              <button
                key={l.id}
                onClick={() =>
                  navigate({ search: { locationId: l.id }, replace: true })
                }
                className={`px-4 h-10 rounded-full text-xs font-bold uppercase tracking-[0.15em] border transition ${
                  l.id === locationId
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-input hover:bg-accent"
                }`}
              >
                {l.name.split(",")[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-3 md:p-6">
          <MomenceWidget
            key={locationId}
            containerId="ribbon-schedule"
            src="https://momence.com/plugin/host-schedule/host-schedule.js"
            attrs={{
              host_id: "13752",
              teacher_ids: "[]",
              location_ids: `[${locationId}]`,
              tag_ids: `[${TAG_ID_OPEN_BARRE}]`,
              session_type: "class",
              hide_tags: "true",
              default_filter: "show-all",
              locale: "en",
              lock_timezone: "Asia/Kolkata",
            }}
          />
        </div>
      </main>
    </div>
  );
}
