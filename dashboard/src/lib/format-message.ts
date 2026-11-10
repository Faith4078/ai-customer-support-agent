const URL_PATTERN = /(https?:\/\/[^\s<>"]+)/g

/** Defense-in-depth for messages saved before the backend started stripping these. */
export function stripQuoted(text: string): string {
  const lines: string[] = []
  for (const line of text.split("\n")) {
    if (line.startsWith("On ") && line.trimEnd().endsWith("wrote:")) break
    if (!line.startsWith(">")) lines.push(line)
  }
  return lines.join("\n").trim()
}

export function cleanBody(text: string): string {
  return stripQuoted(text.replace(/\r\n/g, "\n")).trim()
}

export function paragraphs(text: string): string[] {
  return cleanBody(text)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function linkify(text: string): (string | { url: string })[] {
  const parts: (string | { url: string })[] = []
  let lastIndex = 0
  for (const match of text.matchAll(URL_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) parts.push(text.slice(lastIndex, index))
    parts.push({ url: match[0] })
    lastIndex = index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}
