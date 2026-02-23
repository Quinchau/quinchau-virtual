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


app.use(cookieParser());


app.use((req, _res, next) => {
  const guestId = req.cookies['guest_id'] || null;

  (req as any).guestId = guestId;

  next();
});


app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});


if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4004;
  app.listen(port, () => {
    console.log(`\n🚀 Servidor SSR en http://localhost:${port}`);

  });
}

export const reqHandler = createNodeRequestHandler(app);
