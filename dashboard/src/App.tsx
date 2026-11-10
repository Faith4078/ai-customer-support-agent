import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Toaster } from "@/components/ui/sonner"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { isLoggedIn, logout } from "@/lib/api"
import type { Page } from "@/lib/nav"
import { EventsPage } from "@/pages/events"
import { KnowledgeBasePage } from "@/pages/knowledge-base"
import { LoginPage } from "@/pages/login"
import { OverviewPage } from "@/pages/overview"
import { TicketsPage } from "@/pages/tickets"

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn())
  const [page, setPage] = useState<Page>("overview")

  if (!loggedIn) {
    return (
      <>
        <LoginPage onLogin={() => setLoggedIn(true)} />
        <Toaster />
      </>
    )
  }

  function logOut() {
    logout()
    setLoggedIn(false)
  }

  return (
    <SidebarProvider>
      <AppSidebar page={page} onNavigate={setPage} onLogout={logOut} />
      <SidebarInset>
        <SiteHeader page={page} />
        <div className="flex flex-1 flex-col gap-6 p-6">
          {page === "overview" && <OverviewPage onNavigate={setPage} />}
          {page === "inbox" && <TicketsPage />}
          {page === "activity" && <EventsPage />}
          {page === "knowledge-base" && <KnowledgeBasePage />}
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
