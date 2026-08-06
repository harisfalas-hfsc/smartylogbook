/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  subject?: string
  message?: string
}

const Email = ({ name, subject = 'your message', message = '' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We got your message — Smarty Logbook support</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>We got your message</Heading>
        <Text style={body}>
          {name ? `Hi ${name},` : 'Hi there,'} thanks for reaching out. Our team has your
          request and will reply to this email address as soon as we can.
        </Text>
        <Section style={card}>
          <Text style={label}>Subject</Text>
          <Text style={row}>{subject}</Text>
          {message ? (
            <>
              <Text style={label}>Your message</Text>
              <Text style={quote}>{message}</Text>
            </>
          ) : null}
        </Section>
        <Text style={body}>
          In the meantime, the Smarty Assistant inside the app can often solve things
          instantly — just ask it what went wrong.
        </Text>
        <Hr style={hr} />
        <Text style={muted}>Smarty Logbook — your life, remembered.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'We got your message — Smarty Logbook',
  displayName: 'Support ticket confirmation (to customer)',
  previewData: {
    name: 'Haris',
    subject: 'Cannot see my PDF capture',
    message: 'I uploaded a blood test but the record looks empty.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '28px 24px', maxWidth: '560px' }
const h1 = { color: '#1E3A5F', fontSize: '22px', margin: '0 0 16px' }
const body = { color: '#22262B', fontSize: '15px', lineHeight: '24px', margin: '0 0 16px' }
const card = {
  backgroundColor: '#F4F7FB',
  borderRadius: '14px',
  padding: '16px 18px',
  marginBottom: '18px',
}
const label = { color: '#6B7280', fontSize: '12px', textTransform: 'uppercase' as const, margin: '0 0 4px' }
const row = { color: '#22262B', fontSize: '15px', margin: '0 0 12px' }
const quote = { color: '#22262B', fontSize: '14px', lineHeight: '22px', whiteSpace: 'pre-wrap' as const, margin: 0 }
const hr = { borderColor: '#E5E9F0', margin: '20px 0' }
const muted = { color: '#6B7280', fontSize: '13px', margin: 0 }
