# Handoff — PLAPP (Crew & Passenger List PWA)

> Снимок состояния на конец сессии. Файл перезаписывается каждый раз, историю не хранит.
> Обновлено: 22.09.2026

## Текущее состояние (одним абзацем)
**Релиз v1.0.0.** Приложение задеплоено на GitHub Pages (https://allaboutboatcharters.github.io/PLAPP/),
репо публичное. Весь UI на английском. Полный цикл работает: сканирование паспортов → распознавание
через Claude API → формирование Crew & Passenger List → экспорт XLSX и PDF (одна страница A4 landscape).
PWA с offline-поддержкой, Service Worker, rate-limiting, CSP. Билд чистый (0 TS ошибок).
Автодеплой через GitHub Actions при push в main.

## Что вошло в v1.0.0
- Сканирование и распознавание паспортов через Claude API (claude-sonnet-5 / claude-haiku-4-5)
- Выбор лодки, управление экипажем и пассажирами
- Генерация XLSX и PDF (Crew and Passenger List.xlsx) — одна страница A4 landscape
- Редактирование сканов и пассажиров в сохранённом списке
- PWA: offline banner, SW update prompt, apple-touch-icon, splash screen
- Безопасность: rate-limiting на API-вызовы, CSP meta-тег
- UX: toast уведомления, loading states, название лодки в заголовке
- Данные только на устройстве (IndexedDB), сканы самоудаляются через 72 ч

## В работе / не закоммичено
Нет.

## Следующие шаги (v1.1+)
- Нет запланированных задач — приложение в production.

## Открытые вопросы / решения к принятию
- Нет.

## Полезное для быстрого старта
- URL: https://allaboutboatcharters.github.io/PLAPP/
- Команды: `npm install`, `npm run dev`, `npm run dev:lan`, `npm run build`.
