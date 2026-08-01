# Integration Marketplace

Connect ZOLANZO with third-party software using managed marketplace connectors.

## Available Starter Connectors

- **Generic Webhook** (`generic.webhook`)
- **Slack** (`slack`)
- **Microsoft Teams** (`microsoft.teams`)
- **Google Workspace** (`google.workspace`)
- **Zapier** (`zapier`)
- **Make** (`make`)
- **n8n** (`n8n`)

## Connector Lifecycle

```text
install → configure → authenticate → enable ↔ disable → upgrade → uninstall
```

All integrations operate strictly on top of `/api/v1` and Webhook v1 contracts.
