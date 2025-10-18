// API Worker Entry Point
// This file will be implemented by the Backend Agent

export default {
  async fetch(_request: Request, _env: any, _ctx: any): Promise<Response> {
    return new Response('SkillStash API - Coming Soon', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};
