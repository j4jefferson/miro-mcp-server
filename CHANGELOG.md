# Changelog

All notable changes to the Miro MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-05

### Added
- Initial release of Miro MCP Server
- Complete MCP protocol implementation
- OAuth 2.0 integration with Miro API
- Cloudflare Workers deployment with GitHub Actions
- Core Miro board management tools:
  - `create_board` - Create new Miro boards
  - `create_sticky_note` - Add sticky notes with positioning and colors
  - `create_frame` - Create organizational frames
  - `create_text` - Add text elements
  - `list_boards` - List user's boards
  - `get_board_items` - Retrieve board contents
- Meeting preparation template (`setup_meeting_board`)
- Comprehensive documentation and setup guides
- VS Code development configuration
- Automated deployment pipeline
- Health check and status endpoints
- Error handling and logging

### Features
- **Secure Authentication**: OAuth 2.0 flow with token storage in Cloudflare KV
- **Meeting Templates**: Pre-built workspace for stakeholder collaboration
- **Global Deployment**: Cloudflare Workers for low-latency worldwide access
- **Developer Experience**: Complete VS Code setup with debugging support
- **CI/CD Pipeline**: Automated deployment from GitHub to Cloudflare

### Documentation
- Complete README with quick start guide
- Detailed setup instructions (SETUP.md)
- API endpoint documentation
- Troubleshooting guide
- Development workflow documentation

### Infrastructure
- GitHub Actions workflow for automated deployment
- Cloudflare KV storage for secure token management
- Environment variable configuration
- CORS support for web-based MCP clients

---

## Planned Features

### [1.1.0] - Future
- Enhanced meeting templates
- Bulk operations for board management
- Board sharing and permissions management
- Advanced positioning and layout tools

### [1.2.0] - Future
- Real-time collaboration features
- Board export capabilities
- Integration with calendar systems
- Meeting outcome tracking

### [2.0.0] - Future
- Multi-user support with team management
- Custom template creation
- Advanced analytics and reporting
- Integration with other collaboration tools