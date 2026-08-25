import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://45759427592729360a649d9d4db967ee@o4511863431299072.ingest.us.sentry.io/4511964728786944",
  tracesSampleRate: 1.0,
  debug: false,
});
