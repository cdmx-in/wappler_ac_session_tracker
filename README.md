# Wappler App Connect — Session Tracker

This repository contains a compact Wappler App Connect extension that adds a `dmx-session-tracker` component.

Purpose
-App Connect component that tracks user activity, triggers a "notify" when time remaining is low, and triggers a "timeout" when the session expires.

#### Created and Maintained by: Lavi Sidana

## Session Tracker Component
The `dmx-session-tracker` component monitors user activity and dispatches events when a configured inactivity threshold is approaching or reached. It's useful to warn users before session expiry and to trigger logout or cleanup flows when the session times out.

## Component

### Session Tracker (`dmx-session-tracker`)
A compact component that tracks activity and fires `notify` and `timeout` events. It supports enabling/disabling which activity event types should reset the timers.

## Properties
Properties available as attributes on the component element.

- **ID** — Component ID (standard HTML id).
- **Max Idle time** — Total timeout in seconds. When this time elapses without activity the component dispatches the `timeout` event. Default: `300` (5 minutes).
- **Notify timeout** — Notify timeout in seconds. When the time equals this value the component dispatches the `notify` event. Default: `240` (4 minute).
-  **Keydown** — Option to allow listen to `keydown` events as activity.
-  **Click** — Option to allow listen to `click` events as activity.
-  **Scroll** — Option to allow listen to `scroll` events as activity.
-  **Input** — Option to allow listen to `input` events as activity.

### Session tracker (`session-tracker`)
- **Reset**: Action to reset the timer.

## Events

- `notify` — Fired when the time reaches the `Notify timeout` threshold (use this to show a warning UI or call an App Connect action to extend the session).
- `timeout` — Fired when the total inactivity time reaches `Max Idle time` (use this to log out the user, clear data, or redirect).
