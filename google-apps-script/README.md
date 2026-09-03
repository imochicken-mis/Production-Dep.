# KPI email trigger setup

The web pages in this project do not run while a Google Sheet is being edited, so the automatic email must run in the Google Apps Script project bound to the Sheet.

1. Open the production Google Sheet, then choose **Extensions → Apps Script**.
2. Create a script file named `KpiEmailAutomation` and paste in `KpiEmailAutomation.gs` from this folder. Keep the existing backend code, because this file uses its `KPI_ALERT_CONFIG` and mail helper.
3. Save, select `setupKpiEditTrigger` in the function selector, and run it once. Approve the Google permissions to send mail and manage triggers.
4. Confirm **Triggers** now contains one trigger: `onKpiSheetEdit`, event type **From spreadsheet → On edit**.
5. Edit/paste a value in the configured KPI column. If the value is outside its configured standard, all configured recipients receive an email. Only after every email succeeds, the same row's `Status` becomes `Sent`.

The trigger applies to the sheets already listed in `KPI_ALERT_CONFIG`: `Live_Bird_Bay_Mortality_Rate_%`, `Slaughter_Line_Efficiency_%`, `Packing_Line_Efficiency_%`, `Dressed_Yield_%`, and `Chill_Loss_%`.

It deliberately does not re-send rows whose Status is already `Sent`, and it ignores edits to the Status column. This avoids duplicate mail and trigger loops. Running setup also removes the old `dailyKpiCheck` trigger so it cannot race the new event-based trigger. If a delivery partly fails, a later retry skips recipients that already received the message.
