# Handoff — PLAPP (Crew & Passenger List PWA)

> Снимок состояния на конец сессии. Файл перезаписывается каждый раз, историю не хранит.
> Обновлено: 08.09.2026 15:28 AST

## Текущее состояние (одним абзацем)
Приложение полностью собрано и работает на телефоне через dev-сервер (HTTPS LAN).
Установлен Chrome на Mac для удалённого просмотра через browser-harness. Съёмка
паспортов, распознавание через Claude vision, сохранение сканов и генерация XLSX —
всё функционирует. XLSX-модуль полностью переписан по реальному образцу
(Crew_and_Passenger_List_Rumbelly_2.xlsx). `npm run build` проходит чисто.

## Сделано в этой сессии
- Убран `capture="environment"` — теперь фото можно выбирать из галереи, а не только через камеру.
- Исправлен DataCloneError при сохранении скана (Vue reactive proxy → plain object перед записью в IndexedDB).
- Добавлены try/catch + индикатор «Сохраняю…» на кнопку сохранения скана.
- XLSX-модуль (`passengerListWorkbook.ts`) полностью переписан по образцу:
  - Заголовок Impact 36 в B1, высота 45.
  - Заголовки колонок Times New Roman 10 в строке 2.
  - Данные Calibri 11 со строки 3.
  - Даты как JS Date с форматом `m/d/yyyy` (не текст и не Excel serial numbers).
  - 28 пустых слотов пассажиров с номерами и "Passenger".
  - Точные ширины колонок из образца, без merged cells.
- Установлен Chrome на Mac — browser-harness теперь работает для просмотра приложения.

## В работе / не закоммичено
Всё закоммичено, рабочее дерево чистое.

## Следующие шаги
1. Прогон полного цикла на телефоне: фото паспорта → распознавание → сохранить → сгенерировать XLSX → сравнить с образцом визуально.
2. Деплой `dist/` на Cloudflare Pages или GitHub Pages для постоянной ссылки без dev-сервера.
3. Завести реальные данные: 10 лодок и 6+6 экипажа в Настройках.
4. Проверить генерацию XLSX с реальными данными и сравнить дампом openpyxl с образцом.

## Открытые вопросы / решения к принятию
- Cloudflare Pages или GitHub Pages для деплоя?
- Список названий лодок и ФИО экипажа для засидки.
- Образец XLSX может потребовать дополнительных правок после визуального сравнения на телефоне.

## Полезное для быстрого старта
- Последние коммиты:
  - 3698a53 XLSX: полная переделка по образцу — Impact заголовок, даты как Date, 28 пустых слотов
  - 5d13917 Fix DataCloneError: снимаем Vue reactive proxy перед записью в IndexedDB
  - e703578 Кнопка Сохранить: try/catch + индикатор сохранения
  - ce9f7f7 Фото: выбор из галереи или камеры (убран capture=environment)
- Команды: `npm install`, `npm run dev`, `npm run dev:lan` (HTTPS), `npm run build`, `npm run preview`.
- Важные файлы: `PLAN.md`, `README.md`, `AGENTS.md`,
  `src/lib/passengerListWorkbook.ts` (XLSX), `src/lib/claude.ts` (распознавание),
  `src/views/CapturePassport.vue` (съёмка/сохранение сканов).
- Browser-harness: Chrome установлен, remote debugging настроено — можно смотреть приложение через browser_exec.
- Образец XLSX: `/Users/boatcharters/.hermes/cache/documents/doc_d768cec7faf0_Crew_and_Passenger_List_Rumbelly_2.xlsx`
