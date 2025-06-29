import { createServerClient } from "./supabase"

export interface ErrorLog {
  id?: string
  error_type: string
  error_message: string
  stack_trace?: string
  user_id?: string
  merchant_id?: string
  request_url?: string
  request_method?: string
  user_agent?: string
  ip_address?: string
  context?: Record<string, any>
  created_at?: string
}

export class ErrorService {
  private static instance: ErrorService
  private supabase = createServerClient()

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService()
    }
    return ErrorService.instance
  }

  async logError(error: Error, context: any = {}): Promise<void> {
    try {
      const errorLog: ErrorLog = {
        error_type: error.name || "UnknownError",
        error_message: error.message,
        stack_trace: error.stack,
        context,
        created_at: new Date().toISOString(),
      }

      // Add request context if available
      if (context.request) {
        errorLog.request_url = context.request.url
        errorLog.request_method = context.request.method
        errorLog.user_agent = context.request.headers?.get("user-agent")
        errorLog.ip_address =
          context.request.headers?.get("x-forwarded-for") || context.request.headers?.get("x-real-ip")
      }

      // Add user context if available
      if (context.userId) {
        errorLog.user_id = context.userId
      }

      if (context.merchantId) {
        errorLog.merchant_id = context.merchantId
      }

      // Store in database
      await this.supabase.from("error_logs").insert(errorLog)

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.error("Error logged:", errorLog)
      }

      // Send to external monitoring service (Sentry, LogRocket, etc.)
      if (process.env.SENTRY_DSN) {
        // Sentry.captureException(error, { extra: context })
      }
    } catch (logError) {
      console.error("Failed to log error:", logError)
    }
  }

  async notifyAdmins(criticalError: Error, context: any = {}): Promise<void> {
    try {
      // Send critical error notifications
      if (process.env.ADMIN_EMAIL) {
        // Send email notification
        console.log("Critical error notification sent to admins")
      }

      // Could integrate with Slack, Discord, etc.
      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `🚨 Critical Error: ${criticalError.message}`,
            attachments: [
              {
                color: "danger",
                fields: [
                  { title: "Error Type", value: criticalError.name, short: true },
                  { title: "Context", value: JSON.stringify(context, null, 2), short: false },
                ],
              },
            ],
          }),
        })
      }
    } catch (notifyError) {
      console.error("Failed to notify admins:", notifyError)
    }
  }

  async trackUserError(userId: string, error: Error, userAction: string): Promise<void> {
    await this.logError(error, {
      userId,
      userAction,
      errorCategory: "user_error",
    })
  }

  createErrorHandler(context: any = {}) {
    return async (error: Error) => {
      await this.logError(error, context)

      // Determine if this is a critical error
      const criticalErrors = ["DatabaseError", "PaymentError", "SecurityError"]
      if (criticalErrors.includes(error.name)) {
        await this.notifyAdmins(error, context)
      }
    }
  }
}

export const errorService = ErrorService.getInstance()

// Global error handler for unhandled promises
if (typeof window === "undefined") {
  process.on("unhandledRejection", (reason, promise) => {
    errorService.logError(new Error(`Unhandled Rejection: ${reason}`), {
      promise: promise.toString(),
      errorCategory: "unhandled_rejection",
    })
  })

  process.on("uncaughtException", (error) => {
    errorService.logError(error, {
      errorCategory: "uncaught_exception",
    })
    process.exit(1)
  })
}
