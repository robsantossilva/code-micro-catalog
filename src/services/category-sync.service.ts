import {bind, /* inject, */ BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {rabbitmqSubscribe} from '../decorators';
import {CategoryRepository} from '../repositories';

@bind({scope: BindingScope.TRANSIENT})
export class CategorySyncService {
  constructor(
    @repository(CategoryRepository) private categoryRepo:CategoryRepository,
  ) {}

  @rabbitmqSubscribe({
    exchange:'amq.topic',
    queue: 'micro-catalog/category-sync',
    routingKey:'model.category.*'
  })
  async handle({data, message}:{data:any, message:any}){

    const [model, event] = message.fields.routingKey.split('.').slice(1);
    if(model === 'category'){
      switch(event){
        case 'created':
          await this.categoryRepo.create(data);
          break;
        case 'updated':
          await this.categoryRepo.updateById(data.id, data);
          break;
        case 'deleted':
          await this.categoryRepo.deleteById(data.id);
          break;
      }
    }
  }
}
