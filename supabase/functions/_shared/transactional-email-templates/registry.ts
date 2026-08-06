// deno-lint-ignore-file no-explicit-any
import { template as supportTicketNotification } from './support-ticket-notification.tsx'
import { template as supportTicketConfirmation } from './support-ticket-confirmation.tsx'

export interface TemplateEntry {
  component: (props: any) => any
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, unknown>
  /** Fixed recipient — overrides the caller-provided recipientEmail. */
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'support-ticket-notification': supportTicketNotification,
  'support-ticket-confirmation': supportTicketConfirmation,
}
