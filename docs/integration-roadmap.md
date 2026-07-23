# Nevamis Integration Roadmap

Internal planning document. Last reviewed: 2026-07-23.

## Ground rules

1. Never state publicly that an integration exists until it is implemented and tested. Website, agent knowledge base, and sales conversations all follow this rule.
2. Integrations marked **Live / in use** below are verified in the current Nevamis stack. Everything else is **Evaluate on demand**: no build work starts until a real client need or a roadmap service requires it.
3. Every new integration gets the evaluation template in this document filled out before any code is written.
4. Credentials are never stored in this document or in any public file.

## Status legend

- **Live / in use**: implemented, tested, running in the current product.
- **Evaluate on demand**: not built. Evaluate with the template below when a client or a planned service requires it.

---

## Communications

| Integration | Scope | Status |
|---|---|---|
| Twilio | Telephony and SMS | **Live / in use** |
| ElevenLabs | Voice agents (AI receptionist) | **Live / in use** |
| Email (provider TBD) | Transactional and follow-up email | Evaluate on demand |
| Website chat | Web and messaging concierge channel | Evaluate on demand |

Notes: Twilio carries the phone line and SMS. ElevenLabs runs the voice agent on top of it. Email and website chat become relevant when Instant Lead Follow-Up and the Web and Messaging Concierge move from planned to build.

## Scheduling

| Integration | Scope | Status |
|---|---|---|
| Cal.com | Booking and availability for the AI Front Desk | **Live / in use** |
| Google Calendar | Client-side calendar sync | Evaluate on demand |
| Microsoft Outlook Calendar | Client-side calendar sync | Evaluate on demand |
| Calendly | Clients who already use it | Evaluate on demand |
| Industry scheduling systems | Trade-specific booking tools | Evaluate on demand |

Notes: Cal.com is the verified booking path today. Google and Outlook calendars are the most likely client requests; Cal.com's own calendar connections may cover many of these cases without a direct integration.

## CRM

| Integration | Scope | Status |
|---|---|---|
| GoHighLevel | All-in-one CRM common in agency and trades markets | Evaluate on demand (likely next; see evaluation below) |
| HubSpot | Mid-market CRM | Evaluate on demand |
| Salesforce | Enterprise CRM | Evaluate on demand |
| Pipedrive | SMB sales pipeline | Evaluate on demand |
| Zoho | SMB suite | Evaluate on demand |
| Client-specific systems | Whatever a client already runs | Evaluate on demand, quoted separately |

Notes: No CRM integration is live. Automatic Lead Tracking (roadmap priority 2) is the service that forces this decision. Choose the first CRM based on what actual pilot clients already use, not on market share.

## Field service and job management

| Integration | Scope | Status |
|---|---|---|
| Jobber | Field service management for trades | Evaluate on demand (likely next; see evaluation below) |
| Housecall Pro | Field service management | Evaluate on demand |
| ServiceTitan | Larger trades operations | Evaluate on demand |
| Shop-management systems | Automotive | Evaluate on demand |
| Property-management systems | Restoration and property services | Evaluate on demand |

Notes: This category matters most for the trades-first strategy. Jobber is the most probable first target given the Canadian SMB trades focus.

## Payments

| Integration | Scope | Status |
|---|---|---|
| Stripe | Checkout, subscriptions, setup fees | **Live / in use (test mode)** |
| Accounting or invoicing system | QuickBooks or similar, for revenue reconciliation | Evaluate on demand |

Notes: Stripe is integrated and verified in test mode only. Do not describe live payment processing publicly until production mode is enabled, tested, and the owner approves the commercial terms it enforces. Accounting integration becomes relevant for Revenue Clarity (attribution and collected-revenue reconciliation).

## Automation

| Integration | Scope | Status |
|---|---|---|
| n8n | Self-hosted workflow automation | Evaluate on demand |
| Make | Hosted automation | Evaluate on demand |
| Zapier | Hosted automation, widest connector coverage | Evaluate on demand |
| Direct APIs | Custom code against vendor APIs | Default where reliability matters |

Notes: Prefer direct APIs for anything on the critical call-to-booking path. Use an automation layer only for low-risk glue work, and treat it as a dependency with its own failure modes and costs.

## Data and reporting

| Integration | Scope | Status |
|---|---|---|
| Secure database | System of record for leads, calls, outcomes | Evaluate on demand |
| CRM reporting | Reporting inside whichever CRM is adopted | Evaluate on demand |
| Dashboard system | Owner-facing reporting | Evaluate on demand |
| Call and message event store | Durable log of call and message events | Evaluate on demand |

Notes: A call and message event store is the quiet prerequisite for the Daily Owner Brief and Revenue Clarity. Design it early even if the dashboard comes later.

---

## Evaluation template

Fill this out for every potential integration before building. Copy the checklist, answer every line, then assign a priority.

- Client demand: who is asking, how many, and what they pay
- API availability: public API, partner-only, or none
- Authentication model: OAuth, API key, per-client credentials
- Required permissions: minimum scopes needed, least privilege
- Webhooks: what events the vendor pushes, and delivery guarantees
- Rate limits: documented limits and realistic call volume
- Sandbox availability: can it be tested without touching real client data
- Data accessed: exactly what is read
- Data written: exactly what is created or changed
- Failure behavior: what the agent and workflows do when the vendor is down
- Support burden: what breaks for clients and how often it needs attention
- Vendor cost: subscription tier or per-call cost required for API access
- Lock-in risk: how hard it is to move a client off this vendor later
- Priority: now, next, later, or reject

---

## Evaluation: Jobber

Conservative assessment from public API knowledge only. Verify every line against current Jobber developer documentation before building. Nothing here is a public claim.

- **Client demand**: Expected high among Canadian trades (Jobber is a Canadian company with strong home-service penetration). No confirmed Nevamis client demand yet; validate with pilot clients first.
- **API availability**: Public GraphQL API through a developer program. Requires creating a developer account and app.
- **Authentication model**: OAuth 2.0 per client account. Each client authorizes the Nevamis app against their own Jobber account.
- **Required permissions**: Scoped OAuth permissions. Likely minimum: read/write clients, requests, and jobs; read schedule availability. Confirm exact scope names in current docs.
- **Webhooks**: Webhook support exists for object changes (clients, jobs, and similar). Confirm event coverage and retry behavior before relying on it.
- **Rate limits**: GraphQL cost-based limiting is documented. Budget queries conservatively; assume limits are per-account.
- **Sandbox availability**: Developer test accounts are available through the developer program. Do not test against a real client account.
- **Data accessed**: Client records, service requests, job details, schedule availability.
- **Data written**: New client records, service requests, notes, and potentially bookings. Start read-plus-request-creation only; add deeper writes later.
- **Failure behavior**: If Jobber is unreachable, the agent falls back to capturing details and alerting a human. Never report a job as created without a success response.
- **Support burden**: Moderate. OAuth token refresh per client, occasional API version changes, and client-side configuration differences.
- **Vendor cost**: API access itself is free through the developer program; clients need their own paid Jobber subscription. Confirm partner program terms.
- **Lock-in risk**: Low for Nevamis (per-client authorization, no Nevamis data trapped in Jobber). The client's own lock-in to Jobber is their choice.
- **Priority**: Next. Strongest fit with the trades-first strategy and the Smarter Job Intake service. Build when at least one paying or pilot client uses Jobber and asks for it.

## Evaluation: GoHighLevel

Conservative assessment from public API knowledge only. Verify every line against current GoHighLevel (LeadConnector) developer documentation before building. Nothing here is a public claim.

- **Client demand**: Common in agency-run and marketing-heavy trades businesses. No confirmed Nevamis client demand yet; validate before building.
- **API availability**: Public REST API (API 2.0 / LeadConnector). Marketplace app model for third-party developers.
- **Authentication model**: OAuth 2.0 for marketplace apps; location-level (sub-account) API keys also exist. Prefer OAuth for anything multi-client.
- **Required permissions**: Scope-based access per resource (contacts, conversations, calendars, opportunities). Request the minimum set.
- **Webhooks**: Webhook events available for contacts, conversations, appointments, and opportunities. Confirm current event list and delivery semantics.
- **Rate limits**: Documented per-app and per-location rate limits. Confirm current numbers; design for burst limits around call spikes.
- **Sandbox availability**: Test sub-accounts can be created under an agency account. Weaker formal sandbox than some vendors; isolate testing carefully.
- **Data accessed**: Contacts, conversation history, calendar availability, pipeline/opportunity stages.
- **Data written**: Contacts, notes, appointments, opportunity stage changes, SMS/email messages if used as a sending channel.
- **Failure behavior**: On API failure, queue the write, alert a human, and never confirm a booking or message the vendor did not accept.
- **Support burden**: Moderate to high. Fast-moving platform, frequent product changes, and wide variation in how each client's account is configured.
- **Vendor cost**: Clients need their own GoHighLevel subscription. API access tied to marketplace app approval; confirm current terms and any fees.
- **Lock-in risk**: Moderate. GoHighLevel bundles CRM, messaging, and calendars, so deep integration can entangle several Nevamis services with one vendor. Keep the Nevamis event store as the system of record.
- **Priority**: Next. Evaluate head-to-head with Jobber when Automatic Lead Tracking starts; the winner is whichever system real pilot clients actually use.

---

## Decision rule for what gets built next

1. A real client or signed pilot uses the system and needs the connection, or a roadmap service cannot ship without it.
2. The evaluation template above is completed and reviewed.
3. A sandbox test passes before any real client data is touched.
4. The integration ships with a tested failure path: the agent degrades to capture-and-alert, never to false confirmation.
5. Only after implementation and testing does the integration appear anywhere public.
