import { Badge } from "@/components/ui/badge"

const STYLES: Record<string, string> = {
  open: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  processing:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  answered:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  processed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  escalated:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  failed:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  skipped: "border-border bg-muted text-muted-foreground",
  closed: "border-border bg-muted text-muted-foreground",
}

const LABELS: Record<string, string> = {
  open: "Open",
  processing: "Processing",
  answered: "Answered",
  processed: "Processed",
  escalated: "Needs a human",
  failed: "Failed",
  skipped: "Skipped",
  closed: "Closed",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={STYLES[status] ?? ""}>
      {LABELS[status] ?? status}
    </Badge>
  )
}
