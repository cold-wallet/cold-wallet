# Redesign Plan — натягування нового дизайну на реальний `src/`

Гілка: `redesign`. Дизайн-система: `src/design.css` (копія `handoff/reference/styles.css`).
Принцип: **редагуємо лише презентаційний шар** (розмітка + класи + CSS), механіку (`ColdWallet`
стан, `UserDataService`, 6 лоадерів, `PriceService`/`CurrencyService`, storage, `CypherService`,
`dataImporter`, `Props.ts`) **не чіпаємо**. Highcharts → рукописні SVG-чарти на реальних даних.

## Фази
- **Ф0 — каркас:** дизайн-токени; `AssetsDashboard` → `.app/.side/.main`; `Asset`/`IntegrationAsset`/
  `AssetControls` → `.row/.coin`; `AssetsManageButtons`/`AssetsTotalAmount` → хедер сайдбару + реальний total.
- **Ф1 — чарти:** селектор даних (`AssetDTO[]` + `PriceService` → segs); `DonutChart`/`TreemapChart` +
  statcards + легенда + by-source; прибрати Highcharts (`PieChart`/`TreeChart`/`*Svg`, deps).
- **Ф2 — CRUD:** `NewAssetWindow`+`EditNewAsset`/`EditAsset`/`AssetEditor` → `EditDialog`;
  `AssetDeleteWindow` → `ConfirmDelete`; `ModalWindow`/`buttons` → `.scrim/.dialog/.btn`.
- **Ф3 — налаштування/інтеграції:** `SettingsWindow`+`*Settings` → `SettingsDialog`/`IntegrationConfig`.
- **Ф4 — PIN + імпорт/експорт + welcome/loading:** `PinCode*`→`PinView`, `dataImporter`-таби→`Export/ImportView`,
  `NotLoggedIn`→`WelcomeView`, `LoadingWindow`→`LoadingView` (реальні прапори).
- **Ф5 — поліш:** адаптив, прибрати мертвий CSS, `npm run build` + смоук-тест реальних флоу.

## Статус: ✅ усі фази Ф0–Ф5 завершені; dev і prod (`npm run build` + preview) працюють.

## Журнал рішень
- Гілка `redesign` від `codex`. `reference/styles.css` → `src/design.css`; шрифти в `index.html`.
- **Новий презентаційний шар** у `src/core/components/redesign/` (geometry, palette, format,
  visual, portfolio, DonutChart, TreemapChart, HoldingRow, EditDialog, ConfirmDelete,
  LoadingView, PinPad, SettingsDialog). Споживає `Props`/`AssetDTO`/`PriceService`.
  Механіка (`ColdWallet`, `UserDataService`, лоадери, сервіси, storage, `CypherService`,
  `dataImporter`, валідації) **не змінювалась**.
- `AssetsDashboard` переписано на `.app/.side/.main`; рендериться як JSX-компонент
  (`<AssetsDashboard props={...}/>`), бо має власні хуки (стара функціональна форма ламала
  правила хуків — увесь стан раніше жив у `ColdWallet`).
- **Highcharts → рукописний SVG** (донат/тримап). FirstPageStats/PieChart/TreeChart стали
  мертвими → tree-shaking прибрав highcharts (чанк `charts` ~0.07 kB).
- `assetColor`: детермінований HSL з коду валюти (реальні дані мають 13k+ довільних валют,
  фіксованої палітри немає). Гліф у чіпі = тикер (BTC), не символ (₿).
- `EditDialog`: ручні активи без вибору джерела (у реальній моделі вони завжди Cash/Manual).
- `LoadingView` керується **реальними** прапорами лоадерів; показ поки `!loaded`.
- Старі презентаційні компоненти **не видалено** (частина ще тягнеться через
  `IntegrationSettings`→валідації/пади; частина мертва) — див. питання нижче.
- Фікс `vite.config` (ccxt не екстерналізувати) вже був у `codex` з міграції.

## Питання на кінець сесії (для відповіді зранку)
1. Видалити мертві старі компоненти (Asset, IntegrationAsset, FirstPageStats/Pie/Tree,
   ModalWindow, старі buttons, PinCode/Dial, NewAssetWindow, AssetEditor, *Settings UI…)
   + прибрати залежності `highcharts`/`highcharts-react-official` і порожній `charts`-чанк?
   (Автовидалення ризиковане через переплетені імпорти валідацій — тому лишив, чекаю «так».)
2. Додати кнопку «Expand» → повноекранний санбьорст (`ChartModal` з демо)? Старого аналога
   не було; це додаткова фіча.
3. Гліфи монет: зараз тикер (BTC). Зробити мапу символів (₿, Ξ, $…) для популярних?
4. Інтеграції з **реальними** API-ключами не тестувались (лише demo). Валідації збережені,
   але e2e з живими ключами не перевірено.
