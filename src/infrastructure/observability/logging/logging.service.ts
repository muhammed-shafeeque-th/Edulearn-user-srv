import { Inject, Injectable, LoggerService } from "@nestjs/common";
import { context, trace } from "@opentelemetry/api"; // Import OpenTelemetry context API
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { AppConfigService } from "src/infrastructure/config/config.service";
import { Logger as WinstonLogger } from "winston";

// Define a more robust LogContext interface
interface LogContext {
  traceId?: string; // OpenTelemetry Trace ID
  spanId?: string; // OpenTelemetry Span ID
  userId?: string; // Logged-in user ID
  correlationId?: string; // General correlation ID if different from traceId
  service?: string;
  environment?: string;
  ctx?: string; // Method or class in which logging
  // Allows arbitrary additional context properties
  [key: string]: unknown;
}

@Injectable()
export class LoggingService implements LoggerService {
  public constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: WinstonLogger,
    private readonly configService: AppConfigService
  ) {}

  // Private helper to build common log entry structure
  private buildLogEntry(
    level: string,
    message: string,
    logContext?: LogContext
  ) {
    // Get current active OpenTelemetry span context for correlation
    const activeSpan = trace.getSpan(context.active());
    const spanContext = activeSpan?.spanContext();

    return {
      level,
      message,
      // Prioritize traceId/spanId from active OpenTelemetry context
      traceId: spanContext?.traceId,
      spanId: spanContext?.spanId,
      // Fallback to context provided if not from active span
      userId: logContext?.userId,
      correlationId: logContext?.correlationId,
      service: logContext?.service || this.configService.serviceName,
      environment: this.configService.nodeEnv || "development",
      caller:
        this.configService.nodeEnv !== "production"
          ? this.getCaller() + " "
          : undefined,
      // Include any other custom context provided directly
      ...logContext,
    };
  }

  // Use winston's logger directly with metadata object
  info(message: string, context?: LogContext): void {
    const logEntry = this.buildLogEntry("info", message, context);
    this.logger.log(message, logEntry);
  }

  log(message: string, context?: LogContext): void {
    const logEntry = this.buildLogEntry("log", message, context);
    this.logger.log(message, logEntry);
  }

  error(message: string, context?: LogContext): void {
    const logEntry = this.buildLogEntry("error", message, context);
    this.logger.error(message, logEntry);
  }

  warn(message: string, context?: LogContext): void {
    // Renamed from warning to warn for consistency with Winston
    const logEntry = this.buildLogEntry("warn", message, context);
    this.logger.warn(message, logEntry);
  }

  debug(message: string, context?: LogContext): void {
    const logEntry = this.buildLogEntry("debug", message, context);
    this.logger.debug(message, logEntry);
  }

  // private getCaller(): string | undefined {
  //   const stack = new Error().stack;
  //   if (!stack) return undefined;
  //   const stackLines = stack.split("\n").map((line) => line.trim());

  //   // Find the first stack line that is NOT from logging.service.ts
  //   for (const line of stackLines) {
  //     if (
  //       line &&
  //       !line.match(/(logging.service.{ts,js} | observability)/) &&
  //       (line.startsWith("at ") || line.match(/\(([^)]+)\)/))
  //     ) {
  //       // Extract file path and line number
  //       const match = line.match(/\(([^)]+)\)/) || line.match(/at (.+)/);
  //       const idx = match.indexOf("//src//") || match.indexOf("//dist//");
  //       return match ? match[1].slice(idx) : undefined;
  //     }
  //   }
  //   return undefined;
  // }

  private getCaller(): string | undefined {
    const stack = new Error().stack;
    if (!stack) return undefined;
    const stackLines = stack.split("\n").map((line) => line.trim());

    // Find the first stack line that is NOT from logging.service.ts
    for (const line of stackLines) {
      if (
        line &&
        !line.includes("logging.service.ts") &&
        (line.startsWith("at ") || line.match(/\(([^)]+)\)/))
      ) {
        // Extract file path and line number
        const match = line.match(/\(([^)]+)\)/) || line.match(/at (.+)/);
        return match ? match[1] : undefined;
      }
    }
    return undefined;
  }

  // private getCaller(): string {
  //   try {
  //     const stack = new Error().stack;
  //     if (!stack) return 'unknown';

  //     const stackLines = stack.split('\n').map(line => line.trim());

  //     // Skip the first line (Error constructor) and find the first line that's not from logging service
  //     for (let i = 2; i < stackLines.length; i++) {
  //       const line = stackLines[i];

  //       // Skip lines from logging service or observability
  //       if (line &&
  //           !line.includes('logging.service') &&
  //           !line.includes('observability') &&
  //           !line.includes('LoggingService') &&
  //           !line.includes('node_modules') &&
  //           (line.startsWith('at ') || line.includes('('))) {

  //         // Handle different stack trace formats
  //         if (line.includes('(') && line.includes(')')) {
  //           // Format: at Class.method (file:line:column)
  //           const match = line.match(/\(([^)]+)\)/);
  //           if (match) {
  //             const fullPath = match[1];
  //             const parts = fullPath.split(':');
  //             if (parts.length >= 2) {
  //               let filePath = parts[0];
  //               const lineNumber = parts[1];

  //               // Extract relative path from src or dist (handle both Windows and Unix paths)
  //               const srcIndex = filePath.indexOf('/src/') !== -1 ? filePath.indexOf('/src/') : filePath.indexOf('\\src\\');
  //               const distIndex = filePath.indexOf('/dist/') !== -1 ? filePath.indexOf('/dist/') : filePath.indexOf('\\dist\\');

  //               if (srcIndex !== -1) {
  //                 filePath = filePath.substring(srcIndex + 1);
  //               } else if (distIndex !== -1) {
  //                 filePath = filePath.substring(distIndex + 1);
  //               }

  //               // Normalize path separators
  //               filePath = filePath.replace(/\\/g, '/');

  //               return `${filePath}:${lineNumber}`;
  //             }
  //           }
  //         } else if (line.startsWith('at ')) {
  //           // Format: at Class.method file:line:column
  //           const match = line.match(/at\s+(.+?)\s+(.+):(\d+):(\d+)/);
  //           if (match) {
  //             const className = match[1];
  //             let fullPath = match[2];
  //             const lineNumber = match[3];

  //             // Extract relative path from src or dist (handle both Windows and Unix paths)
  //             const srcIndex = fullPath.indexOf('/src/') !== -1 ? fullPath.indexOf('/src/') : fullPath.indexOf('\\src\\');
  //             const distIndex = fullPath.indexOf('/dist/') !== -1 ? fullPath.indexOf('/dist/') : fullPath.indexOf('\\dist\\');

  //             if (srcIndex !== -1) {
  //               fullPath = fullPath.substring(srcIndex + 1);
  //             } else if (distIndex !== -1) {
  //               fullPath = fullPath.substring(distIndex + 1);
  //             }

  //             // Normalize path separators
  //             fullPath = fullPath.replace(/\\/g, '/');

  //             return `${className} (${fullPath}:${lineNumber})`;
  //           }
  //         }
  //       }
  //     }

  //     return 'unknown';
  //   } catch (error) {
  //     return 'unknown';
  //   }
  // }
}
