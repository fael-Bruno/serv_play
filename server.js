const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const zlib = require("zlib");

const app = express();
const PORT = process.env.PORT || 3000;

function cleanHtml(html) {
  try {
    // Remove iframes e scripts comuns de ads
    html = html.replace(/<iframe[^>]*ads[^>]*><\/iframe>/gi, "");
    html = html.replace(/<script[^>]*>[\s\S]*?(adsbygoogle|adserver|ezoic|popads|adsterra|propeller)[\s\S]*?<\/script>/gi, "");
    html = html.replace(/<div[^>]*(id|class)=(["'])(ads?|advert|banner|pop|promo)[^>]*>[\s\S]*?<\/div>/gi, "");
  } catch (e) {}
  return html;
}

function proxyWithFilter(path) {
  return createProxyMiddleware({
    target: "https://embedtv-3.icu",
    changeOrigin: true,
    followRedirects: true,
    secure: false,
    pathRewrite: { [`^/${path}`]: `/${path}` },
    selfHandleResponse: true, // vamos decidir por resposta
    onProxyRes(proxyRes, req, res) {
      const status = proxyRes.statusCode || 200;
      const headers = { ...proxyRes.headers };

      // Permitir embed e CORS no seu domínio
      delete headers["x-frame-options"];
      delete headers["content-security-policy"];
      headers["access-control-allow-origin"] = "*";
      headers["access-control-allow-credentials"] = "true";

      const contentType = String(headers["content-type"] || "");
      const encoding = String(headers["content-encoding"] || "").toLowerCase();

      // Não vamos reenviar content-length/encoding pois podemos alterar o corpo
      delete headers["content-length"];
      delete headers["content-encoding"];

      // Se NÃO for HTML (ex: .m3u8, .ts, imagens, js, css), apenas repassar o stream
      if (!contentType.includes("text/html")) {
        res.writeHead(status, headers);
        proxyRes.pipe(res);
        return;
      }

      // Para HTML, ler, descomprimir (se preciso), filtrar e devolver
      let body = Buffer.from([]);
      proxyRes.on("data", (chunk) => {
        body = Buffer.concat([body, chunk]);
      });

      proxyRes.on("end", () => {
        try {
          if (encoding === "br") {
            body = zlib.brotliDecompressSync(body);
          } else if (encoding === "gzip") {
            body = zlib.gunzipSync(body);
          } else if (encoding === "deflate") {
            body = zlib.inflateSync(body);
          }
        } catch (e) {
          // Se falhar descompressão, envia como estava
        }

        let html = body.toString("utf8");
        html = cleanHtml(html);

        headers["content-type"] = "text/html; charset=utf-8";
        res.writeHead(status, headers);
        res.end(html);
      });
    },
    onError(err, req, res) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("Proxy error: " + (err && err.message ? err.message : "unknown"));
    },
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      "Referer": "https://embedtv-3.icu/"
    }
  });
}

// Rotas atualizadas
app.use("/premiere", proxyWithFilter("premiere"));
app.use("/primevideo", proxyWithFilter("primevideo"));
app.use("/primevideo2", proxyWithFilter("primevideo2"));
app.use("/sportv", proxyWithFilter("sportv"));
app.use("/sportv2", proxyWithFilter("sportv2"));

// Health check
app.get("/", (req, res) => {
  res.type("text/plain").send("✅ serv-play rodando. Rotas: /premiere, /primevideo, /primevideo2, /sportv, /sportv2");
});


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
