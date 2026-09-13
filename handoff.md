# Handoff — PLAPP (Crew & Passenger List PWA)

> Снимок состояния на конец сессии. Файл перезаписывается каждый раз, историю не хранит.
> Обновлено: 13.09.2026 11:16 AST

## Текущее состояние (одним абзацем)
Приложение задеплоено на GitHub Pages (https://allaboutboatcharters.github.io/PLAPP/),
репо публичное. Весь UI на английском. XLSX генерируется по образцу. Save PDF работает
(jsPDF landscape A4). Crew CRUD переделан: в Settings → Crew отображается компактный
список с кнопками edit/delete, карточка редактирования открывается в модальном
bottom-sheet окне. При создании списка captain/assistant не выбраны по умолчанию —
пользователь выбирает из dropdown. Дефолтная модель распознавания паспортов —
`claude-haiku-4-5-20251001` (дешевле sonnet). `npm run build` проходит чисто.
Автодеплой через GitHub Actions при push в main.

## Сделано в этой сессии
- CreateList: убран автовыбор первого captain/assistant, добавлены placeholder
  "— Select captain —" / "— Select assistant —".
- Settings → Crew переделан в нормальный CRUD:
  - Список капитанов и ассистентов отдельными группами (имя + номер паспорта).
  - Кнопки ✏️ (edit) и ✕ (delete) на каждой записи.
  - Карточка редактирования — modal bottom-sheet (Teleport to body) с полями,
    кнопкой "📷 Fill from passport photo" и Save.
  - При добавлении нового crew сразу открывается модалка.
- Модель распознавания паспортов сменена на `claude-haiku-4-5-20251001`
  (claude-3-5-haiku депрекейтнут, 404).

## В работе / не закоммичено
Всё закоммичено, рабочее дерево чистое.

## Следующие шаги
1. Протестировать распознавание паспортов на `claude-haiku-4-5-20251001` — качество.
2. Протестировать Save PDF на iPhone — скачивается ли, landscape, данные.
3. Засеять реальные данные: лодки и экипаж в Settings.
4. Полный цикл на телефоне с реальными паспортами.
5. Удалить неиспользуемый `src/lib/printList.ts`.

## Открытые вопросы / решения к принятию
- Качество распознавания на Haiku 4.5 — протестировать на реальных паспортах.
- Список лодок и ФИО экипажа для засидки — пока не предоставлены.
- Старый printList.ts остался в коде (не импортируется) — удалить?

## Полезное для быстрого старта
- Последние коммиты:
  - de7f1f3 Fix: модель claude-haiku-4-5-20251001 (3.5 haiku депрекейтнут)
  - 467ae4a Crew CRUD: список с кнопками edit/delete, карточка в модальном окне
  - c2ef43a Handoff: сессия 10.09 — Save PDF вместо Print
- URL: https://allaboutboatcharters.github.io/PLAPP/
- Команды: `npm install`, `npm run dev`, `npm run dev:lan`, `npm run build`.
- Важные файлы: `src/views/Settings.vue` (crew CRUD + modal), `src/views/CreateList.vue`,
  `src/styles.css` (modal-overlay/modal-sheet стили), `src/db/dexie.ts` (модель дефолт),
  `src/lib/claude.ts` (промпт распознавания), `src/lib/savePdf.ts`.
- Образец XLSX: `~/.hermes/cache/documents/doc_d768cec7faf0_Crew_and_Passenger_List_Rumbelly_2.xlsx`
