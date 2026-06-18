import { createAEOWorker } from "@dualmark/cloudflare";

const aeoWorker = createAEOWorker({
  upstream: {
    async fetch(request, env, _ctx) {
      // Serve static assets directly from Cloudflare Pages
      return env.ASSETS.fetch(request);
    },
  },
  trailingSlash: "preserve",
  enableLinkHeader: true,
});

export default {
  async fetch(request: Request, env: any, ctx: any) {
    const url = new URL(request.url);
    const cleanPath = url.pathname.replace(/\/+$/, "");
    if (cleanPath === "/save-money-on-home-loan") {
      return Response.redirect(new URL("/", url.origin).toString(), 301);
    }
    return aeoWorker.fetch(request, env, ctx);
  }
};
