<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the TUPSA system. PostHog is now initialized on the client side via a lightweight `PostHogInit` component in the root layout, with a reverse proxy configured in `next.config.mjs` to route events through `/ingest` and improve reliability. A server-side PostHog client (`lib/posthog-server.ts`) handles event capture from Server Actions and API routes using `posthog-node`. User identification is performed on every dashboard load via a `PostHogIdentify` component that links the authenticated user's ID, email, and name to their PostHog profile.

| Event | Description | File |
|---|---|---|
| `user_authenticated` | User successfully authenticated with valid credentials | `auth.ts` |
| `point_created` | User created a new ponto cantado (ritual song point) | `components/points/point-form.tsx` |
| `point_updated` | User updated an existing ponto cantado | `components/points/point-form.tsx` |
| `study_material_created` | User created a new study material | `components/studies/study-material-form.tsx` |
| `study_material_updated` | User updated an existing study material | `components/studies/study-material-form.tsx` |
| `notification_sent` | User sent a notification/announcement to members | `components/notifications/notification-form.tsx` |
| `monthly_payment_marked` | Monthly payment status updated for a member (paid or unpaid) | `actions/monthly-fees.ts` |
| `amaci_bath_toggled` | Pai de Santo marked or unmarked an amaci bath for a member | `actions/amaci.ts` |
| `study_file_uploaded` | User uploaded a file for a study material | `app/api/studies/upload/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](https://us.posthog.com/project/409982/dashboard/1544705)
- [User Logins Over Time](https://us.posthog.com/project/409982/insights/8xPLfD4s)
- [Content Creation by Type](https://us.posthog.com/project/409982/insights/V04ojfpm)
- [Login to Content Creation Funnel](https://us.posthog.com/project/409982/insights/GlCuOpsU)
- [Monthly Payments Marked](https://us.posthog.com/project/409982/insights/A0Pf7pHV)
- [Notifications Sent](https://us.posthog.com/project/409982/insights/PsExFyWe)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
