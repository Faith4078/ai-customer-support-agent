import { linkify, paragraphs } from "@/lib/format-message"

export function MessageBody({ text }: { text: string }) {
  const blocks = paragraphs(text)

  if (blocks.length === 0) {
    return <p className="text-sm text-muted-foreground italic">(no content)</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, i) => (
        <p key={i} className="text-sm whitespace-pre-wrap">
          {linkify(block).map((part, j) =>
            typeof part === "string" ? (
              <span key={j}>{part}</span>
            ) : (
              <a
                key={j}
                href={part.url}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:opacity-80"
              >
                {part.url}
              </a>
            )
          )}
        </p>
      ))}
    </div>
  )
}
