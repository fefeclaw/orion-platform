/**
 * Instrumentation hook for Sentry (Next.js 14+)
 * Initializes Sentry on main thread
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = async (err: Error, request: { url: string }): Promise<void> => {
  const { captureException } = await import("@sentry/nextjs");
  captureException(err, {
    level: "error",
    extra: { url: request.url },
  });
};
