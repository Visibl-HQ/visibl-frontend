import type { MemoryPinRead } from "@/lib/api/types"

const PIN_TYPES = new Set<MemoryPinRead["pin_type"]>([
  "fact",
  "founder_claim",
  "metric",
  "customer_quote",
  "validation_signal",
  "assumption",
  "risk",
  "insight",
  "investor_objection",
  "contradiction",
  "decision",
  "open_question",
  "task",
  "source_reference",
  "artifact_relevant_claim",
  "note",
])

const PIN_STATUSES = new Set<MemoryPinRead["status"]>([
  "suggested",
  "confirmed",
  "edited",
  "promoted",
  "archived",
])

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null
  }

  return value as Record<string, unknown>
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function buildPayload(
  pinType: MemoryPinRead["pin_type"],
  raw: Record<string, unknown>
): MemoryPinRead["payload"] {
  const payload = asRecord(raw.payload)

  if (pinType === "metric") {
    return {
      value:
        readString(payload?.value) ??
        readString(raw.content) ??
        readString(raw.title) ??
        "",
      label: readString(payload?.label) ?? readString(raw.title) ?? "Metric",
    }
  }

  return {
    content:
      readString(payload?.content) ??
      readString(raw.content) ??
      readString(raw.title) ??
      "",
  }
}

/** Tolerates legacy pin snapshots that still use `id` instead of `public_id`. */
export function normalizeMemoryPin(raw: unknown): MemoryPinRead | null {
  const record = asRecord(raw)

  if (!record) {
    return null
  }

  const publicId =
    readString(record.public_id) ?? readString(record.id) ?? readString(record.pin_id)

  if (!publicId) {
    return null
  }

  const pinTypeRaw = readString(record.pin_type) ?? "note"
  const pin_type = PIN_TYPES.has(pinTypeRaw as MemoryPinRead["pin_type"])
    ? (pinTypeRaw as MemoryPinRead["pin_type"])
    : "note"

  const statusRaw = readString(record.status) ?? "confirmed"
  const status = PIN_STATUSES.has(statusRaw as MemoryPinRead["status"])
    ? (statusRaw as MemoryPinRead["status"])
    : "confirmed"

  const createdAt =
    readString(record.created_at) ?? new Date(0).toISOString()
  const updatedAt = readString(record.updated_at) ?? createdAt

  return {
    public_id: publicId,
    conversation_public_id:
      readString(record.conversation_public_id) ??
      readString(record.conversation_id) ??
      "",
    pin_type,
    payload: buildPayload(pin_type, record),
    is_archived: Boolean(record.is_archived),
    status,
    title: readString(record.title),
    content: readString(record.content),
    field_key: readString(record.field_key),
    source_message_public_id:
      readString(record.source_message_public_id) ??
      readString(record.source_message_id),
    source_document_id: readString(record.source_document_id),
    source_document_label: readString(record.source_document_label),
    created_at: createdAt,
    updated_at: updatedAt,
  }
}

export function normalizeMemoryPins(rawPins: unknown): MemoryPinRead[] {
  if (!Array.isArray(rawPins)) {
    return []
  }

  return rawPins
    .map((pin) => normalizeMemoryPin(pin))
    .filter((pin): pin is MemoryPinRead => pin !== null)
}
