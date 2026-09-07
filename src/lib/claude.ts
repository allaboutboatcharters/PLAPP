import type { ExtractedPassport } from '../db/dexie'

const API_URL = 'https://api.anthropic.com/v1/messages'
const API_VERSION = '2023-06-01'

const SYSTEM_PROMPT = `Ты — агент распознавания документов для чартерной компании. На вход получаешь одно или несколько фото ОДНОГО документа (паспорт, паспортная карта, national ID). Извлекаешь данные точно, единообразно, БЕЗ ДОМЫСЛОВ. Верни результат строго через инструмент extract_passport.

ПОЛЯ:
- lastName — ровно как в поле Surname/Nom/Apellidos (составные фамилии, дефисы, частицы "de","van","Mc" — verbatim).
- firstName — ровно как в поле Given Names, включая средние имена.
- dateOfBirth, issueDate, expirationDate — формат ДД.ММ.ГГГГ независимо от исходного формата.
- placeOfBirth — паспорта US/Russia/France → только страна ("USA","Russia","France"), даже если напечатан город/штат. Остальные — как напечатано (verbatim).
- nationality — США→"USA", Нидерланды(NLD)→"NLD", Канада→"Canada", остальные — краткое англ. прилагательное (Dominican, Ghanaian, Mexican…) или как напечатано.
- passportNumber — номер документа. Не путать Passport No. и Passport Card no.

MRZ — вторичный контрольный источник. Если печатный текст размыт, а MRZ чёткий → взять из MRZ и добавить в confidenceFlags "восстановлено по MRZ". Если MRZ ≠ печатный текст → печатный текст приоритетнее, добавить флаг "требует проверки".

ПРОБЛЕМНЫЕ ФОТО:
- Нечитаемое поле → значение "НЕ ЧИТАЕТСЯ" и запись в confidenceFlags.
- Две фото одного документа → одна запись.
- Фото не является документом → сообщи в confidenceFlags, не выдумывай данные.

ЗАПРЕЩЕНО: додумывать Place of Birth, переводить имена на другой алфавит, ставить прочерк/предположение вместо "НЕ ЧИТАЕТСЯ".`

const EXTRACT_TOOL = {
  name: 'extract_passport',
  description: 'Возвращает извлечённые из паспорта поля',
  input_schema: {
    type: 'object' as const,
    properties: {
      lastName: { type: 'string' },
      firstName: { type: 'string' },
      dateOfBirth: { type: 'string', description: 'ДД.ММ.ГГГГ' },
      placeOfBirth: { type: 'string' },
      nationality: { type: 'string' },
      issueDate: { type: 'string', description: 'ДД.ММ.ГГГГ' },
      expirationDate: { type: 'string', description: 'ДД.ММ.ГГГГ' },
      passportNumber: { type: 'string' },
      confidenceFlags: { type: 'string', description: 'Проблемные поля или "нет"' }
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
  if (!config.apiKey) throw new Error('Не задан API-ключ (Настройки → API-ключ)')

  const content = [
    ...images.map((base64) => ({
      type: 'image' as const,
      source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: base64 }
    })),
    { type: 'text' as const, text: 'Извлеки данные документа через инструмент extract_passport.' }
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
  if (!toolUse) throw new Error('Claude не вернул структурный ответ (tool_use)')

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
    confidenceFlags: String(i.confidenceFlags ?? 'нет')
  }
}
