# Channel Adapters

Providers are adapters. The Notification Hub never imports vendor SDKs.

## Contract

```ts
deliver(input: ChannelDeliveryInput): Promise<ChannelDeliveryResult>
```

Each adapter declares:

- `providerKey`
- `channels`
- `capabilities` (`email`, `sms`, `push`, `in_app`, `webhook`, `templates`, `batch`, `priority`)

## Built-in adapters

| Provider | Channels | Live delivery |
| --- | --- | --- |
| memory | all | **yes** (tests / local) |
| resend | email | stub queue |
| smtp | email | stub queue |
| sendchamp | sms | stub queue |
| firebase | push | stub queue |
| webhook | webhook | stub queue |
| in_app | in_app | stub queue |

## Selection

```ts
selectNotificationAdapter({ channel: "sms" })
selectNotificationAdapter({ channel: "email", preferLive: true }) // memory
```

Default catalog keys (for job `providerKey` before live wiring):

- email → resend
- sms → sendchamp
- push → firebase
- in_app → in_app
- webhook → webhook

Dispatch with `preferLive: true` uses Memory so local/test paths actually deliver.
