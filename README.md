# PLAPP v1.0.0 — Crew & Passenger List PWA

PWA для автоматизации создания документа **«Crew and Passenger List»** для
компании All About Boat Charters (Синт-Мартен / SXM).

Фото паспорта → распознавание Claude vision → готовый XLSX / PDF строго по образцу.
Все данные хранятся только на устройстве, без бэкенда и без своего домена.

🔗 **https://allaboutboatcharters.github.io/PLAPP/**

## Возможности

- 📷 **Сканирование паспортов** — камера телефона → сжатие → Claude vision (tool_use, 8 полей)
- ✏️ **Редактирование** — правка всех распознанных полей + Remarks (жильё)
- 📋 **Генерация документа** — XLSX и PDF «Crew and Passenger List», одна страница A4 landscape
- 🔄 **Дедупликация** — паспорт, уже включённый в список за сегодня, не предлагается повторно
- 📱 **PWA** — установка на домашний экран, offline-поддержка, Service Worker
- 🔒 **Безопасность** — rate-limiting API-вызовов, CSP, данные только на устройстве
- 🗑️ **Автоочистка** — сканы паспортов удаляются через 72 часа, готовые списки хранятся бессрочно
- 📜 **История** — все списки с группировкой по дням, фильтр по лодке, повторная выгрузка

## Стек

Vite + Vue 3 (`<script setup>`) + TypeScript · vue-router · Pinia ·
Dexie (IndexedDB) · ExcelJS · jsPDF + jspdf-autotable · vite-plugin-pwa (Workbox).

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173 — камера/PWA работают (secure context)
npm run build      # проверка типов (vue-tsc) + сборка в dist/
npm run preview    # предпросмотр production-сборки
```

### Тест на реальном телефоне

Камера и установка PWA требуют HTTPS. `localhost` на телефоне не подойдёт:

- **HTTPS в локальной сети:** `npm run dev:lan` (Vite `--host`) + плагин
  `@vitejs/plugin-basic-ssl`; телефон открывает `https://<IP-мака>:5173`
  (один раз принять самоподписанный сертификат).
- **GitHub Pages:** приложение задеплоено на
  https://allaboutboatcharters.github.io/PLAPP/ — готовый HTTPS.

## Первый запуск

1. **Settings → API Key:** вставить Anthropic API key (хранится в IndexedDB на устройстве).
2. **Settings → Boats:** добавить лодки.
3. **Settings → Crew:** завести капитанов и помощников (можно «Fill from passport photo» —
   данные подставятся автоматически).

## Как это работает

1. **Add passport** — снимок → сжатие (~1600px JPEG) → Claude vision (tool_use,
   8 полей) → правка полей + Remarks (жильё) → сохранение скана.
2. **Create Passenger list** — выбор капитана и помощника → чекбоксы пассажиров
   (дедуп по номеру паспорта) → генерация XLSX + PDF → «Share» / скачивание.
3. **History** — все списки с группировкой по дням, фильтр по лодке, повторная
   выгрузка из сохранённого блоба.

## Деплой

Автодеплой через GitHub Actions при push в `main`.
Сборка: `npm run build` → `dist/` → GitHub Pages.

## Важные ограничения

- **72-часовое удаление сканов** выполняется при открытии приложения и при
  возврате на вкладку (`visibilitychange`). У iOS нет фоновых задач, поэтому
  чистка происходит только когда приложение открыто. Готовые списки
  (`passengerLists`) не удаляются никогда.
- Имя выгружаемого файла — всегда `Crew and Passenger List.xlsx`.
- Экипаж всегда 2 человека: капитан (CAPTAIN) + помощник (CREW).

## Документация

- [PLAN.md](./PLAN.md) — архитектура, модель данных, спецификация XLSX и промпта распознавания.
- [AGENTS.md](./AGENTS.md) — инструкции для AI-агентов.

## Лицензия

MIT
