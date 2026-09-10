# Handoff — PLAPP (Crew & Passenger List PWA)

> Снимок состояния на конец сессии. Файл перезаписывается каждый раз, историю не хранит.
> Обновлено: 09.09.2026 13:57 AST

## Текущее состояние (одним абзацем)
Приложение задеплоено на GitHub Pages (https://allaboutboatcharters.github.io/PLAPP/),
репо публичное. Весь UI на английском. XLSX генерируется по образцу с границами,
датами как Date (m/d/yyyy), min 10 строк пассажиров. Добавление пассажиров в
существующий список работает. Печать реализована через print overlay в текущей
странице (fix для iOS Safari). Chrome установлен на Mac для browser-harness.
`npm run build` проходит чисто. Автодеплой через GitHub Actions при push в main.

## Сделано в этой сессии
- Фото из галереи (убран capture="environment").
- Fix DataCloneError при сохранении скана (Vue reactive proxy → plain object).
- XLSX полностью переписан по образцу: Impact заголовок, даты как Date, границы
  (medium внешние / thin внутренние), min 10 строк, точные ширины колонок.
- GitHub Pages деплой: репо сделано публичным, workflow deploy.yml, динамический base.
- Весь UI + Claude промпт + tool schema переведены на английский.
- Добавление пассажиров в существующий список (AddPassengers.vue + route + store update).
- Печать: кнопка 🖨 Print на 3 экранах (после генерации, после добавления, в истории).
- Print переделан с window.open → iframe → overlay в текущей странице (iOS Safari fix).
- Установлен Chrome для browser-harness.

## В работе / не закоммичено
Всё закоммичено, рабочее дерево чистое.

## Следующие шаги
1. **Проверить печать на iPhone** — overlay-подход должен работать, но надо протестить.
2. Пользователь заметил служебную инфу (дата, страница, URL) внизу при печати — это
   стандартные headers/footers Safari, убираются только вручную в настройках печати.
   Можно добавить подсказку в UI.
3. Завести реальные данные: 10 лодок и 6+6 экипажа в Настройках.
4. Прогон полного цикла на телефоне с реальными паспортами.

## Открытые вопросы / решения к принятию
- Служебная инфа при печати (URL, дата, стр.) — это браузерные headers/footers.
  На iOS Safari убираются галочками в диалоге печати. Нужна подсказка в UI?
- Список лодок и ФИО экипажа для засидки — пока не предоставлены.

## Полезное для быстрого старта
- Последние коммиты:
  - 6384ecc Print: overlay в текущей странице (fix iOS Safari)
  - fafe4d6 Кнопка Print на 3 экранах
  - d878045 Claude промпт и tool schema на английском
  - b71e7de Добавление пассажиров в существующий список
  - 4e5f047 Перевод UI на английский
  - 087c057 GitHub Pages деплой
  - 2d43a0f XLSX границы + min 10 строк
- URL: https://allaboutboatcharters.github.io/PLAPP/
- Команды: `npm install`, `npm run dev`, `npm run dev:lan`, `npm run build`.
- Важные файлы: `src/lib/passengerListWorkbook.ts` (XLSX), `src/lib/claude.ts`,
  `src/lib/printList.ts` (печать), `src/views/AddPassengers.vue`,
  `src/views/CreateList.vue`, `src/views/ListDetail.vue`.
- Образец XLSX: `~/.hermes/cache/documents/doc_d768cec7faf0_Crew_and_Passenger_List_Rumbelly_2.xlsx`
