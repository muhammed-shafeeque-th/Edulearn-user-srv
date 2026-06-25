import { Global, Module } from "@nestjs/common";
import { MetricService } from "./metrics.service";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { IMetricService } from "src/application/adaptors/metric.service";

@Global()
@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true, config: {} },
      path: "/metrics",
    }),
  ],
  providers: [{ provide: IMetricService, useClass: MetricService }],
  exports: [IMetricService],
})
export class MetricsModule {}
