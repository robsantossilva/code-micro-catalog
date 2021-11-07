import './bootstrap';
import {RestServer} from '@loopback/rest';
import {ApplicationConfig, CodeMicroCatalogApplication} from './application';
import {config} from './config';

export * from './application';


export async function main(options: ApplicationConfig = {}) {
  const app = new CodeMicroCatalogApplication(options);
  await app.boot();
  await app.start();

  const restServer = app.getSync<RestServer>('servers.RestServer');
  const url = restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}

if (require.main === module) {
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}

