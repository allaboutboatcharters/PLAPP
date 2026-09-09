import type { ExtractedPassport } from '../db/dexie'

const API_URL = 'https://api.anthropic.com/v1/messages'
const API_VERSION = '2023-06-01'

const SYSTEM_PROMPT = `You are a document recognition agent for a charter company. You receive one or more photos of a SINGLE document (passport, passport card, national ID). Extract data precisely, consistently, with NO GUESSING. Return the result strictly via the extract_passport tool.

FIELDS:
- lastName — exactly as in the Surname/Nom/Apellidos field (compound names, hyphens, particles "de","van","Mc" — verbatim).
- firstName — exactly as in the Given Names field, including middle names.
- dateOfBirth, issueDate, expirationDate — format DD.MM.YYYY regardless of the source format.
- placeOfBirth — for US/Russia/France passports → country only ("USA","Russia","France"), even if a city/state is printed. Others — as printed (verbatim).
- nationality — US→"USA", Netherlands(NLD)→"NLD", Canada→"Canada", others — short English adjective (Dominican, Ghanaian, Mexican…) or as printed.
- passportNumber — document number. Do not confuse Passport No. and Passport Card no.

MRZ — secondary verification source. If printed text is blurry but MRZ is clear → take from MRZ and add "recovered from MRZ" to confidenceFlags. If MRZ ≠ printed text → printed text takes priority, add "needs review" flag.

PROBLEM PHOTOS:
- Unreadable field → value "UNREADABLE" and note in confidenceFlags.
- Two photos of the same document → one record.
- Photo is not a document → report in confidenceFlags, do not invent data.

PROHIBITED: guessing Place of Birth, translating names to another alphabet, using dash/guess instead of "UNREADABLE".`

const EXTRACT_TOOL = {
  name: 'extract_passport',
  description: 'Returns extracted passport fields',
  input_schema: {
    type: 'object' as const,
    properties: {
      lastName: { type: 'string' },
      firstName: { type: 'string' },
      dateOfBirth: { type: 'string', description: 'DD.MM.YYYY' },
      placeOfBirth: { type: 'string' },
      nationality: { type: 'string' },
      issueDate: { type: 'string', description: 'DD.MM.YYYY' },
      expirationDate: { type: 'string', description: 'DD.MM.YYYY' },
      passportNumber: { type: 'string' },
      confidenceFlags: { type: 'string', description: 'Problem fields or "none"' }
    },
    required: [
      'lastName', 'firstName', 'dateOfBirth', 'placeOfBirth',
      'nationality', 'issueDate', 'expirationDate', 'passportNumber'
    ]
  }
}

export interface RecognitionResult extends ExtractedPassport {
  confidenceFlags: string
}

export interface ClaudeConfig {
  apiKey: string
  model: string
}

/** Распознаёт паспорт по одному или нескольким base64-изображениям (JPEG). */
export async function recognizePassport(
  images: string[],
  config: ClaudeConfig
): Promise<RecognitionResult> {
  if (!config.apiKey) throw new Error('API key not set (Settings → API Key)')

  const content = [
    ...images.map((base64) => ({
      type: 'image' as const,
      source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: base64 }
    })),
    { type: 'text' as const, text: 'Extract document data using the extract_passport tool.' }
  ]

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': API_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: 'tool', name: 'extract_passport' },
      messages: [{ role: 'user', content }]
    })
  })

  if (!res.ok) {
    let detail = ''
    try {
      const err = await res.json()
      detail = err?.error?.message ?? JSON.stringify(err)
    } catch {
      detail = await res.text()
    }
    throw new Error(`Claude API ${res.status}: ${detail}`)
  }

  const data = await res.json()
  const toolUse = (data.content ?? []).find((b: any) => b.type === 'tool_use')
  if (!toolUse) throw new Error('Claude did not return a structured response (tool_use)')

  const i = toolUse.input ?? {}
  return {
    lastName: String(i.lastName ?? ''),
    firstName: String(i.firstName ?? ''),
    dateOfBirth: String(i.dateOfBirth ?? ''),
    placeOfBirth: String(i.placeOfBirth ?? ''),
    nationality: String(i.nationality ?? ''),
    issueDate: String(i.issueDate ?? ''),
    expirationDate: String(i.expirationDate ?? ''),
    passportNumber: String(i.passportNumber ?? ''),
    confidenceFlags: String(i.confidenceFlags ?? 'none')
  }
}
