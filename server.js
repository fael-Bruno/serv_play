const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// Proxy para SPORTV1
app.use("/sportv1", createProxyMiddleware({
  target: "https://redecanalstv.ee",
  changeOrigin: true,
  pathRewrite: { "^/sportv1": "/player3/ch.php?canal=sportv1" }
}));

// Proxy para Premiere Clubes
app.use("/premiere", createProxyMiddleware({
  target: "https://redecanalstv.ee",
  changeOrigin: true,
  pathRewrite: { "^/premiere": "/player3/ch.php?canal=premiereclubes" }
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Proxy rodando em http://localhost:${PORT}`);
});
