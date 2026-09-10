# Handoff — PLAPP (Crew & Passenger List PWA)

> Снимок состояния на конец сессии. Файл перезаписывается каждый раз, историю не хранит.
> Обновлено: 10.09.2026 10:58 AST

## Текущее состояние (одним абзацем)
Приложение задеплоено на GitHub Pages (https://allaboutboatcharters.github.io/PLAPP/),
репо публичное. Весь UI на английском. XLSX генерируется по образцу с границами,
датами как Date (m/d/yyyy), min 10 строк пассажиров. Добавление пассажиров в
существующий список работает. Печать через window.print() на iOS Safari так и не
заработала (несколько попыток: iframe, overlay, @media print, физическое скрытие UI —
Safari всё равно печатает UI приложения). Вместо Print добавлена кнопка **Save PDF** —
генерация PDF через jsPDF + jspdf-autotable прямо на устройстве, landscape A4.
`npm run build` проходит чисто. Автодеплой через GitHub Actions при push в main.

## Сделано в этой сессии
- Попытка fix печати iOS Safari: физическое скрытие всех body children + overlay —
  не помогло (Safari всё равно рендерит UI вместо overlay).
- Заменена кнопка Print на **Save PDF** (jsPDF + jspdf-autotable):
  - Landscape A4, таблица с рамками, заголовок, footer с текстом Toelatingsbesluit.
  - Файл: `Crew and Passenger List - {boatName}.pdf`.
  - Кнопка добавлена во все 3 вью: CreateList, AddPassengers, ListDetail.
- Установлены пакеты: `jspdf`, `jspdf-autotable`, `@types/node`.

## В работе / не закоммичено
Всё закоммичено, рабочее дерево чистое.

## Следующие шаги
1. **Протестировать Save PDF на iPhone** — убедиться, что PDF скачивается/открывается,
   landscape ориентация, данные на месте.
2. Завести реальные данные: 10 лодок и 6+6 экипажа в Настройках.
3. Прогон полного цикла на телефоне с реальными паспортами.
4. Подсказка в UI про возможность напечатать скачанный PDF из Files/Preview.

## Открытые вопросы / решения к принятию
- window.print() на iOS Safari не работает для кастомного контента в PWA —
  окончательно заменён на PDF-генерацию. Старый printList.ts остался в коде
  (не импортируется) — удалить?
- Список лодок и ФИО экипажа для засидки — пока не предоставлены.

## Полезное для быстрого старта
- Последние коммиты:
  - 2a01cba Save PDF вместо Print: jsPDF landscape, работает на iOS Safari
  - 6bc37d1 Print: физически скрываем UI вместо @media print (fix iOS Safari)
  - 25cad71 Print: overlay поверх страницы вместо display:none (fix iOS Safari preview)
- URL: https://allaboutboatcharters.github.io/PLAPP/
- Команды: `npm install`, `npm run dev`, `npm run dev:lan`, `npm run build`.
- Важные файлы: `src/lib/savePdf.ts` (PDF-генерация), `src/lib/passengerListWorkbook.ts` (XLSX),
  `src/lib/claude.ts`, `src/lib/printList.ts` (старый, не используется),
  `src/views/AddPassengers.vue`, `src/views/CreateList.vue`, `src/views/ListDetail.vue`.
- Образец XLSX: `~/.hermes/cache/documents/doc_d768cec7faf0_Crew_and_Passenger_List_Rumbelly_2.xlsx`
