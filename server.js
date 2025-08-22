const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3000;

const proxyWithFilter = (path) => createProxyMiddleware({
  target: "https://embedtv-3.icu",
  changeOrigin: true,
  pathRewrite: { [`^/${path}`]: `/${path}` },
  selfHandleResponse: true, // importante para interceptar resposta
  onProxyRes: async (proxyRes, req, res) => {
    let body = Buffer.from([]);
    proxyRes.on("data", chunk => {
      body = Buffer.concat([body, chunk]);
    });
    proxyRes.on("end", () => {
      let html = body.toString();

      // remove iframes de anúncios
      html = html.replace(/<iframe[^>]*ads[^>]*><\\/iframe>/gi, "");
      // remove scripts que contenham "ads"
      html = html.replace(/<script[^>]*>.*ads.*<\\/script>/gi, "");

      res.setHeader("Content-Type", "text/html");
      res.end(html);
    });
  },
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "Referer": "https://embedtv-3.icu/"
  }
});

// Rotas
app.use("/sportv1", proxyWithFilter("sportv1"));
app.use("/premiere", proxyWithFilter("premiere"));
app.use("/premiere2", proxyWithFilter("premiere2"));
app.use("/primevideo", proxyWithFilter("primevideo"));
app.use("/primevideo2", proxyWithFilter("primevideo2"));

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
