import {DefaultCrudRepository} from '@loopback/repository';
import chalk from 'chalk';
//import {Client} from 'es7';
import {CodeMicroCatalogApplication} from '../application';
import {config as options} from '../config';
//import {Esv7DataSource} from '../datasources';
import fixtures from '../fixtures';
import {ValidatorService} from '../services/validator.service';

export class FixturesCommand{
  static command = 'fixtures';
  static description = 'Fixtures data in ElasticSearch';

  app: CodeMicroCatalogApplication;

  async run(){
    console.log('fixtures is executing...')
    await this.bootApp();
    console.log('Delete all documents');
    //await this.deleteAllDocuments();

    const validator = this.app.getSync<ValidatorService>('services.ValidatorService');

    for(const fixture of fixtures){
      const repository = this.getRepository<DefaultCrudRepository<any, any>>(fixture.model);
      await validator.validate({
        data: fixture.fields,
        entityClass: repository.entityClass
      });
      await repository.create(fixture.fields);
    }

    console.log(chalk.green('Documents generated'));

  }

  private async bootApp(){
    this.app = new CodeMicroCatalogApplication(options);
    return this.app.boot();
  }

  // private async deleteAllDocuments(){
  //   const datasource: Esv7DataSource = this.app.getSync<Esv7DataSource>('datasources.esv7');
  //   //@ts-ignore
  //   const index = datasource.adapter.settings.index
  //   //@ts-ignore
  //   const client: Client = datasource.adapter.db;
  //   await client.delete_by_query({
  //     index,
  //     body:{
  //       query:{
  //         // eslint-disable-next-line @typescript-eslint/naming-convention
  //         match_all:{}
  //       }
  //     }
  //   })
  // }

  private getRepository<T>(modelName: string): T{
    return this.app.getSync<T>(`repositories.${modelName}Repository`);
  }

}
