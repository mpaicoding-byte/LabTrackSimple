# Authentication Flow Analysis Report

Generated: 2026-01-14T16:31:13.720Z

## Summary
- Total network requests captured: 57
- Auth-related requests: 29
- Responses containing tokens: 1

## Auth-Related Endpoints

### GET https://static.concursolutions.com/static/css/cnqr-view/signin.7c77a43722de89b8bb0d1ee93efa1fa6.css
- Times called: 1

### GET https://static.concursolutions.com/nui/signin/master/vendor.bundle.f490f71f0e2aea6f7aa9.css
- Times called: 1

### GET https://static.concursolutions.com/nui/signin/master/main.bundle.397201b7ea6dd19a11c6.css
- Times called: 1

### GET https://static.concursolutions.com/nui/signin/master/translations/main.bundle.397201b7ea6dd19a11c6.en.41779.js
- Times called: 1

### GET https://static.concursolutions.com/nui/signin/master/vendor.bundle.f490f71f0e2aea6f7aa9.js
- Times called: 1

### GET https://static.concursolutions.com/nui/signin/master/main.bundle.397201b7ea6dd19a11c6.js
- Times called: 1

### GET https://static.concursolutions.com/static/images/signin/signin-20240509-04.webp
- Times called: 1

### GET https://consent.trustarc.com/analytics
- Times called: 2

### POST https://eu2.concursolutions.com/nui/signin/nui-shell/api/logs
- Times called: 4
- POST Data: `{"res":"{\"follow\":null,\"loginOptions\":[{\"authType\":\"saml2\",\"friendlyName\":\"asqo0oaz2.accounts.cloud.sap\",\"redirectUrl\":\"https://www-emea.api.concursolutions.com/sso/saml2/V2/authnreques`

### GET https://www-emea.api.concursolutions.com/sso/saml2/V2/authnrequest/68f5ef31-0a23-4e94-a82d-39e5de71fb62/1731410677648
- Times called: 1

### POST https://asqo0oaz2.accounts.cloud.sap/saml2/idp/sso/asqo0oaz2.accounts.ondemand.com
- Times called: 2
- POST Data: `SAMLRequest=PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c2FtbDJwOkF1dGhuUmVxdWVzdCB4bWxuczpzYW1sMnA9InVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDpwcm90b2NvbCIgQXNzZXJ0aW9uQ29uc3VtZXJTZXJ2aWNlVVJMPSJo`

### GET https://asqo0oaz2.accounts.cloud.sap/universalui/assets/fn/end-user-ui/application-467bf3c8937d6a63652f86388d4c74701bc69471e18e6539dcb04c8a576d9526.css
- Times called: 2

### GET https://asqo0oaz2.accounts.cloud.sap/ui/public/cached/tenant/v/1/tenant_logo
- Times called: 2

### GET https://asqo0oaz2.accounts.cloud.sap/universalui/assets/application-6e697c3bafd8349f8f61afa8a038c8ba6e706cdd8601e285e9549ba6b073c448.js
- Times called: 2

### GET https://asqo0oaz2.accounts.cloud.sap/universalui/assets/72-Regular-full-13166772a25bed9a0f7449132e3a6283baf5ac3060ee5bddbb7b538ecef04fbf.woff2
- Times called: 2

### GET https://asqo0oaz2.accounts.cloud.sap/universalui/assets/72-Black-full-9ab17b2e3534a1b1999647d277b538da71436275f606f3b4611fa24cda24c3fe.woff2
- Times called: 2

### GET https://asqo0oaz2.accounts.cloud.sap/universalui/assets/72-Bold-full-865699d7fc86329695b5a173e21f5f58c8957c8403d682d39139064619a0a129.woff2
- Times called: 2

### GET https://asqo0oaz2.accounts.cloud.sap/universalui/assets/SAP-icons-minimized-e6452e71809a0d6c0af97b9ca6381af948ddca8c3613e6fad3090a152f60e7c1.woff2
- Times called: 1

## 🎯 Token Responses Found

### https://eu2.concursolutions.com/
```json
<!DOCTYPE html><html lang="en">
      <head>
          <meta charset="utf-8" />
          <meta name="generator" content="nui">
          <title data-react-helmet="true">Sign in to Concur | Concur Solutions</title>
          <meta name="app-version" content="7.65.13" />
          <meta name="expires" content="0">

          <link data-xpd crossorigin="anonymous" integrity="sha384-mBvSc5KKT7JTw06sxn7Y1M2h17VM17YfbNRCNrWu363+TLIhzJ79wAW6aA1q87LN" rel="stylesheet" type="text/css" href="//static.con...
```

## Can This Be Done Via API?

Based on the captured traffic, look for:
1. **OAuth token endpoint** - If there's a POST to /oauth/token with client_id/client_secret, you may be able to call it directly
2. **SAML assertion** - If SAML is used, browser automation is likely required
3. **OIDC flow** - Check if there's an authorization_code flow that could be simplified

## Next Steps
1. Review the HAR file for full request/response details
2. Look for any API calls that could be replicated with fetch/axios
3. Check if there's a service account or API key option
