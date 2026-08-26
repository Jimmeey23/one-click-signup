# Momence Lead Creation Webhook Spec

This document only covers Momence lead creation webhook submissions for Mumbai and Bengaluru forms.

Token values must remain in environment variables. Do not hard-code lead tokens in source files or documentation.

## Momence Lead Creation Overview

You can create HTML forms, landing-page forms, or other website forms to collect leads that are automatically created in the Momence dashboard. Make a `POST` request to the lead creation endpoint with the relevant token to create a lead.

Create a custom lead source for each form where possible. This makes it easier to segment leads in Momence and pipe them into Sequences by `sourceId`.

Momence requires at least one of these fields to create a lead:

```txt
email
phoneNumber
```

## Webhook Variables

| Variable | Mumbai | Bengaluru |
| --- | --- | --- |
| Host ID | `MOMENCE_LEADS_HOST_ID_MUM=13752` | `MOMENCE_LEADS_HOST_ID_BLR=33905` |
| Source ID | `MOMENCE_LEADS_SOURCE_ID_MUM=8082` | `MOMENCE_LEADS_SOURCE_ID_BLR=11615` |
| Token | `MOMENCE_API_TOKEN` | `MOMENCE_API_TOKEN_BLR` |
| Lead URL | `MOMENCE_LEADS_URL_MUM=https://api.momence.com/integrations/customer-leads/13752/collect` | `MOMENCE_LEADS_URL_BLR=https://api.momence.com/integrations/customer-leads/33905/collect` |

Mumbai Momence dashboard values:

```txt
URL=${MOMENCE_LEADS_URL_MUM}
Token=${MOMENCE_API_TOKEN}
```

## City Routing

Use Bengaluru variables when:

```txt
abVariant=bengaluru
```

Use Mumbai variables for all other submissions.

## Request

Method:

```txt
POST
```

Headers:

```txt
Content-Type: application/json
Authorization: Bearer ${MOMENCE_API_TOKEN or MOMENCE_API_TOKEN_BLR}
```

## Lead Payload

```json
{
  "token": "${MOMENCE_API_TOKEN or MOMENCE_API_TOKEN_BLR}",
  "sourceId": "${MOMENCE_LEADS_SOURCE_ID_MUM or MOMENCE_LEADS_SOURCE_ID_BLR}",
  "firstName": "${firstName}",
  "lastName": "${lastName}",
  "email": "${email}",
  "phoneNumber": "${phoneE164}",
  "time": "Flexible / Needs Recommendation",
  "center": "${center}",
  "type": "${classType}",
  "waiverAccepted": "${accepted_or_declined}",
  "whatsapp_consent": "${opted_in_or_not_opted_in}",
  "whatsapp_consent_at": "${whatsappConsentAt}",
  "event_id": "${leadStage}_${memberId_or_prospect}_${timestampMs}",
  "utm_source": "${utmSource}",
  "utm_medium": "${utmMedium}",
  "utm_campaign": "${utmCampaign}",
  "utm_term": "${utmTerm}",
  "utm_content": "${utmContent}",
  "gclid": "${gclid}",
  "fbclid": "${fbclid}",
  "landing_page": "${landingPage}",
  "referrer": "${referrer}",
  "ab_variant": "${abVariant}",
  "lead_stage": "${partial_or_completed}"
}
```

## Momence Base Parameters

These are the standard Momence lead creation parameters supported by the webhook.

| Momence parameter | Required | Rule |
| --- | --- | --- |
| `token` | Yes | Identifies the Momence account; use `MOMENCE_API_TOKEN` for Mumbai or `MOMENCE_API_TOKEN_BLR` for Bengaluru |
| `email` | Conditional | Lead email; either `email` or `phoneNumber` must be filled |
| `phoneNumber` | Conditional | Lead phone number in E.164 format; either `phoneNumber` or `email` must be filled |
| `firstName` | No | Lead first name; maximum 100 characters |
| `lastName` | No | Lead last name; maximum 100 characters |
| `zipCode` | No | Lead zip code |
| `discoveryAnswer` | No | Where the lead found out about the studio; maximum 1000 characters |
| `sourceId` | No | Concrete lead source, such as a specific landing page form; used for segmentation and Sequences |

## Field Rules

| Momence field | Variable / value | Rule |
| --- | --- | --- |
| `token` | `MOMENCE_API_TOKEN` or `MOMENCE_API_TOKEN_BLR` | Must match selected city |
| `sourceId` | `MOMENCE_LEADS_SOURCE_ID_MUM` or `MOMENCE_LEADS_SOURCE_ID_BLR` | Mumbai `8082`; Bengaluru `11615` |
| `firstName` | `firstName` | Required |
| `lastName` | `lastName` | Required for completed signup; empty string allowed for partial lead |
| `email` | `email` | Required |
| `phoneNumber` | `phoneE164` | Required; format `${countryCode}${phoneNumberDigitsOnly}` |
| `time` | `Flexible / Needs Recommendation` | Static value |
| `center` | `center` | Resolved from `homeLocationId` |
| `type` | `classType` | Mumbai uses submitted `classType` or `Barre 57`; Bengaluru sends `Barre 57` |
| `waiverAccepted` | `accepted` or `declined` | `accepted` when waiver is complete; `declined` for partial lead |
| `whatsapp_consent` | `opted_in` or `not_opted_in` | Based on WhatsApp consent checkbox |
| `whatsapp_consent_at` | `whatsappConsentAt` | ISO timestamp when opted in, otherwise empty string |
| `event_id` | `eventId` | `${leadStage}_${memberId_or_prospect}_${timestampMs}` |
| `utm_source` | `utmSource` | Defaults to `website` |
| `utm_medium` | `utmMedium` | Mumbai default `trial-landing`; Bengaluru default `bengaluru-landing` |
| `utm_campaign` | `utmCampaign` | Mumbai default `open-barre-trial`; Bengaluru default `bengaluru-first-class-offer` |
| `utm_term` | `utmTerm` | Empty string if unavailable |
| `utm_content` | `utmContent` | Empty string if unavailable |
| `gclid` | `gclid` | Empty string if unavailable |
| `fbclid` | `fbclid` | Empty string if unavailable |
| `landing_page` | `landingPage` | Mumbai default `https://trial.physique57india.com/`; Bengaluru default `https://trial.physique57india.com/bengaluru` |
| `referrer` | `referrer` | Empty string if unavailable |
| `ab_variant` | `abVariant` | `bengaluru` for Bengaluru; otherwise submitted variant or empty string |
| `lead_stage` | `partial` or `completed` | `partial` for abandoned/contact-only capture; `completed` after member creation |

## Center Values

| City | `homeLocationId` | `center` value |
| --- | ---: | --- |
| Mumbai | `9030` | `Kwality House, Kemps Corner` |
| Mumbai | `29821` | `Supreme HQ, Bandra` |
| Bengaluru | `22116` | `Kenkere House` |
| Bengaluru | `36372` | `The Studio - By Copper & Cloves` |
| Bengaluru | `383332` | `Plash Pilates` |

Fallback center:

```txt
Physique 57 India
```

## Submission Stages

Partial lead:

```txt
lead_stage=partial
waiverAccepted=declined
memberId omitted
event_id=partial_prospect_${timestampMs}
```

Completed lead:

```txt
lead_stage=completed
waiverAccepted=accepted
memberId=${createdMomenceMemberId}
event_id=completed_${memberId}_${timestampMs}
```
Secrets: 
MOMENCE_API_TOKEN=DOjMVL37Q5;
MOMENCE_API_TOKEN_BLR=qy71rOk8en
MOMENCE_LEAD_COLLECTION_URL_MUMBAI : https://api.momence.com/integrations/customer-leads/13752/collect
MOMENCE_LEAD_COLLECTION_URL_BLR : https://api.momence.com/integrations/customer-leads/33905/collect