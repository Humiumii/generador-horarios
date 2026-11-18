# Diseño de Cuadra

## Atmósfera

Una agenda universitaria de trabajo. La semana domina la pantalla. A la izquierda, los controles se agrupan por tarea con separadores finos, y las alternativas exponen las dos métricas antes de abrir cada horario.

## Color y tipo

- Fondo gris lavanda `#f1f2f8`, superficies blancas `#ffffff` y líneas `#dee1ee`.
- Tinta `#182044`, texto secundario `#505b7b` y acción índigo `#293aa0`.
- Cada ramo conserva su color entre alternativas. Los bloques ocupados usan un patrón rayado y texto explícito.
- Barlow Semi Condensed para títulos e Inter para controles, contenido y horas tabulares. Las fuentes de sistema cubren la carga sin conexión.

## Composición

```text
Escritorio
Marca y contexto
Título
Ramos y preferencias   |   Alternativas → métricas
Horas ocupadas         |   Grilla lunes a viernes

Móvil
Marca y contexto
Título
Ramos → horas ocupadas → preferencia
Alternativas → selector de día → grilla del día
```

El estado inicial abre el ejemplo con cuatro ramos. El botón de generar aplica los cambios juntos y lleva el foco a los resultados. Las opciones nativas permiten recorrer los controles con teclado. El calendario usa inicios y duraciones en minutos y mantiene las horas alineadas entre días.

## Componentes y comportamiento

- El catálogo presenta código y nombre. Las secciones aparecen en los bloques de la grilla.
- Las alternativas conservan un ancho mínimo legible y se desplazan dentro de su fila.
- Los bloques ocupados se agregan por día, inicio y término. Se pueden quitar individualmente.
- La alternativa activa se distingue por borde y fondo. Las transiciones de color duran 120 ms y respetan la preferencia de movimiento reducido.
- Los estados de carga, selección vacía, error y restricciones incompatibles tienen texto propio.
- El diseño se implementó en React a partir de estas decisiones. Google Stitch no estaba conectado.

