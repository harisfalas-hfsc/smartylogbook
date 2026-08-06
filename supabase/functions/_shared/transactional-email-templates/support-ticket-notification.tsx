/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  email?: string
  subject?: string
  message?: string
  attachmentName?: string
  attachmentUrl?: string
}

const Email = ({
  name = 'A customer',
  email = 'unknown@example.com',
  subject = 'Support request',
  message = '',
  attachmentName,
  attachmentUrl,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`New support ticket from ${name}: ${subject}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New support ticket</Heading>
        <Section style={card}>
          <Text style={row}><strong>From:</strong> {name}</Text>
          <Text style={row}>
            <strong>Email:</strong>{' '}
            <Link href={`mailto:${email}`} style={link}>{email}</Link>
          </Text>
          <Text style={row}><strong>Subject:</strong> {subject}</Text>
        </Section>
        <Text style={label}>Message</Text>
        <Text style={body}>{message}</Text>
        {attachmentName ? (
          <>
            <Hr style={hr} />
            <Text style={row}>
              <strong>Attachment:</strong>{' '}
              {attachmentUrl ? (
                <Link href={attachmentUrl} style={link}>{attachmentName}</Link>
              ) : (
                attachmentName
              )}
            </Text>
          </>
        ) : null}
        <Hr style={hr} />
        <Text style={muted}>
          Reply straight to {email} to answer this customer.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `[Smarty Logbook] ${d?.subject ?? 'New support ticket'}`,
  displayName: 'Support ticket (to you)',
  to: 'smartylogbook@outlook.com',
  previewData: {
    name: 'Haris',
    email: 'customer@example.com',
    subject: 'Cannot see my PDF capture',
    message: 'I uploaded a blood test but the record looks empty.',
    attachmentName: 'screenshot.png',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '28px 24px', maxWidth: '560px' }
const h1 = { color: '#1E3A5F', fontSize: '22px', margin: '0 0 18px' }
const card = {
  backgroundColor: '#F4F7FB',
  borderRadius: '14px',
  padding: '16px 18px',
  marginBottom: '18px',
}
const row = { color: '#22262B', fontSize: '14px', margin: '4px 0' }
const label = { color: '#6B7280', fontSize: '12px', textTransform: 'uppercase' as const, margin: '0 0 6px' }
const body = { color: '#22262B', fontSize: '15px', lineHeight: '24px', whiteSpace: 'pre-wrap' as const, margin: 0 }
const hr = { borderColor: '#E5E9F0', margin: '20px 0' }
const link = { color: '#1E3A5F' }
const muted = { color: '#6B7280', fontSize: '13px', margin: 0 }
