import {bind, /* inject, */ BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {rabbitmqSubscribe} from '../decorators';
import {CastMemberRepository} from '../repositories';

@bind({scope: BindingScope.TRANSIENT})
export class CastMemberSyncService {
  constructor(
    @repository(CastMemberRepository) private castMemberRepo: CastMemberRepository
  ) {}

  @rabbitmqSubscribe({
    exchange:'amq.topic',
    queue: 'micro-catalog/cast-member-sync',
    routingKey:'model.cast-member.*'
  })
  async handle({data, message}:{data:any, message:any}){

    const [model, event] = message.fields.routingKey.split('.').slice(1);
    if(model === 'cast-member'){
      switch(event){
        case 'created':
          await this.castMemberRepo.create(data);
          break;
        case 'updated':
          await this.castMemberRepo.updateById(data.id, data);
          break;
        case 'deleted':
          await this.castMemberRepo.deleteById(data.id);
          break;
      }
    }
  }
}
