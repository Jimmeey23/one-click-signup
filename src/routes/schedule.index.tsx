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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/">
            <img src={logoUrl} alt="Physique 57" className="h-8 w-auto" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-[44px] leading-none tracking-[-0.01em] sm:text-[56px]">
          Schedule
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Pick a studio to see its classes.</p>

        {cities.map((city) => (
          <section key={city} className="mt-10">
            <h2 className="text-[15px] font-semibold">{city}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {studios
                .filter((s) => s.location.city === city)
                .map(({ slug, location }) => (
                  <div key={slug} className="rounded-2xl border border-border bg-card p-5">
                    <Link
                      to="/schedule/$studio"
                      params={{ studio: slug }}
                      className="text-xl font-semibold tracking-[-0.01em] hover:text-primary-deep"
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
                        className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
                      >
                        All classes
                      </Link>
                      {classTypeOptionsForLocation(location.id).map((key) => (
                        <Link
                          key={key}
                          to="/schedule/$studio"
                          params={{ studio: slug }}
                          search={{ format: key }}
                          className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground/80 hover:border-foreground/30 hover:text-foreground"
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
