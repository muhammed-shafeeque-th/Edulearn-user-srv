export abstract class IMetricService {
  abstract measureDBOperationDuration(
    method: string,
    operation?: "INSERT" | "DELETE" | "SELECT" | "UPDATE",
  ): () => void;

  abstract measureRequestDuration(method: string): () => void;

  abstract incrementRequestCounter(method: string, statusCode?: number): void;
  abstract incrementDBRequestCounter(
    operation?: "INSERT" | "DELETE" | "SELECT" | "UPDATE",
  ): void;

  abstract incrementErrorCounter(method: string, statusCode?: number): void;
}
