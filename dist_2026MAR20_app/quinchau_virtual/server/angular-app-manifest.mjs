
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 0,
    "redirectTo": "/home",
    "route": "/"
  },
  {
    "renderMode": 0,
    "route": "/login"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-QRFOYZYC.js"
    ],
    "route": "/register"
  },
  {
    "renderMode": 0,
    "route": "/home"
  },
  {
    "renderMode": 0,
    "route": "/checkout"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-YZPHAMWX.js"
    ],
    "route": "/success/*"
  },
  {
    "renderMode": 0,
    "route": "/dashboard"
  },
  {
    "renderMode": 0,
    "route": "/new-transfer"
  },
  {
    "renderMode": 0,
    "route": "/new-transfer/product/*"
  },
  {
    "renderMode": 0,
    "route": "/transfers"
  },
  {
    "renderMode": 0,
    "route": "/transfers/detail/*"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-7D5FABY5.js"
    ],
    "route": "/category"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-7D5FABY5.js"
    ],
    "route": "/category/*"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-7D5FABY5.js"
    ],
    "route": "/category/*/*"
  },
  {
    "renderMode": 0,
    "route": "/*"
  },
  {
    "renderMode": 0,
    "route": "/*/*"
  },
  {
    "renderMode": 0,
    "route": "/*/*/*"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 2293, hash: 'e5f4698d7054db279371ab504c07064ae53e1d7d297843045fc4c872a76b5703', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1106, hash: 'ecfd694a846c74e2e0e32e51df517e5a9de8d02af05c49e39fcc36d44794817e', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-P4IIBIG6.css': {size: 39398, hash: 'rdSnQV15564', text: () => import('./assets-chunks/styles-P4IIBIG6_css.mjs').then(m => m.default)}
  },
};
