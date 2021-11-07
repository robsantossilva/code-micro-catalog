import {bind, /* inject, */ BindingScope, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {rabbitmqSubscribe} from '../decorators';
import {CategoryRepository} from '../repositories';
import {BaseModelSyncService} from './base-model-sync.service';
import {ValidatorService} from './validator.service';

@bind({scope: BindingScope.SINGLETON})
export class CategorySyncService extends BaseModelSyncService{

  constructor(
    @repository(CategoryRepository) private repo:CategoryRepository,
    @service(ValidatorService) private validator: ValidatorService
  ) {
    super(validator);
  }

  @rabbitmqSubscribe({
    exchange:'amq.topic',
    queue: 'micro-catalog/sync-videos/category',
    routingKey:'model.category.*'
  })
  async handle({data, message}:{data:any, message:any}){

    await this.sync({
      repo: this.repo,
      data: data,
      message: message
    });

  }
}
