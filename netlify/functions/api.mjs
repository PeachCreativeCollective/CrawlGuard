import serverless from 'serverless-http';
import express from 'express';

let appInstance = null;

async function createApp() {
  if (appInstance) return appInstance;
  
  // Dynamic import for routes
  const { registerRoutes } = await import('../../server/routes.js');
  
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Setup routes
  await registerRoutes(app);
  
  appInstance = app;
  return app;
}

export const handler = async (event, context) => {
  try {
    const app = await createApp();
    const serverlessHandler = serverless(app);
    return await serverlessHandler(event, context);
  } catch (error) {
    console.error('Netlify function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
