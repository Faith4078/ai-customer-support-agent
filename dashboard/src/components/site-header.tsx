import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { Page } from "@/lib/nav"

const COPY: Record<Page, { title: string; subtitle: string }> = {
  overview: {
    title: "Overview",
    subtitle: "How Relay is handling support today",
  },
  inbox: {
    title: "Inbox",
    subtitle: "Tickets Relay has triaged from the support inbox",
  },
  activity: {
    title: "Activity",
    subtitle: "Every email Relay has picked up, in order",
  },
  "knowledge-base": {
    title: "Knowledge base",
    subtitle: "What Relay reads before it answers a customer",
  },
}

export function SiteHeader({ page }: { page: Page }) {
  const copy = COPY[page]
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold">{copy.title}</h1>
        <p className="truncate text-xs text-muted-foreground">{copy.subtitle}</p>
      </div>
    </header>
  )
}
