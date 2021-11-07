import {Binding, Context} from '@loopback/context';
import {Application, CoreBindings, inject, MetadataInspector, Server} from '@loopback/core';
import {repository} from '@loopback/repository';
import {AmqpConnectionManager, AmqpConnectionManagerOptions, ChannelWrapper, connect} from 'amqp-connection-manager';
import {Channel, ConfirmChannel, Message, Options} from 'amqplib';
import {RabbitmqSubscribeMetadata, RABBITMQ_SUBSCRIBER_METADATA} from '../decorators';
import {RabbitmqBindings} from '../keys';
import {CategoryRepository} from '../repositories';

export enum ResponseEnum{
  ACK = 0,
  REQUEUE = 1,
  NACK = 2,
}

export interface RabbitmqConfig{
  uri:string;
  connOptions?: AmqpConnectionManagerOptions;
  exchanges?: {name:string, type:string, options:Options.AssertExchange}[]
  defaultHandlerError?: ResponseEnum
}

export class RabbitmqServer extends Context implements Server {

  private _listening: boolean;
  private _conn: AmqpConnectionManager;
  private _channelManager: ChannelWrapper;
  channel: Channel;

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE) private app: Application,
    @repository(CategoryRepository) private categoryRepo:CategoryRepository,
    @inject(RabbitmqBindings.CONFIG) private config: RabbitmqConfig

  ){
    super(app);
  }

  async start(): Promise<void> {
    this._conn = connect([this.config.uri], this.config.connOptions);
    this._channelManager = this._conn.createChannel();
    this.channelManager.on('connect', () => {
      this._listening = true;
      console.log('Successfully connected a Rabbitmq channel');
    });
    this.channelManager.on('error', (err, {name}) => {
      this._listening = false;
      console.log(`Failed to setup a Rabbitmq channel - name: ${name} | error: ${err.message}`);
    });
    this._listening = true;
    await this.setupExchanges();
    await this.bindSubscribers();


  }

  private async setupExchanges(){

    return this.channelManager.addSetup(async (channel:ConfirmChannel) => {
      if(!this.config.exchanges){
        return;
      }
      await Promise.all(this.config.exchanges.map((exchange) => {
        channel.assertExchange(exchange.name, exchange.type, exchange.options);
      }))
    });

  }

  private async bindSubscribers() {
    this
      .getSubscribers()
      .map(async (item) => {
        await this.channelManager.addSetup(async (channel:ConfirmChannel) => {
          const { exchange, routingKey, queue, queueOptions } = item.metadata;
          const method = item.method;
          const assertQueue = await channel.assertQueue(
            queue ?? '',
            queueOptions
          );

          const routingKeys = Array.isArray(routingKey) ? routingKey : [routingKey];

          await Promise.all(
            routingKeys.map((x) => channel.bindQueue(assertQueue.queue, exchange, x))
          )
          await this.consume({channel, queue: assertQueue.queue, method});
        });
      })
  }

  private async consume({channel, queue, method}:{channel: ConfirmChannel, queue: string, method: Function}) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await channel.consume(queue, async (message) => {
      try {
        if(!message){
          throw new Error('Received a null message');
        }

        const content = message.content;
        if(content){
          let data;
          try {
            data = JSON.parse(content.toString());
          } catch (e) {
            data = null;
          }
          console.log(message);
          const responseType = await method({data, message, channel});
          this.dispatchResponse(channel, message, responseType);
        }
      } catch (e) {
        console.error(e);
        if(!message){
          return;
        }
        this.dispatchResponse(channel, message, this.config?.defaultHandlerError)
      }
    });
  }

  private getSubscribers(): {method: Function, metadata: RabbitmqSubscribeMetadata}[] {
    const bindings: Array<Readonly<Binding>> = this.find('services.*');

    return bindings.map(
      binding => {
        const metadata = MetadataInspector.getAllMethodMetadata<RabbitmqSubscribeMetadata>(
          RABBITMQ_SUBSCRIBER_METADATA, binding.valueConstructor?.prototype
        );

        if(!metadata){
          return[];
        }

        const methods = [];
        for(const methodName in metadata){

          if(!Object.prototype.hasOwnProperty.call(metadata, methodName)){
            return;
          }

          const service = this.getSync(binding.key) as any;
          methods.push({
            method: service[methodName].bind(service),
            metadata: metadata[methodName]
          });
        }
        return methods;
      }
    ).reduce((collection: any, item: any) => {
      collection.push(...item);
      return collection;
    }, []);
  }

  // async boot(){
  //   //@ts-ignore
  //   this.channel = await this.conn.createChannel();
  //   const queue: Replies.AssertQueue = await this.channel.assertQueue('micro-catalog/sync-videos');
  //   const exchange: Replies.AssertExchange = await this.channel.assertExchange('amq.topic', 'topic');
  //   await this.channel.bindQueue(queue.queue, exchange.exchange, 'model.*.*');

  //   //await channel.publish('amq.topic', 'model.*.*', Buffer.from('publicado por routing key'));
  //   await this.channel.consume(queue.queue, (message)=>{

  //     if(!message){
  //       return;
  //     }

  //     const data = JSON.parse(message?.content.toString());
  //     const [model, event] = message.fields.routingKey.split('.').slice(1);
  //     this
  //       .sync({model, event, data})
  //       .then(() => this.channel.ack(message))
  //       .catch((error) => {
  //         console.log(error);
  //         this.channel.reject(message, false)
  //       });

  //     console.log(model, event);
  //   });

  //   console.log("RABBITMQ OK")
  // }

  // async sync({model, event, data}: {model:string, event:string, data:Category}){
  //   if(model === 'category'){
  //     switch(event){
  //       case 'created':
  //         await this.categoryRepo.create({
  //           ...data,
  //           // eslint-disable-next-line @typescript-eslint/naming-convention
  //           created_at: (new Date()).toISOString(),
  //           // eslint-disable-next-line @typescript-eslint/naming-convention
  //           updated_at: (new Date()).toISOString()
  //         });
  //         break;
  //       case 'updated':
  //         await this.categoryRepo.updateById(data.id, data);
  //         break;
  //       case 'deleted':
  //         await this.categoryRepo.deleteById(data.id);
  //         break;
  //     }
  //   }
  // }

  private dispatchResponse(channel: Channel, message: Message, responseType?: ResponseEnum){
    switch (responseType) {
      case ResponseEnum.REQUEUE:
        channel.nack(message, false, true);
        break;
      case ResponseEnum.NACK:
        channel.nack(message, false, false);
        break;
      case ResponseEnum.ACK:
      default:
        channel.ack(message);
    }
  }

  async stop(): Promise<void> {
    await this.conn.close();
    this._listening = false;
    return undefined;
  }

  get listening(): boolean{
    return this._listening;
  }

  get conn(): AmqpConnectionManager{
    return this._conn;
  }

  get channelManager(): ChannelWrapper{
    return this._channelManager;
  }
}
