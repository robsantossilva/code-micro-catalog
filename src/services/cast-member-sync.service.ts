import {bind, /* inject, */ BindingScope, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {rabbitmqSubscribe} from '../decorators';
import {CastMemberRepository} from '../repositories';
import {BaseModelSyncService} from './base-model-sync.service';
import {ValidatorService} from './validator.service';

@bind({scope: BindingScope.SINGLETON})
export class CastMemberSyncService extends BaseModelSyncService {
  constructor(
    @repository(CastMemberRepository) private repo: CastMemberRepository,
    @service(ValidatorService) private validator: ValidatorService
  ) {
    super(validator);
  }

  @rabbitmqSubscribe({
    exchange:'amq.topic',
    queue: 'micro-catalog/sync-videos/cast_member',
    routingKey:'model.cast_member.*'
  })
  async handle({data, message}:{data:any, message:any}){

    await this.sync({
      repo: this.repo,
      data: data,
      message: message
    });

  }
}
