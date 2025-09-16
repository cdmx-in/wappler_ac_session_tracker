# Wappler App Connect — Session Tracker

This repository contains a compact Wappler App Connect extension that adds a Session Tracker component.

Purpose
-App Connect component that tracks user activity, triggers a "notify" when time remaining is low, and triggers a "timeout" when the session expires.

#### Created and Maintained by: Lavi Sidana

## Session Tracker Component
The Session Tracker component monitors user activity and dispatches events when a configured inactivity threshold is approaching or reached. It's useful to warn users before session expiry and to trigger logout or cleanup flows when the session times out.

## Component

### Session Tracker
Tracks user session events and timeout. A compact component that tracks activity and fires notify and timeout events. It supports enabling/disabling which activity event types should reset the timers.

## Properties
Properties available as attributes on the component element.

- ID: Unique identifier for the component
- Max Idle time (seconds): Total time of inactivity before session timeout
- Notify timeout (seconds): Time remaining when to notify before timeout
- Keydown: Enable tracking keydown events as activity
- Click: Enable tracking click events as activity
- Scroll: Enable tracking scroll events as activity
- Input: Enable tracking input events as activity

### Session tracker (`session-tracker`)
- Reset: Reset the tracker

## Events

- Timeout: Fired when the session times out
- Notify: Fired when approaching timeout
- Reset: Fired when timers are reset.
