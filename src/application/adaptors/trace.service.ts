import { Attributes, Context, Span, SpanStatusCode } from "@opentelemetry/api";

export abstract class ITraceService {
  /**
   * Starts a new {@link Span} and calls the given function passing it the
   * created span as first argument.
   * Additionally the new span gets set in context and this context is activated
   * for the duration of the function call.
   *
   * @param name The name of the span
   * @param [options] SpanOptions used for span creation
   * @param [context] Context to use to extract parent
   * @param fn function called in the context of the span and receives the newly created span as an argument
   * @returns return value of fn
   * @example
   *     const something = tracer.startActiveSpan('op', span => {
   *       try {
   *         do some work
   *         span.setStatus({code: SpanStatusCode.OK});
   *         return something;
   *       } catch (err) {
   *         span.setStatus({
   *           code: SpanStatusCode.ERROR,
   *           message: err.message,
   *         });
   *         throw err;
   *       } finally {
   *         span.end();
   *       }
   *     });
   *
   * @example
   *     const span = tracer.startActiveSpan('op', span => {
   *       try {
   *         do some work
   *         return span;
   *       } catch (err) {
   *         span.setStatus({
   *           code: SpanStatusCode.ERROR,
   *           message: err.message,
   *         });
   *         throw err;
   *       }
   *     });
   *     do some more work
   *     span.end();
   */
  abstract startActiveSpan<F extends (span: Span) => unknown>(
    name: string,
    fn: F,
  ): ReturnType<F>;
  abstract startActiveSpan<T>(
    name: string,
    fn: (span: Span) => T | Promise<T>,
    attributes?: Attributes,
  ): T | Promise<T>;

  abstract startSpan(
    name: string,
    attributes?: Attributes | Record<string | any, string | any>,
    contextOverride?: Context,
  ): Span;

  abstract endSpan(span: Span): void;

  abstract recordException(span: Span, error: any): void;

  abstract setStatus(span: Span, code: SpanStatusCode, message?: string): void;

  abstract setAttribute(span: Span, key: string, value: any): void;

  abstract getCurrentSpan(): Span | undefined;
}
