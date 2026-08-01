# API Keys

API keys provide long-lived credentials for server applications and automated scripts.

## Headers

Pass your API key in the `X-Api-Key` request header:

```http
X-Api-Key: zk_live_1234567890abcdef
```

## Security Best Practices

- Store API keys in environment variables or secure secret managers.
- Rotate keys periodically or immediately upon credential compromise.
- Restrict keys to only the necessary scopes (`campaigns.read`, `assignments.read`, etc.).
