import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  get, Request, response,
  ResponseObject, RestBindings
} from '@loopback/rest';
import {CategoryRepository} from '../repositories';

/**
 * OpenAPI response for ping()
 */
const PING_RESPONSE: ResponseObject = {
  description: 'Ping Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'PingResponse',
        properties: {
          greeting: {type: 'string'},
          date: {type: 'string'},
          url: {type: 'string'},
          headers: {
            type: 'object',
            properties: {
              'Content-Type': {type: 'string'},
            },
            additionalProperties: true,
          },
        },
      },
    },
  },
};

// interface MyClassMetaData {
//   name: string;
// }

// function myClassDecorator(spec: MyClassMetaData): ClassDecorator {
//   const factory = new ClassDecoratorFactory<MyClassMetaData>(
//     'meta-data-my-class-decorator',
//     spec
//   );

//   return factory.create()
// }

/**
 * A simple controller to bounce back http requests
 */
//@myClassDecorator({name: 'Code Education!'})
export class PingController {
  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @repository(CategoryRepository) private categoryRepo: CategoryRepository
  ) { }

  // Map to `GET /ping`
  @get('/ping')
  @response(200, PING_RESPONSE)
  ping(): object {
    // Reply with a greeting, the current time, the url, and request headers
    return {
      greeting: 'Hello from LoopBack!!!',
      date: new Date(),
      url: this.req.url,
      headers: Object.assign({}, this.req.headers),
    };
  }

  @get('/categories')
  async index(){
    await this.categoryRepo.create({
      id: (new Date()).getTime().toString(),
      name:"Cateroria Teste",
      description:"Desc Teste"
    });
    return this.categoryRepo.find();
  }
}

// const meta = MetadataInspector.getClassMetadata<MyClassMetaData>(
//   'meta-data-my-class-decorator',
//   PingController
// );

// console.log(meta);
