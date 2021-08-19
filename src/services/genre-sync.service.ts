import {bind, /* inject, */ BindingScope, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {rabbitmqSubscribe} from '../decorators';
import {GenreRepository} from '../repositories';
import {BaseModelSyncService} from './base-model-sync.service';
import {ValidatorService} from './validator.service';

@bind({scope: BindingScope.SINGLETON})
export class GenreSyncService extends BaseModelSyncService{
  constructor(
    @repository(GenreRepository) private repo: GenreRepository,
    @service(ValidatorService) private validator: ValidatorService
  ) {
    super(validator);
  }

  @rabbitmqSubscribe({
    exchange:'amq.topic',
    queue: 'micro-catalog/sync-videos/genre',
    routingKey:'model.genre.*'
  })
  async handle({data, message}:{data:any, message:any}){

    await this.sync({
      repo: this.repo,
      data: data,
      message: message
    });

  }
}
