import pg from 'pg';
import pg from 'pg';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const { Client } = pg;
const scryptAsync = promisify(scrypt);
const databaseUrl = process.env.DATABASE_URL || '';

const prepareConnectionString = (url) => {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('pooler.supabase.com')) {
      const username = parsed.username || '';
      const segments = username.split('.');
      const role = segments[0] ?? username;
      const projectRef = segments.length > 1 ? segments[segments.length - 1] : undefined;

      if (projectRef) {
        parsed.hostname = 'db.' + projectRef + '.supabase.co';
        parsed.port = '5432';
        parsed.username = role;
        parsed.search = '';
        parsed.searchParams.set('sslmode', 'no-verify');
      }
    }

    if (!parsed.searchParams.has('sslmode')) {
      parsed.searchParams.set('sslmode', 'no-verify');
    }

    return parsed.toString();
  } catch (error) {
    console.error('Failed to prepare connection string:', error);
    return url;
  }
};

// Database connection
const createDbClient = () => {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  const connectionString = prepareConnectionString(databaseUrl);
  const sslConfig = connectionString.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : false;

  return new Client({
    connectionString,
    ssl: sslConfig,
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

// Create contact submission
async function createContactSubmission(client, data) {
  const { name, email, phone, address, zipCode, service, message } = data;

  const result = await client.query(`
    INSERT INTO contact_submissions
    (id, name, email, phone, address, zip_code, service, message, created_at)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *
  `, [name, email, phone || null, address || null, zipCode, service || null, message || null]);

  return result.rows[0];
}

// Simple validation for contact form
function validateContactSubmission(data) {
  const errors = [];

  if (!data.name || data.name.length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  if (!data.zipCode || data.zipCode.length < 5) {
    errors.push({ field: 'zipCode', message: 'Zip code must be at least 5 characters' });
  }

  return errors;
}

export const handler = async (event, context) => {
  // Log the entire event for debugging
  console.log('Netlify function called with event:', JSON.stringify(event, null, 2));

  const { httpMethod, path, body, headers, rawUrl, queryStringParameters } = event;
  
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
          timestamp: new Date().toISOString(),
          databaseConfigured: Boolean(databaseUrl),
        })
      };
    }

    // Login endpoint - handle multiple possible path formats
    const isLoginEndpoint = (
      apiPath === '/login' ||
      apiPath === '/api/login' ||
      path.includes('/login') ||
      (rawUrl && rawUrl.includes('/login'))
    ) && httpMethod === 'POST';

    if (isLoginEndpoint) {
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

    // Contact form submission endpoint
    const isContactEndpoint = (
      apiPath === '/contact' ||
      apiPath === '/api/contact' ||
      path.includes('/contact')
    ) && httpMethod === 'POST';

    if (isContactEndpoint) {
      if (!body) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            message: 'Request body is required'
          })
        };
      }

      try {
        const data = JSON.parse(body);

        // Validate the contact form data
        const validationErrors = validateContactSubmission(data);
        if (validationErrors.length > 0) {
          return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              message: 'Please check all required fields.',
              errors: validationErrors
            })
          };
        }

        // Connect to database and create submission
        const client = createDbClient();
        try {
          await client.connect();

          const submission = await createContactSubmission(client, data);

          return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: true,
              message: "Thank you for your inquiry! We'll contact you within 24 hours.",
              id: submission.id
            })
          };

        } finally {
          await client.end();
        }

      } catch (error) {
        console.error('Contact form error:', error);
        return {
          statusCode: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: false,
            message: "Sorry, there was a problem submitting your request. Please try again or call us directly."
          })
        };
      }
    }

    // Contact submissions endpoint (admin)
    const isContactSubmissionsEndpoint = (
      apiPath === '/contact-submissions' ||
      apiPath === '/api/contact-submissions'
    ) && httpMethod === 'GET';

    if (isContactSubmissionsEndpoint) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authentication required - admin endpoints not available in serverless mode' })
      };
    }

    // Leads endpoint (admin)
    const isLeadsEndpoint = (
      apiPath === '/leads' ||
      apiPath === '/api/leads' ||
      apiPath.startsWith('/leads/') ||
      apiPath.startsWith('/api/leads/')
    );

    if (isLeadsEndpoint) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Authentication required - admin endpoints not available in serverless mode' })
      };
    }

    // Logout endpoint
    const isLogoutEndpoint = (
      apiPath === '/logout' ||
      apiPath === '/api/logout'
    ) && httpMethod === 'POST';

    if (isLogoutEndpoint) {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Logout successful - please clear local storage on client side'
        })
      };
    }

    // User endpoint (for checking authentication status)
    if ((apiPath === '/user' || apiPath === '/api/user' || path.includes('/user')) && httpMethod === 'GET') {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Session management not available in serverless environment' })
      };
    }

    // Default response for unhandled routes - include full debug info
    return {
      statusCode: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Endpoint not found',
        debug: {
          originalPath: path,
          parsedPath: apiPath,
          method: httpMethod,
          rawUrl: rawUrl || 'not available',
          queryParams: queryStringParameters || {},
          headers: headers || {}
        },
        available_endpoints: [
          '/health',
          '/login (POST)',
          '/api/login (POST)',
          '/logout (POST)',
          '/api/logout (POST)',
          '/contact (POST)',
          '/api/contact (POST)',
          '/user (GET)',
          '/api/user (GET)',
          '/contact-submissions (GET) - requires auth',
          '/leads (GET/POST/PATCH/DELETE) - requires auth'
        ],
        message: 'Check the debug info above to see exactly what was received'
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
