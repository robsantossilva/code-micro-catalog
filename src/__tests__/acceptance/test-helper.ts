/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Client, createRestAppClient,
  givenHttpServerConfig
} from '@loopback/testlab';
import {CodeMicroCatalogApplication} from '../..';

export async function setupApplication(): Promise<AppWithClient> {
  const restConfig = givenHttpServerConfig({
    // Customize the server configuration here.
    // Empty values (undefined, '') will be ignored by the helper.
    //
    // host: process.env.HOST,
    // port: +process.env.PORT,
  });

  const app = new CodeMicroCatalogApplication({
    rest: restConfig,
  });

  await app.boot();
  await app.start();

  // @ts-ignore
  const client = createRestAppClient(app);

  return {app, client};
}

export interface AppWithClient {
  app: CodeMicroCatalogApplication;
  client: Client;
}
