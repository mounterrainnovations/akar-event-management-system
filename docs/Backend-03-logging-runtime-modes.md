# Backend 03 - Logging Runtime Modes

## 1. Objective

Add runtime controls to switch logging behavior globally without changing code.

## 2. New Runtime Controls

Implemented in `backend/lib/logger.ts`:

- `LOG_ENABLED=true|false`
  - `false` disables all Winston logs globally (`silent` mode).
- `LOG_MODE=basic|errors|full`
  - `basic`: info and above
  - `errors`: error only
  - `full`: verbose development/debug logging
- `LOG_LEVEL=<winston-level>` (optional override)
  - If present, this overrides `LOG_MODE`.

## 3. Behavior Priority

1. If `LOG_ENABLED=false`, logs are disabled regardless of mode/level.
2. If `LOG_LEVEL` is set, it overrides `LOG_MODE`.
3. Otherwise, `LOG_MODE` determines the effective level.

## 4. Documentation Updated

- `backend/README.md` includes usage examples for:
  - `LOG_ENABLED`
  - `LOG_MODE`
  - `LOG_LEVEL`

## 5. Verification

- Build check passed after the logger changes.
- Lint status remains affected by unrelated existing issues in `backend/components/ui/floating-dock.tsx`.

