Maintenance mode banner

Overview
- A client component `MaintenanceBanner` is rendered at the top of the site when maintenance mode is enabled.
- The banner reads `maintenance_mode` from the `chronicles_system_settings` table and an optional `maintenance_message` from `chronicles_settings`.
- To avoid exposing service keys in the browser, the banner now uses the server API `GET /api/chronicles/maintenance` and polls every few seconds for near-realtime updates.
- The banner is rendered inline at the top of the page (non-fixed) and spans the full width of the site. It adapts to both light and dark themes.
- Long messages automatically use an animated marquee so the full text is visible without horizontal scrolling.
- Users can temporarily dismiss the banner (small X button) — dismissal is stored in localStorage for 6 hours by default.

How to enable/disable maintenance (via admin UI)
- Use the admin page: `/admin/chronicles/settings` → "Feature Toggles" → toggle "Maintenance Mode" and optionally update the "Maintenance Message". Changes are saved to the appropriate tables.

Direct SQL examples (for reference)
- Enable maintenance (turn on):

  UPDATE public.chronicles_system_settings
  SET maintenance_mode = true, updated_at = CURRENT_TIMESTAMP
  WHERE id = (SELECT id FROM public.chronicles_system_settings LIMIT 1);

- Disable maintenance:

  UPDATE public.chronicles_system_settings
  SET maintenance_mode = false, updated_at = CURRENT_TIMESTAMP
  WHERE id = (SELECT id FROM public.chronicles_system_settings LIMIT 1);

Add or update a custom maintenance message

  INSERT INTO public.chronicles_settings (setting_key, setting_value)
  VALUES ('maintenance_message', 'We are performing scheduled maintenance. Our team will be back shortly.')
  ON CONFLICT (setting_key) DO UPDATE
  SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP;

Notes
- The API endpoints used:
  - GET `/api/chronicles/maintenance` — returns { maintenance_mode, maintenance_message }
  - POST `/api/chronicles/admin/settings` — accepts { type: 'system', data: { ... } } to update system-level settings including maintenance_mode and maintenance_message
- Polling interval is 3 seconds to provide near-realtime updates without exposing server keys to the client.
