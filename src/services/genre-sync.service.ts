import {bind, /* inject, */ BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {rabbitmqSubscribe} from '../decorators';
import {GenreRepository} from '../repositories';

@bind({scope: BindingScope.TRANSIENT})
export class GenreSyncService {
  constructor(
    @repository(GenreRepository) private genreRepo: GenreRepository,
  ) {}

  @rabbitmqSubscribe({
    exchange:'amq.topic',
    queue: 'micro-catalog/genre-sync',
    routingKey:'model.genre.*'
  })
  async handle({data, message}:{data:any, message:any}){

    if(Object.prototype.hasOwnProperty.call(data, 'description')){
      delete data.description;
    }

    const [model, event] = message.fields.routingKey.split('.').slice(1);
    if(model === 'genre'){
      switch(event){
        case 'created':
          await this.genreRepo.create(data);
          break;
        case 'updated':
          await this.genreRepo.updateById(data.id, data);
          break;
        case 'deleted':
          await this.genreRepo.deleteById(data.id);
          break;
      }
    }
  }
}
