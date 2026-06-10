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

## Журнал рішень (заповнюється по ходу)
- (старт) Гілка `redesign` від `codex`. `reference/styles.css` скопійовано в `src/design.css`.

## Питання на кінець сесії (заповнюється по ходу)
- (поки немає)
