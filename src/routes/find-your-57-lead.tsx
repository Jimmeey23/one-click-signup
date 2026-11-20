import { createFileRoute, redirect } from "@tanstack/react-router";

// Old URL, kept so links already shared still land on the renamed route (UTMs preserved).
export const Route = createFileRoute("/find-your-57-lead")({
  beforeLoad: ({ location }) => {
    throw redirect({ href: `/signup-02${location.searchStr ?? ""}`, statusCode: 301 });
  },
});
