// server.ts - SSR sin creación de guest_id (cookie gestionada por el backend)
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import cookieParser from 'cookie-parser';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Archivos estáticos
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

// Solo lectura de cookies (no creación)
app.use(cookieParser());

// Middleware opcional de logging / transporte de guest_id
app.use((req, _res, next) => {
  const guestId = req.cookies['guest_id'] || null;

  console.log('\n=== [GUEST MIDDLEWARE] ===');
  console.log(`🍪 guest_id recibido: ${guestId || 'NO'}`);

  // Se expone al request solo como dato de contexto (no se genera ni modifica)
  (req as any).guestId = guestId;

  next();
});

// SSR handler
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

// Arranque del servidor
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4004;
  app.listen(port, () => {
    console.log(`\n🚀 Servidor SSR en http://localhost:${port}`);
    console.log(`🍪 guest_id es gestionado por el backend (PHP), no por el SSR\n`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
