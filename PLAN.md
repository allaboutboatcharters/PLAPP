# Crew & Passenger List PWA — план

## Context

Компания All About Boat Charters (база — Синт-Мартен / SXM) водит 10 лодок,
экипаж — 6 капитанов и 6 помощников (планируется рост). Для каждого рейса нужно
подать в иммиграционную службу документ **«Crew and Passenger List»**. Сейчас его
делают вручную: фото паспортов → извлечение данных → таблица. Приложение
автоматизирует это.

Требования:
- Открывается с телефона как **PWA** (iPhone и Android). Локально, без своего
  домена и бэкенда. Все данные — на устройстве (один общий телефон на весь парк).
- Экран 1 — выбор лодки. Далее 3 действия: **добавить паспорт** (камера),
  **сделать Passenger list**, **история**.
- Распознавание паспорта — **Claude vision**, вызов напрямую из браузера
  (ключ Anthropic вводится один раз в настройках).
- Готовый документ — **XLSX** строго по образцу.
- Через **72 часа** сканы паспортов самоудаляются и не попадают в следующие
  списки. Passenger list в истории хранится **бессрочно**.
- В один день у лодки может быть несколько списков; паспорт, уже попавший в один
  список, в следующий не включается (дедуп по **номеру паспорта**).
- История — все списки с **группировкой по дням**.

Репозиторий: `/Users/boatcharters/PLAPP` (GitHub `allaboutboatcharters/PLAPP`),
сейчас пустой (только `LICENSE`). Всё строится с нуля. Копию этого плана положить
в `PLAPP/PLAN.md`.

## Образец документа (разобран)

Файл: `.../CloudDocs/Crew and Passenger List Becquard Radosevich.xlsx`
Лист `Crew and Passenger List`, диапазон `A1:K37`.

- `A1:J2` объединено — «CREW AND PASSENGER LIST», Arial Black 26, bold, слева,
  вертикально по центру.
- Строка 3 — заголовки колонок (Arial 11): `A`(пусто, №) · `B` Last Name ·
  `C` First Name · `D` Date of birth · `E` Place of birth · `F` Nationality ·
  `G` Issue date · `H` Expiration date · `I` Pasp nr. · `J` Rank · `K` Remarks.
- Строки данных (Arial 10):
  - `A` — порядковый номер. **Экипаж нумеруется 1–2, пассажиры — заново с 1.**
  - `B/C` — фамилия / имя(имена), КАПСОМ.
  - `D` — дата рождения, формат `18 MAR 2002` (DD MON YYYY, англ. месяц капсом).
  - `E` — место рождения как в паспорте (`CALIFORNIA, USA`).
  - `F` — гражданство как в паспорте (`UNITED STATES OF AMERICA`, `FRANCAISE`).
  - `G/H` — дата выдачи / окончания паспорта, тот же формат даты.
  - `I` — номер паспорта.
  - `J` — Rank: `CAPTAIN`, `CREW`, `Passenger`.
  - `K` — Remarks: у экипажа `SXM`; у пассажиров — место проживания
    (`Sonesta`, `Divi Resort`, …), **у каждого своё**.
- Ширины колонок: A4 · B16 · C22 · D13 · E20 · F14 · G13 · H15 · I14 · J12 · K22.
- Футер: объединённые `A34:I34`, `A35:I35`, `A36:I36` — юридический текст
  «In adherence to article 15 (1)(a)(b)(c)(d) and article 15 (2) of the
  Toelatingsbesluit…» (вставляется дословно, всегда).
- В самом файле нет ни названия лодки, ни даты рейса.
- **Имя генерируемого файла — всегда `Crew and Passenger List.xlsx`** (без фамилий
  экипажа, без лодки/даты). В образце фамилии в имени были, но так делать не надо.

Точные границы/отступы ячеек сверить с файлом при реализации модуля генерации.

## Согласованные решения

- Имя выгружаемого файла — всегда `Crew and Passenger List.xlsx`.
- Данные экипажа (полный паспортный набор + Remarks по умолчанию `SXM`) вводятся
  **один раз в настройках** для каждого из 6+6 человек; можно заполнить, один раз
  сфотографировав паспорт. При создании списка подставляются автоматически.
- Каждый список **всегда** начинается с 2 строк: капитан (`CAPTAIN`) + помощник
  (`CREW`), оба Remarks `SXM`, номера 1–2.
- Remarks пассажира вводится/правится **по каждому** при проверке скана.
- Фреймворк — **Vue 3** (не React).

## Стек

- **Vite + Vue 3 (`<script setup>`) + TypeScript**, сборка в статику.
- **vue-router** (hash-free history), **Pinia** (состояние).
- **Dexie.js** (IndexedDB) — данные + блобы фото и готовых XLSX.
- **ExcelJS** — генерация XLSX (объединённые ячейки, Arial Black, ширины) —
  изолированный модуль `src/lib/passengerListWorkbook.ts`.
- **vite-plugin-pwa** (Workbox) — манифест, service worker, устанавливаемость,
  офлайн-оболочка. `navigator.storage.persist()` при первом запуске.
- **Камера**: `<input type="file" accept="image/*" capture="environment">`
  (надёжно на iOS и Android). Сжатие через `canvas` (~1600 px, JPEG).
- **Claude API**: `fetch` → `https://api.anthropic.com/v1/messages`, заголовки
  `x-api-key`, `anthropic-version: 2023-06-01`,
  `anthropic-dangerous-direct-browser-access: true`. Модель `claude-sonnet-5`,
  структурный вывод через `tool_use`: `lastName, firstName, dateOfBirth,
  placeOfBirth, nationality, issueDate, expirationDate, passportNumber`
  (+ MRZ как перекрёстная сверка). Заметка о стоимости ~$0.01–0.03 за фото.
- **Стили**: mobile-first CSS + CSS-переменные, крупные кнопки. Без UI-фреймворка.
- **Хостинг**: Cloudflare Pages / GitHub Pages (бесплатный `*.pages.dev`,
  HTTPS обязателен для камеры/PWA). Данные телефон не покидают.

## Модель данных (Dexie)

- `settings` (singleton): `apiKey`, `model`, `crewRemarkDefault='SXM'`,
  `filenamePrefix='Crew and Passenger List'`, `storagePersisted`.
- `boats`: `id`, `name`, `sortOrder`, `active`.
- `crew`: `id`, `role` `'captain'|'assistant'`, `lastName`, `firstName`,
  `dateOfBirth`, `placeOfBirth`, `nationality`, `issueDate`, `expirationDate`,
  `passportNumber`, `remark='SXM'`, `active`, `sortOrder`.
- `passportScans`: `id`, `boatId`, `capturedAt`, `expiresAt` (`capturedAt+72ч`),
  `imageBlob`, `status` `'pending'|'ready'|'error'`, `errorMsg`,
  `extracted{…8 полей…}`, `remark` (жильё, правится), `usedInListId|null`.
- `passengerLists`: `id`, `boatId`, `boatName`, `date` (YYYY-MM-DD), `createdAt`,
  `captainId`, `assistantId`, `crewRows[]` (снимок), `passengers[]` (снимок,
  вкл. `remark`), `crewCount`, `passengerCount`, `fileName`, `xlsxBlob`.

## Экраны (маршруты)

- `/` — **BoatPicker**: сетка лодок + иконка настроек.
- `/boat/:id` — **BoatHome**: 3 крупные кнопки; счётчик «готовых сканов для этой
  лодки».
- `/boat/:id/capture` — **CapturePassport**: снимок → сжатие → Claude → карточка
  с извлечёнными полями (все правятся) + поле Remarks (жильё) → сохранить скан →
  «сделать ещё» / «готово».
- `/boat/:id/new-list` — **CreateList**: выбор капитана и помощника (выпадающие из
  `crew`); список кандидатов-сканов (boat совпадает, `status='ready'`,
  `now<expiresAt`, `usedInListId==null`, номер паспорта не встречается в
  `passengers[]` прежних списков этой лодки за ту же дату); чекбоксы, все выбраны;
  дедуп по номеру паспорта. «Сформировать» → строки: 2 экипажа + пассажиры →
  `passengerListWorkbook` → запись в `passengerLists` (+ `xlsxBlob`, `fileName`) →
  выбранным сканам `usedInListId`. Затем «Поделиться» (Web Share API с файлом;
  фолбэк — скачивание) и «Готово».
- `/history` — **History**: все списки, группировка по дням (заголовки-даты,
  свежие сверху), карточки: лодка · время · капитан+помощник · число пассажиров ·
  [Поделиться] [Открыть]. Фильтр по лодке.
- `/history/:listId` — **ListDetail**: таблица экипажа+пассажиров, повторная
  выгрузка/Поделиться из сохранённого `xlsxBlob`.
- `/settings` — **Settings**: вкладки «Лодки», «Экипаж» (полные паспортные поля +
  «заполнить по фото»), «API-ключ».

## 72-часовое удаление

При старте приложения и на `visibilitychange`: удалить `passportScans` где
`expiresAt < now` (ряд вместе с блобом), независимо от того, попал ли скан в
список — данные уже зафиксированы снимком в `passengerLists`. Дополнительно
«эффективный» фильтр: скан старше 72 ч не показывается и не участвует в выборе,
даже если чистка ещё не отработала. `passengerLists` не трогаются никогда.
Ограничение iOS (нет фоновых задач) — чистка только при открытии; отметить в
README.

## Структура проекта

```
PLAPP/
  index.html  package.json  vite.config.ts  tsconfig.json
  public/            иконки
  src/
    main.ts  App.vue  router.ts
    stores/         settings, boats, crew, scans, lists (Pinia)
    db/             dexie.ts, cleanup.ts
    lib/            claude.ts, passportImage.ts, passengerListWorkbook.ts,
                    formatters.ts (даты DD MON YYYY, КАПС), share.ts
    views/          BoatPicker, BoatHome, CapturePassport, CreateList,
                    History, ListDetail, Settings (.vue)
    components/      ScanReviewCard, CrewForm, BoatGrid, DayGroup, …
  PLAN.md
```

## Порядок работ

1. Каркас: Vite+Vue+TS, vite-plugin-pwa, router, Pinia, Dexie-схема, мобильный
   layout + навигация, `storage.persist()`.
2. Settings: CRUD лодок; CRUD экипажа (полные паспортные поля + «заполнить по
   фото» через `claude.ts`); ввод API-ключа.
3. BoatPicker + BoatHome.
4. CapturePassport: камера → сжатие → `claude.ts` → `ScanReviewCard` (правка всех
   полей + Remarks) → сохранение скана.
5. `passengerListWorkbook.ts` — точная копия образца (сверить дампом openpyxl с
   исходным файлом: заголовки, объединения, ширины, футер, форматы дат) +
   CreateList с логикой дедупа/фильтра и генерацией.
6. History + ListDetail (группировка по дням, фильтр по лодке, повторная
   выгрузка/Поделиться).
7. Задача 72-часовой чистки + эффективная фильтрация.
8. Иконки/манифест, деплой на Cloudflare Pages (или GitHub Pages), прогон
   верификации на реальных iPhone и Android.

## Верификация (end-to-end)

1. `npm run dev`; открыть в Chrome (эмуляция телефона) и на реальных телефонах
   через деплой.
2. Settings: завести 10 лодок, 6+6 экипажа (заполнить хотя бы 1 капитана и 1
   помощника по фото паспорта), вставить API-ключ.
3. Лодка → «Добавить паспорт» → тестовое фото → проверить извлечённые 8 полей,
   правку, ввод Remarks, сохранение.
4. «Сделать Passenger list» → выбрать капитана/помощника → сформировать →
   открыть XLSX и **сравнить с образцом** (дамп openpyxl: строки экипажа 1–2,
   пассажиры с 1, заголовок, ширины, футер, `DD MON YYYY`, КАПС). Имя файла —
   ровно `Crew and Passenger List.xlsx`.
5. История: группировка по дням, фильтр по лодке, повторная выгрузка из блоба.
6. DevTools: выставить `capturedAt` скана на >72 ч назад → перезагрузка → скан
   исчез и не предлагается.
7. Второй список в тот же день той же лодкой → уже использованный пассажир (по
   номеру паспорта) не предлагается и не попадает в файл.
8. «Поделиться» на реальных iPhone и Android.
9. Lighthouse / установка «на экран Домой», офлайн-запуск оболочки.

## Открытые мелочи (уточнить по ходу, не блокеры)

- Названия 10 лодок и ФИО экипажа — вводит пользователь в Settings при первом
  запуске (либо пришлёт списком — добавлю как сид).
- Нужен ли раздельный «Sex»/пол — в образце нет, не добавляем.
- Точные границы ячеек образца — свериться с файлом при шаге 5.
