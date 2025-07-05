# 📁 `.cli/README.md`

This directory contains configuration files that define how architecture-aware CLI agents interact with the system. It supports shared context, permissions, and deployment logic across multiple agents such as Gemini CLI, Claude CLI, or future AI-based development assistants.

---

## 🧙 Purpose

`.cli/settings.json` acts as the **universal specification** for CLI behavior across agents. It outlines:

- Context file location (`CLI_CONTEXT.md`)
- Onboarding structure (`onboarding.md`)
- Permissions for command execution
- Observability configuration
- Migration handling
- Version-aware schema routing

Agents may use `.cli/settings.json` directly, or delegate from their own folder.

---

## 🤝 Multi-Agent Support

Supported integrations:

- **Gemini CLI**: May use `.gemini/settings.json` with delegation key:
  ```json
  {
    "contextFileName": "docs/CLI_CONTEXT.md",
    "delegateSettingsTo": ".cli/settings.json"
  }```

- **Claude CLI**: Can use `.claude/settings.json` with same delegation pattern:

```json
{
  "delegateSettingsTo": ".cli/settings.json"
}
```

- Agents are expected to fall back to `.cli/settings.json` when additional configuration is needed beyond their native scope.