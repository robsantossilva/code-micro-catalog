import {MethodDecoratorFactory} from '@loopback/metadata';
import {Options} from 'amqplib';

export interface RabbitmqSubscribeMetadata {
  exchange: string;
  routingKey: string | string[];
  queue?: string;
  queueOptions?: Options.AssertQueue
}

export const RABBITMQ_SUBSCRIBER_METADATA = 'rebbitmq-subscribe-metadata';

export function rabbitmqSubscribe(spec: RabbitmqSubscribeMetadata): MethodDecorator {
  return MethodDecoratorFactory.createDecorator<RabbitmqSubscribeMetadata>(
    RABBITMQ_SUBSCRIBER_METADATA, spec
  );
}
