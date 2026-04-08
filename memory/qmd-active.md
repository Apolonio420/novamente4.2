# QMD Active - novamente4.2

**Project**: novamente4.2 (partner storefront platform)
**Branch**: main
**Last action**: Universal Nova assistant upgrade — auth detection, page context, ticket submission
**State**: Build passing (tsc errors are all pre-existing, none from new code), committed 5c73c9a
**Blockers**: DB migration pending (email_captures table + subscription fields from previous sessions)

## Completed: Universal Nova Upgrade
- /api/assistant/identify — role detection (visitor/partner/admin)
- /api/assistant/ticket — ticket creation from chat
- lib/hooks/useAssistantAuth + usePageContext — client hooks
- PublicAssistant upgraded: FAB dot, header role, ticket trigger, ticket form UI
- Workspace AssistantWidget removed (Nova handles it)
- Next: end-to-end verification with a real partner login
