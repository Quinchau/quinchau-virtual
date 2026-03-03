#####  CONTEXTO DEL DESARROLLO ######
## BACKEND -> php 5.6 Deprecated
## RESTRICCIONES DE VERSIÓN PHP
- **Versión objetivo**: PHP 5.6
- **Documentación de referencia**: http://reeves.fr/docs/php/php5.6/
- **Sintaxis PROHIBIDA** (no existen en PHP 5.6):
  - Tipado escalar (ej. `function suma(int $a, int $b)`)
  - Declaraciones `strict_types`
  - Operador `??` (null coalescing) - usar `isset()` en su lugar
  - Operador `<=>` (spaceship)
  - Arrays cortos con sintaxis `[]`? (Sí existen desde PHP 5.4, ¡estos sí puedes usarlos!)
  - Clases anónimas
  - Traits ¿? (Sí existen desde PHP 5.4)
- **Funciones obsoletas que generan WARNING**:
  - `$HTTP_RAW_POST_DATA` (reemplazar con `file_get_contents('php://input')`)
- **Extensiones no disponibles**:
  - Todas las modernas, verificar siempre `function_exists()` antes de usar
  
## FRONTEND
## DOCUMENTACIÓN DE REFERENCIA: ANGULAR 21
- **Documentación general (v21)**: https://angular.dev/overview
- **API Reference**: https://angular.dev/api
- **RxResource API (tu interés específico)**: https://angular.dev/api/core/rxjs-interop/rxResource
- **Notas de lanzamiento (cambios en v21)**: https://github.com/angular/angular/blob/main/CHANGELOG.md
- **Estilos con Tailwind**: https://tailwindcss.com/docs/guides/angular
- **Estructura** 
