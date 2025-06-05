import { MiroAPI } from './miro-api.js';

export async function handleOAuthCallback(request, env, corsHeaders) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return new Response(`
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h1>Authorization Failed</h1>
          <p>Error: ${error}</p>
          <p>Description: ${url.searchParams.get('error_description') || 'Unknown error'}</p>
        </body>
      </html>
    `, {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    });
  }

  if (!code) {
    return new Response('Authorization code not found', { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  try {
    const miroAPI = new MiroAPI(env);
    const tokenData = await miroAPI.exchangeCodeForToken(code, url.origin);
    
    // Store tokens in KV
    await env.MIRO_TOKENS.put('access_token', tokenData.access_token);
    if (tokenData.refresh_token) {
      await env.MIRO_TOKENS.put('refresh_token', tokenData.refresh_token);
    }
    
    return new Response(`
      <html>
        <head><title>Authorization Successful</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h1>✅ Authorization Successful!</h1>
          <p>Your Miro MCP server is now authorized and ready to use.</p>
          <p>You can close this window and start using the MCP server in Claude.</p>
          <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <strong>MCP Server URL:</strong> ${url.origin}/mcp
          </div>
        </body>
      </html>
    `, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(`
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h1>Authorization Failed</h1>
          <p>Error: ${error.message}</p>
        </body>
      </html>
    `, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' }
    });
  }
}

export async function handleMCPRequest(request, env, corsHeaders) {
  try {
    const body = await request.json();
    
    const response = {
      jsonrpc: "2.0",
      id: body.id
    };

    switch (body.method) {
      case 'initialize':
        response.result = {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
            resources: {}
          },
          serverInfo: {
            name: "miro-mcp-server",
            version: "1.0.0"
          }
        };
        break;

      case 'tools/list':
        response.result = {
          tools: [
            {
              name: "create_board",
              description: "Create a new Miro board",
              inputSchema: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Board name" },
                  description: { type: "string", description: "Board description" }
                },
                required: ["name"]
              }
            },
            {
              name: "create_sticky_note",
              description: "Create a sticky note on a board",
              inputSchema: {
                type: "object",
                properties: {
                  board_id: { type: "string", description: "Board ID" },
                  content: { type: "string", description: "Note content" },
                  x: { type: "number", description: "X position", default: 0 },
                  y: { type: "number", description: "Y position", default: 0 },
                  color: { type: "string", description: "Note color (yellow, blue, green, pink, orange, purple)", default: "yellow" }
                },
                required: ["board_id", "content"]
              }
            },
            {
              name: "create_frame",
              description: "Create a frame on a board",
              inputSchema: {
                type: "object",
                properties: {
                  board_id: { type: "string", description: "Board ID" },
                  title: { type: "string", description: "Frame title" },
                  x: { type: "number", description: "X position", default: 0 },
                  y: { type: "number", description: "Y position", default: 0 },
                  width: { type: "number", description: "Frame width", default: 400 },
                  height: { type: "number", description: "Frame height", default: 300 }
                },
                required: ["board_id", "title"]
              }
            },
            {
              name: "create_text",
              description: "Create a text item on a board",
              inputSchema: {
                type: "object",
                properties: {
                  board_id: { type: "string", description: "Board ID" },
                  content: { type: "string", description: "Text content" },
                  x: { type: "number", description: "X position", default: 0 },
                  y: { type: "number", description: "Y position", default: 0 }
                },
                required: ["board_id", "content"]
              }
            },
            {
              name: "list_boards",
              description: "List user's boards",
              inputSchema: {
                type: "object",
                properties: {}
              }
            },
            {
              name: "get_board_items",
              description: "Get items from a board",
              inputSchema: {
                type: "object",
                properties: {
                  board_id: { type: "string", description: "Board ID" }
                },
                required: ["board_id"]
              }
            },
            {
              name: "setup_meeting_board",
              description: "Create a complete meeting preparation board with predefined structure",
              inputSchema: {
                type: "object",
                properties: {
                  meeting_title: { type: "string", description: "Meeting title" },
                  participants: { type: "array", items: { type: "string" }, description: "List of participant names" }
                },
                required: ["meeting_title"]
              }
            }
          ]
        };
        break;

      case 'tools/call':
        const toolResult = await handleToolCall(body.params, env);
        response.result = toolResult;
        break;

      default:
        response.error = {
          code: -32601,
          message: `Method not found: ${body.method}`
        };
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('MCP request error:', error);
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32603,
        message: `Internal error: ${error.message}`
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleToolCall(params, env) {
  const miroAPI = new MiroAPI(env);
  
  switch (params.name) {
    case 'create_board':
      const board = await miroAPI.createBoard(params.arguments.name, params.arguments.description);
      return {
        content: [{
          type: "text",
          text: `✅ Created board: "${board.name}"\nBoard ID: ${board.id}\nURL: ${board.viewLink}`
        }]
      };

    case 'create_sticky_note':
      const note = await miroAPI.createStickyNote(
        params.arguments.board_id,
        params.arguments.content,
        params.arguments.x || 0,
        params.arguments.y || 0,
        params.arguments.color || 'yellow'
      );
      return {
        content: [{
          type: "text",
          text: `✅ Created sticky note: "${params.arguments.content}"\nNote ID: ${note.id}`
        }]
      };

    case 'create_frame':
      const frame = await miroAPI.createFrame(
        params.arguments.board_id,
        params.arguments.title,
        params.arguments.x || 0,
        params.arguments.y || 0,
        params.arguments.width || 400,
        params.arguments.height || 300
      );
      return {
        content: [{
          type: "text",
          text: `✅ Created frame: "${params.arguments.title}"\nFrame ID: ${frame.id}`
        }]
      };

    case 'create_text':
      const text = await miroAPI.createText(
        params.arguments.board_id,
        params.arguments.content,
        params.arguments.x || 0,
        params.arguments.y || 0
      );
      return {
        content: [{
          type: "text",
          text: `✅ Created text: "${params.arguments.content}"\nText ID: ${text.id}`
        }]
      };

    case 'list_boards':
      const boards = await miroAPI.listBoards();
      const boardsList = boards.map(board => `• ${board.name} (${board.id})`).join('\n');
      return {
        content: [{
          type: "text",
          text: `📋 Your Miro boards:\n${boardsList || 'No boards found'}`
        }]
      };

    case 'get_board_items':
      const items = await miroAPI.getBoardItems(params.arguments.board_id);
      const itemsList = items.map(item => {
        const content = item.data?.content || item.data?.title || 'No content';
        return `• ${item.type}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`;
      }).join('\n');
      return {
        content: [{
          type: "text",
          text: `📊 Board items:\n${itemsList || 'No items found'}`
        }]
      };

    case 'setup_meeting_board':
      const meetingBoard = await setupMeetingPreparationBoard(
        miroAPI, 
        params.arguments.meeting_title,
        params.arguments.participants || []
      );
      return {
        content: [{
          type: "text",
          text: `🎯 Meeting preparation board created!\n\nBoard: "${meetingBoard.name}"\nID: ${meetingBoard.id}\nURL: ${meetingBoard.viewLink}\n\nThe board includes:\n• Stakeholder perspective mapping\n• Value proposition development\n• Question strategy planning\n• Conversation flow design`
        }]
      };

    default:
      throw new Error(`Unknown tool: ${params.name}`);
  }
}

async function setupMeetingPreparationBoard(miroAPI, meetingTitle, participants) {
  // Create the main board
  const board = await miroAPI.createBoard(
    `${meetingTitle} - Preparation Board`,
    'Collaborative preparation workspace for productive stakeholder discussions'
  );

  const boardId = board.id;
  
  // Define layout positions
  const frameWidth = 800;
  const frameHeight = 600;
  const spacing = 100;
  
  // Create main frames
  const frames = [
    { title: '🎯 Meeting Objectives', x: 0, y: 0 },
    { title: '👥 Stakeholder Perspectives', x: frameWidth + spacing, y: 0 },
    { title: '💡 Value Propositions', x: 0, y: frameHeight + spacing },
    { title: '❓ Question Strategy', x: frameWidth + spacing, y: frameHeight + spacing },
    { title: '🗣️ Conversation Flow', x: (frameWidth + spacing) / 2, y: (frameHeight + spacing) * 2 }
  ];

  for (const frame of frames) {
    await miroAPI.createFrame(boardId, frame.title, frame.x, frame.y, frameWidth, frameHeight);
  }

  // Add guidance sticky notes
  const guidanceNotes = [
    { content: 'Define 2-3 clear outcomes we want from this meeting', x: 50, y: 100, color: 'blue' },
    { content: 'Map concerns, pressures, and success metrics for each stakeholder', x: frameWidth + spacing + 50, y: 100, color: 'green' },
    { content: 'Focus on benefits for THEM, not solving our problems', x: 50, y: frameHeight + spacing + 100, color: 'yellow' },
    { content: 'Prepare open-ended questions that invite sharing first', x: frameWidth + spacing + 50, y: frameHeight + spacing + 100, color: 'pink' },
    { content: 'Plan a listening-first approach: understand → empathize → suggest', x: (frameWidth + spacing) / 2 + 50, y: (frameHeight + spacing) * 2 + 100, color: 'orange' }
  ];

  for (const note of guidanceNotes) {
    await miroAPI.createStickyNote(boardId, note.content, note.x, note.y, note.color);
  }

  // Add participant names if provided
  if (participants.length > 0) {
    let participantY = 200;
    for (const participant of participants) {
      await miroAPI.createStickyNote(boardId, `👤 ${participant}`, frameWidth + spacing + 50, participantY, 'purple');
      participantY += 80;
    }
  }

  return board;
}