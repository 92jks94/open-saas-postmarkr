// instrument.js
// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://64b8d8efb3c4ade3d0c068ff5c9a22c6@o4510145660452864.ingest.us.sentry.io/4510145661304832",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});
