const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração base
const proxyConfig = (path) => createProxyMiddleware({
  target: "https://embedtv-3.icu",
  changeOrigin: true,
  pathRewrite: { [`^/${path}`]: `/${path}` },
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
    "Referer": "https://embedtv-3.icu/"
  }
});

// Rotas configuradas
app.use("/sportv1", proxyConfig("sportv1"));
app.use("/premiere", proxyConfig("premiere"));
app.use("/premiere2", proxyConfig("premiere2"));
app.use("/primevideo", proxyConfig("primevideo"));
app.use("/primevideo2", proxyConfig("primevideo2"));

// Página inicial para teste
app.get("/", (req, res) => {
  res.send(`
    ✅ Proxy do Servidor está rodando!<br>
    Use /sportv1, /premiere, /premiere2, /primevideo ou /primevideo2
  `);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});