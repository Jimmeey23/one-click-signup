import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { Footer } from "@/components/Footer";
import { classFormatForKey, classTypeOptionsForLocation } from "@/lib/class-formats";
import { listScheduleStudios } from "@/lib/studio-schedule.helpers";

const logoUrl = "/physique57-logo.png";

export const Route = createFileRoute("/schedule/")({
  head: () => ({
    meta: [
      { title: "Class Schedules - Physique 57 India" },
      {
        name: "description",
        content: "Browse upcoming classes at every Physique 57 studio in Mumbai and Bengaluru.",
      },
    ],
  }),
  component: ScheduleIndexPage,
});

function ScheduleIndexPage() {
  const studios = listScheduleStudios();
  const cities = [...new Set(studios.map((s) => s.location.city))];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <Link to="/">
            <img src={logoUrl} alt="Physique 57" className="h-9 w-auto" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-deep">
          Class schedules
        </p>
        <h1 className="font-display mt-1 text-4xl italic tracking-[-0.01em] md:text-5xl">
          Pick your studio
        </h1>

        {cities.map((city) => (
          <section key={city} className="mt-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {city}
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {studios
                .filter((s) => s.location.city === city)
                .map(({ slug, location }) => (
                  <div
                    key={slug}
                    className="rounded-[22px] border border-border bg-card p-5 shadow-[var(--shadow-card)]"
                  >
                    <Link
                      to="/schedule/$studio"
                      params={{ studio: slug }}
                      className="font-display text-2xl italic tracking-[-0.01em] hover:text-primary-deep"
                    >
                      {location.name.split(",")[0]}
                    </Link>
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPin
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary-deep"
                        aria-hidden="true"
                      />
                      {location.address}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        to="/schedule/$studio"
                        params={{ studio: slug }}
                        className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
                      >
                        All classes
                      </Link>
                      {classTypeOptionsForLocation(location.id).map((key) => (
                        <Link
                          key={key}
                          to="/schedule/$studio"
                          params={{ studio: slug }}
                          search={{ format: key }}
                          className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground/80 hover:border-primary-deep hover:text-primary-deep"
                        >
                          {classFormatForKey(key).name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </main>

      <Footer />
    </div>
  );
}
