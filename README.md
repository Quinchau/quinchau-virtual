# QuinchauVirtual

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.2.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

####
Documentación del Endpoint get-products.php
######
Este endpoint está diseñado para consultar y obtener datos de productos de la base de datos, con la capacidad de filtrar la información por diferentes criterios.
URL del Endpoint
https://www.quinchau.com/webmaster2/api-quinchau-virtual/get-products.php

Método de Petición
GET
Autenticación
Este endpoint requiere un token de acceso (JWT) para la autenticación. Debes incluir el token en los headers de la petición bajo el nombre Authorization.

Ejemplo de Header:
Authorization: Bearer [TU_TOKEN_JWT_AQUI]
Parámetros de la URL (Query Parameters)
Puedes combinar los siguientes parámetros para filtrar los resultados de forma más precisa. Si no se incluye ningún parámetro, la API devolverá todos los productos disponibles.

search: Filtra los productos cuya descripción o código contengan el texto especificado. La búsqueda no distingue entre mayúsculas y minúsculas. Ejemplo: ?search=bujia
stock: Filtra los productos con una cantidad en inventario mayor o igual a 1. Ejemplo: ?stock=1
Ejemplos de Uso (cURL)
A continuación, se muestran ejemplos prácticos para que puedas probar el endpoint desde tu terminal, combinando los diferentes parámetros.

Obtener todos los productos
Bash
curl 'https://www.quinchau.com/webmaster2/api-quinchau-virtual/get-products.php' \
-H 'Authorization: Bearer [TU_TOKEN_JWT_AQUI]'
Buscar productos con la palabra "Bujia"

Bash
curl 'https://www.quinchau.com/webmaster2/api-quinchau-virtual/get-products.php?search=bujia' \
-H 'Authorization: Bearer [TU_TOKEN_JWT_AQUI]'
Obtener solo productos con inventario disponible

Bash
curl 'https://www.quinchau.com/webmaster2/api-quinchau-virtual/get-products.php?stock=1' \
-H 'Authorization: Bearer [TU_TOKEN_JWT_AQUI]'
Combinar búsqueda y filtro de inventario (más común)

Bash
curl 'https://www.quinchau.com/webmaster2/api-quinchau-virtual/get-products.php?search=bujia&stock=1' \
-H 'Authorization: Bearer [TU_TOKEN_JWT_AQUI]'
Estructura de la Respuesta (JSON)
El endpoint devuelve un array de objetos, donde cada objeto representa un producto.

Ejemplo de Respuesta exitosa:
JSON
[
  {
    "stockid": "830-777",
    "description": "Bobina Ignicion Bujia HJ125 BWS125 Solpart",
    "longdescription": "830-777 10031697 Bobina Ignicion Bujia HJ125 BWS125 Solpart",
    "units": "PZA",
    "price_with_tax": 8.02,
    "total_quantity": 9,
    "idmodelo": 21,
    "tags": null,
    "latest_trandate": "2023-10-11",
    "cover_image_id": "https://quinchau.com/weberp/img/p/1/6/4/1/4/16414.jpg",
    "all_image_ids": null
  },
  {
    "stockid": "468-016",
    "description": "BUJIA DR7SPEIX IRIDIUM SOLPART ",
    "longdescription": "468-016 10031751 BUJIA DR7SPEIX IRIDIUM SOLPART ",
    "units": "PZA",
    "price_with_tax": 5.56,
    "total_quantity": 3,
    "idmodelo": 129,
    "tags": null,
    "latest_trandate": "2023-09-10",
    "cover_image_id": "https://quinchau.com/weberp/img/p/1/8/2/0/2/18202.jpg",
    "all_image_ids": null
  }
]
Códigos de estado HTTP:
200 OK: La petición fue exitosa y se devolvieron datos.
401 Unauthorized: No se incluyó el token de autenticación o es inválido.
500 Internal Server Error: Ocurrió un error en el servidor.


##### endpoints ###########

curl -i -X GET "https://gestion.quinchau.com/webmaster2/api-quinchau-virtual/get_home_data.php"
HTTP/2 200 
server: nginx
date: Mon, 16 Feb 2026 19:20:20 GMT
content-type: application/json
content-length: 436
x-powered-by: PHP/5.6.40
access-control-allow-origin: *

[{"idbanner":"1","titulo":"Banner Azul Ondulado","descripcion":"Fondo decorativo azul para promociones","img_url":"https:\/\/quinchau.com\/weberp\/img\/b\/pngtree-blue-wavy-banner-background-blank-image_1608934.jpg","link_url":"\/categorias"},{"idbanner":"2","titulo":"Banner Morado","descripcion":"Dise\u00f1o elegante en tonos morados","img_url":"https:\/\/quinchau.com\/weberp\/img\/b\/images-banner-morado.jpg","link_url":"\/home"}]
