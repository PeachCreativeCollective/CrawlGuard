const serverless = require('serverless-http');
const express = require('express');

let appInstance = null;

async function createApp() {
  if (appInstance) return appInstance;
  
  // Dynamic import for ES modules
  const { registerRoutes } = await import('../../server/routes.js');
  
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Setup routes
  await registerRoutes(app);
  
  appInstance = app;
  return app;
}

exports.handler = async (event, context) => {
  try {
    const app = await createApp();
    const serverlessHandler = serverless(app);
    return serverlessHandler(event, context);
  } catch (error) {
    console.error('Netlify function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
