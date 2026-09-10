# Handoff — PLAPP (Crew & Passenger List PWA)

> Снимок состояния на конец сессии. Файл перезаписывается каждый раз, историю не хранит.
> Обновлено: 10.09.2026 10:40 AST

## Текущее состояние (одним абзацем)
Приложение задеплоено на GitHub Pages (https://allaboutboatcharters.github.io/PLAPP/),
репо публичное. Весь UI на английском. XLSX генерируется по образцу с границами,
датами как Date (m/d/yyyy), min 10 строк пассажиров. Добавление пассажиров в
существующий список работает. Печать переделана: overlay показывается поверх страницы
(position:fixed, z-index:99999) вместо display:none, window.print() вызывается
синхронно из обработчика клика (fix блокировки iOS Safari), cleanup через afterprint.
`npm run build` проходит чисто. Автодеплой через GitHub Actions при push в main.
Context7 MCP установлен в Hermes.

## Сделано в этой сессии
- Fix блокировки печати iOS Safari: убран requestAnimationFrame + setTimeout,
  window.print() теперь вызывается синхронно из клика пользователя.
- Fix превью печати: cleanup overlay через событие afterprint вместо setTimeout(500ms).
- Fix отображения в превью: overlay теперь position:fixed поверх страницы вместо
  display:none (iOS Safari не видит скрытые элементы в print preview).
- Установлен Context7 MCP сервер в Hermes (2 инструмента: resolve-library-id, query-docs).

## В работе / не закоммичено
Всё закоммичено, рабочее дерево чистое.

## Следующие шаги
1. **Проверить печать на iPhone** — overlay теперь показывается поверх страницы и
   print вызывается синхронно; нужно протестировать, что в превью видна таблица
   Crew & Passenger List, а не UI приложения.
2. Завести реальные данные: 10 лодок и 6+6 экипажа в Настройках.
3. Прогон полного цикла на телефоне с реальными паспортами.
4. Подсказка в UI про браузерные headers/footers при печати (Safari).

## Открытые вопросы / решения к принятию
- Служебная инфа при печати (URL, дата, стр.) — это браузерные headers/footers.
  На iOS Safari убираются галочками в диалоге печати. Нужна подсказка в UI?
- Список лодок и ФИО экипажа для засидки — пока не предоставлены.

## Полезное для быстрого старта
- Последние коммиты:
  - 25cad71 Print: overlay поверх страницы вместо display:none (fix iOS Safari preview)
  - 924ac37 Print: afterprint cleanup вместо setTimeout (fix preview iOS)
  - 04726d3 Print: синхронный window.print() — fix блокировки iOS Safari
  - 6384ecc Print: overlay в текущей странице вместо iframe/window.open (fix iOS Safari)
  - fafe4d6 Кнопка Print сразу после генерации и после добавления пассажиров
- URL: https://allaboutboatcharters.github.io/PLAPP/
- Команды: `npm install`, `npm run dev`, `npm run dev:lan`, `npm run build`.
- Важные файлы: `src/lib/passengerListWorkbook.ts` (XLSX), `src/lib/claude.ts`,
  `src/lib/printList.ts` (печать), `src/views/AddPassengers.vue`,
  `src/views/CreateList.vue`, `src/views/ListDetail.vue`.
- Образец XLSX: `~/.hermes/cache/documents/doc_d768cec7faf0_Crew_and_Passenger_List_Rumbelly_2.xlsx`
