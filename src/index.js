import { handleMCPRequest, handleOAuthCallback } from './mcp-handlers.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // OAuth callback handler
      if (url.pathname === '/oauth/callback') {
        return await handleOAuthCallback(request, env, corsHeaders);
      }

      // MCP protocol handler
      if (url.pathname === '/mcp' && request.method === 'POST') {
        return await handleMCPRequest(request, env, corsHeaders);
      }

      // Health check endpoint
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Authorization URL generator - FIXED URL
      if (url.pathname === '/auth') {
        const authUrl = `https://miro.com/oauth/authorize?response_type=code&client_id=${env.MIRO_CLIENT_ID}&redirect_uri=${encodeURIComponent(url.origin + '/oauth/callback')}&scope=boards:read%20boards:write`;
        
        return new Response(`
          <html>
            <head><title>Miro MCP Authorization</title></head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
              <h1>Miro MCP Server Authorization</h1>
              <p>Click the link below to authorize this MCP server to access your Miro boards:</p>
              <p><a href="${authUrl}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Authorize Miro Access</a></p>
              <p><small>This will redirect you to Miro for authorization, then back to this server.</small></p>
            </body>
          </html>
        `, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        });
      }

      // Default response with API info
      return new Response(JSON.stringify({
        service: 'Miro MCP Server',
        version: '1.0.0',
        endpoints: {
          mcp: '/mcp (POST)',
          auth: '/auth (GET)',
          callback: '/oauth/callback (GET)',
          health: '/health (GET)'
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
