### ⚡️ **Debugging & Test Fixing Process (Mandatory)**

Claude MUST follow this process step-by-step when fixing failing tests or debugging bugs:

1. **Identify the centralized pattern causing multiple failures** — DO NOT patch failures individually.
2. **Find the root architectural violation** (SRP / SoC / DRY).
3. **Create or fix the centralized utility/service** to resolve the root cause.
4. **Apply the centralized fix** across affected code.
5. **Update test expectations** to match the correct, centralized behavior.

### ❌ Anti-Patterns to Avoid
- Fixing test failures one by one.
- Duplicating fixes across files.
- Mixing unrelated concerns.
- Hardcoding values instead of using configuration.
- Inconsistent error handling.