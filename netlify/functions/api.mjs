import { Client } from 'pg';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Database connection
const createDbClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase.com') 
      ? { rejectUnauthorized: false } 
      : false,
  });
};

// Password comparison function
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Get user by email
async function getUserByEmail(client, email) {
  const normalizedEmail = email.toLowerCase();
  const result = await client.query(
    'SELECT * FROM users WHERE LOWER(email) = $1',
    [normalizedEmail]
  );
  return result.rows[0] || null;
}

export const handler = async (event, context) => {
  const { httpMethod, path, body, headers } = event;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Credentials': 'true',
  };

  // Handle preflight requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  // Parse the API route - handle multiple possible formats
  let apiPath;

  if (path.includes('/.netlify/functions/api')) {
    // Direct function call: /.netlify/functions/api/login -> /login
    apiPath = path.replace('/.netlify/functions/api', '');
  } else if (path.startsWith('/api/')) {
    // Redirected call: /api/login -> /login
    apiPath = path.replace('/api', '');
  } else {
    // Direct path: /login -> /login
    apiPath = path;
  }

  // Ensure we have a leading slash
  if (apiPath && !apiPath.startsWith('/')) {
    apiPath = '/' + apiPath;
  }

  console.log('Processing request - Original path:', path, 'Parsed path:', apiPath, 'Method:', httpMethod);
  
  try {
    // Health check endpoint
    if (apiPath === '/health') {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'ok', 
          message: 'API is running',
          timestamp: new Date().toISOString()
        })
      };
    }

    // Login endpoint - handle multiple possible path formats
    if ((apiPath === '/login' || apiPath === '/api/login') && httpMethod === 'POST') {
      if (!body) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Request body is required' })
        };
      }

      const { email, password } = JSON.parse(body);

      if (!email || !password) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Email and password are required' })
        };
      }

      // Connect to database
      const client = createDbClient();
      try {
        await client.connect();
        
        // Get user by email
        const user = await getUserByEmail(client, email.trim());
        
        if (!user) {
          return {
            statusCode: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Invalid email or password' })
          };
        }

        // Verify password
        const isValidPassword = await comparePasswords(password, user.password);
        
        if (!isValidPassword) {
          return {
            statusCode: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Invalid email or password' })
          };
        }

        // Return user data (without password)
        const userData = {
          id: user.id,
          username: user.username,
          email: user.email,
          isAdmin: user.is_admin || false
        };

        return {
          statusCode: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        };

      } finally {
        await client.end();
      }
    }

    // User endpoint (for checking authentication status)
    if (apiPath === '/user' && httpMethod === 'GET') {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Session management not available in serverless' })
      };
    }

    // Default response for unhandled routes
    return {
      statusCode: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Endpoint not found',
        originalPath: path,
        parsedPath: apiPath,
        method: httpMethod,
        available_endpoints: ['/health', '/login (POST)', '/api/login (POST)']
      })
    };
    
  } catch (error) {
    console.error('Netlify function error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
