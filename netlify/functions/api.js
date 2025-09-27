import serverless from 'serverless-http';
import express from 'express';
import { registerRoutes } from '../../server/routes.js';

let appInstance = null;

async function createApp() {
  if (appInstance) return appInstance;

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Setup routes
  await registerRoutes(app);

  appInstance = app;
  return app;
}

export const handler = async (event, context) => {
  const app = await createApp();
  const serverlessHandler = serverless(app);
  return serverlessHandler(event, context);
};
