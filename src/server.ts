// server.ts - Versión sin httpOnly (cookie accesible desde JavaScript)
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import cookieParser from 'cookie-parser';
import { randomBytes } from 'node:crypto'; // Usamos crypto en lugar de uuid

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use(cookieParser());

// =============================================
// FUNCIÓN PARA GENERAR GUEST ID
// =============================================
function generateGuestId(): string {
  const randomPart = randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `guest_${randomPart}_${timestamp}`;
}

// =============================================
// MIDDLEWARE PRINCIPAL - DETECTA Y CREA COOKIE
// =============================================
app.use((req, res, next) => {
  // 1. Leer cookie existente
  let guestId = req.cookies['guest_id'];
  
  console.log('\n=== [GUEST MIDDLEWARE] ===');
  console.log(`🍪 Cookie existente: ${guestId || 'NO'}`);
  
  // 2. DECISIÓN: ¿Crear cookie?
  if (!guestId) {
    // NO HAY COOKIE - La creamos inmediatamente
    guestId = generateGuestId();
    
    // Crear cookie NO httpOnly - accesible desde JavaScript
    res.cookie('guest_id', guestId, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      httpOnly: false, // 🔴 IMPORTANTE: false para acceso desde JS
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    console.log(`🆕 Cookie CREADA (no httpOnly): ${guestId}`);
  } else {
    console.log(`✅ Cookie EXISTENTE: ${guestId}`);
  }
  
  // Adjuntar al request para Angular (opcional)
  (req as any).guestId = guestId;
  
  console.log('===========================\n');
  
  next();
});

// =============================================
// ENDPOINT DE VERIFICACIÓN (opcional)
// =============================================
app.get('/api/guest/check', (req, res) => {
  const guestId = req.cookies['guest_id'] || null;
  console.log(`🔍 [API] Verificando guestId: ${guestId}`);
  res.json({
    guestId: guestId,
    cookieExists: !!guestId
  });
});

// =============================================
// MANEJADOR DE ANGULAR
// =============================================
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

// =============================================
// INICIALIZACIÓN DEL SERVIDOR
// =============================================
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4004;
  app.listen(port, () => {
    console.log(`\n🚀 Servidor en http://localhost:${port}`);
    console.log(`🍪 Cookie NO httpOnly - Accesible desde JavaScript`);
    console.log(`📝 El frontend puede leer la cookie directamente\n`);
  });
}

export const reqHandler = createNodeRequestHandler(app);