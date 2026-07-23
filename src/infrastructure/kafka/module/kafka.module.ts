import { Module, DynamicModule } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";
import { KAFKA_MODULE_OPTIONS } from "./kafka.constants";
import { KafkaModuleOptions } from "./kafka.types";
import { KafkaClient } from "./kafka.client";
import { KafkaExplorer } from "./kafka.explorer";
import { ILoggerService } from "src/application/adaptors/logger.service";

@Module({})
export class CustomKafkaModule {
  static forRoot(
    options: KafkaModuleOptions,
    _logger: ILoggerService,
  ): DynamicModule {
    return {
      module: CustomKafkaModule,
      imports: [DiscoveryModule],
      providers: [
        {
          provide: KAFKA_MODULE_OPTIONS,
          useValue: options,
        },
        {
          provide: KafkaClient,
          useFactory: () => new KafkaClient(options, _logger),
        },
        KafkaExplorer,
      ],
      exports: [KafkaClient],
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory: (
      ...args: any[]
    ) => Promise<KafkaModuleOptions> | KafkaModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: CustomKafkaModule,
      imports: [DiscoveryModule, ...(options.imports || [])],
      providers: [
        {
          provide: KAFKA_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        {
          provide: KafkaClient,
          useFactory: (
            moduleOptions: KafkaModuleOptions,
            _logger: ILoggerService,
          ) => new KafkaClient(moduleOptions, _logger),
          inject: [KAFKA_MODULE_OPTIONS, ILoggerService],
        },
        KafkaExplorer,
      ],
      exports: [KafkaClient],
    };
  }
}
