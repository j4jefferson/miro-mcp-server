export class MiroAPI {
  constructor(env) {
    this.env = env;
    this.baseURL = 'https://api.miro.com/v2';
  }

  async getAccessToken() {
    const token = await this.env.MIRO_TOKENS.get('access_token');
    if (!token) {
      throw new Error('No access token found. Please authorize the application first.');
    }
    return token;
  }

  async makeRequest(endpoint, options = {}) {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Miro API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async exchangeCodeForToken(code, origin) {
    const response = await fetch('https://api.miro.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.env.MIRO_CLIENT_ID,
        client_secret: this.env.MIRO_CLIENT_SECRET,
        code: code,
        redirect_uri: `${origin}/oauth/callback`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async createBoard(name, description = '') {
    return this.makeRequest('/boards', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        policy: {
          permissionsPolicy: {
            collaborationToolsStartAccess: 'all_editors',
            copyAccess: 'anyone',
            sharingAccess: 'team_members_with_editing_rights'
          }
        }
      })
    });
  }

  async listBoards() {
    const response = await this.makeRequest('/boards');
    return response.data || [];
  }

  async createStickyNote(boardId, content, x = 0, y = 0, color = 'yellow') {
    return this.makeRequest(`/boards/${boardId}/sticky_notes`, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          content,
          shape: 'square'
        },
        style: {
          fillColor: color
        },
        position: { x, y }
      })
    });
  }

  async createFrame(boardId, title, x = 0, y = 0, width = 400, height = 300) {
    return this.makeRequest(`/boards/${boardId}/frames`, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          title,
          format: 'custom'
        },
        position: { x, y },
        geometry: { width, height }
      })
    });
  }

  async createText(boardId, content, x = 0, y = 0) {
    return this.makeRequest(`/boards/${boardId}/texts`, {
      method: 'POST',
      body: JSON.stringify({
        data: {
          content
        },
        position: { x, y }
      })
    });
  }

  async getBoardItems(boardId) {
    const response = await this.makeRequest(`/boards/${boardId}/items`);
    return response.data || [];
  }
}