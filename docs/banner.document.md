# Especificación Técnica — Banners Hero

## Descripción general

El banner hero es el componente visual principal de la página de inicio. Es un carrusel de imágenes con overlay de texto, construido en Angular 21 con Tailwind CSS puro. Cada banner se sirve en dos versiones de imagen según el dispositivo del usuario, seleccionadas nativamente por el navegador mediante el elemento `<picture>`.

---

## Estructura de datos (Base de datos)

**Tabla:** `banners` — Base de datos MySQL `tum12607_maracay`

| Campo | Tipo | Nulo | Descripción |
|---|---|---|---|
| `idbanner` | INT | NO | Clave primaria autoincremental |
| `titulo` | VARCHAR(255) | NO | Etiqueta superior en naranja (ej: nombre de categoría) |
| `descripcion` | VARCHAR(255) | NO | Texto principal del banner |
| `img_url` | VARCHAR(255) | NO | Imagen mobile — proporción 2:1 |
| `img_url_wide` | VARCHAR(255) | SÍ | Imagen desktop — proporción 3:1 (nullable) |
| `link_url` | VARCHAR(255) | NO | Ruta de destino al hacer clic |
| `prioridad` | INT | NO | Orden de aparición en el carrusel (ASC) |
| `activo` | TINYINT(1) | NO | `1` visible / `0` oculto |
| `created_at` | DATETIME | NO | Fecha de creación del registro |

---

## Especificación de imágenes

### Versión mobile — `img_url`

| Propiedad | Valor |
|---|---|
| Proporción | **2:1** (16:8) |
| Dimensiones | 1200 × 600 px |
| Formato | `.webp` |
| Peso máximo | 150 KB |
| Breakpoint activo | `< 768px` |
| Convención de nombre | `{idbanner}_mobile.webp` |

### Versión desktop — `img_url_wide`

| Propiedad | Valor |
|---|---|
| Proporción | **3:1** (21:7) |
| Dimensiones | 2100 × 700 px |
| Formato | `.webp` |
| Peso máximo | 250 KB |
| Breakpoint activo | `≥ 768px` (Tailwind `md:`) |
| Convención de nombre | `{idbanner}_wide.webp` |

### Consideraciones de diseño

- El **sujeto principal** de la imagen debe estar centrado horizontalmente, ya que la versión mobile recorta los laterales de la versión desktop.
- Ambas imágenes se sirven desde la misma ruta base: `https://quinchau.com/weberp/img/b/`
- Si `img_url_wide` es `NULL`, el navegador usa `img_url` como fallback en todos los breakpoints sin errores.

---

## Comportamiento responsivo

La selección de imagen es **nativa del navegador** mediante `<picture>` + `<source media>`. Angular únicamente renderiza el HTML; la decisión de descarga ocurre antes de cualquier request de red.

```
< 768px   →  navegador descarga  img_url       (2:1 mobile)
≥ 768px   →  navegador descarga  img_url_wide  (3:1 desktop)

En ambos casos: 1 solo request de red por banner
```

---

## Servicio backend (`home.service.ts`)

```typescript
const BASE_URL_BANNERS = 'https://quinchau.com/weberp/img/b/';

async getBanners() {
    const banners = await query(
        `SELECT idbanner, titulo, descripcion, img_url, img_url_wide, link_url
         FROM banners WHERE activo = 1 ORDER BY prioridad ASC`
    ) as any[];

    return banners.map(b => ({
        ...b,
        img_url:      b.img_url      ? `${BASE_URL_BANNERS}${b.img_url}`      : null,
        img_url_wide: b.img_url_wide ? `${BASE_URL_BANNERS}${b.img_url_wide}` : null,
    }));
}
```

---

## Interfaz TypeScript (`Banner`)

```typescript
export interface Banner {
  idbanner:     number;
  titulo:       string;
  descripcion:  string;
  img_url:      string;
  img_url_wide?: string;   // nullable — fallback a img_url si no existe
  link_url:     string;
  prioridad:    number;
  activo:       number;
  created_at:   string;
}
```

---

## Template Angular (fragmento clave)

```html
<picture class="block w-full h-full">
  <source
    media="(min-width: 768px)"
    [srcset]="banner.img_url_wide ?? banner.img_url"
  />
  <img
    [src]="banner.img_url"
    [alt]="banner.titulo"
    class="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
    loading="lazy"
    decoding="async"
  />
</picture>
```

---

## Flujo de alta de un banner nuevo

```
1. Diseñar imagen en proporción 3:1 (2100×700px) — versión desktop
2. Recortar versión 2:1 (1200×600px) centrada — versión mobile
3. Exportar ambas en .webp optimizado
4. Nombrar archivos: {idbanner}_mobile.webp / {idbanner}_wide.webp
5. Subir ambos archivos a: /weberp/img/b/
6. Insertar registro en BD con ambas URLs (solo nombre de archivo, sin ruta base)
7. Verificar activo = 1 y prioridad correcta
```

---

## Migración SQL

```sql
-- Agregar columna img_url_wide a tabla existente
ALTER TABLE `banners`
  ADD COLUMN `img_url_wide` VARCHAR(255) NULL DEFAULT NULL
  AFTER `img_url`;

-- Actualizar registros existentes cuando las imágenes wide estén disponibles
UPDATE `banners` SET img_url_wide = '1_wide.webp' WHERE idbanner = 1;
UPDATE `banners` SET img_url_wide = '2_wide.webp' WHERE idbanner = 2;
```

---

*Última actualización: Abril 2026*