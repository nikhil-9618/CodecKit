export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/')) {
      url.pathname += 'index.html';
      return env.ASSETS.fetch(new Request(url, request));
    }

    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || /\.[^/]+$/.test(url.pathname)) return response;

    url.pathname += '.html';
    return env.ASSETS.fetch(new Request(url, request));
  },
};
