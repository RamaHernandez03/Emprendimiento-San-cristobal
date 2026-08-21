# Contexto del proyecto — Calvo 2500

## Objetivo

Landing page comercial para un desarrollo inmobiliario a estrenar en Carlos Calvo 2590, San Cristóbal, CABA. Debe ser rápida, clara, didáctica y especialmente cuidada en mobile y tablet. El sitio público continúa alojado en Netlify y utiliza Supabase para vendedores, atribución, métricas y autenticación del panel privado.

## Referencias recibidas

- Sitio de inspiración estructural: https://rl70.netlify.app/
- 2 ambientes al frente con balcón: https://www.remax.com.ar/listings/venta-depto-2-amb-frente-balcon-san-cristobal
- Monoambiente, variante C: https://www.remax.com.ar/listings/venta-monoambiente-a-estrenar-san-cristobal-4-c
- Monoambiente, variante B: https://www.remax.com.ar/listings/venta-monoambiente-a-estrenar-san-cristobal-b

## Decisiones de producto y diseño

- Identidad provisoria: **CC 2500 / Calvo 2500**. Debe confirmarse el nombre comercial definitivo.
- Enfoque visual: editorial, cálido y urbano; verde profundo, terracota y tonos minerales.
- Se evita copiar RL70 literalmente. Se conserva lo valioso de su arquitectura de información: hero, proyecto, unidades, barrio, preguntas y CTA.
- Las condiciones que pueden cambiar (precio, disponibilidad, entrega) no se duplican: se derivan a las fichas comerciales.
- Las imágenes amuebladas deben identificarse como ilustrativas y potencialmente generadas con IA.
- Netlify sirve los archivos estáticos y Supabase funciona como backend administrado. Ninguna clave privada se incluye en el navegador.

## Estado actual

- Sitio estático funcional, sin build step, conectado a Supabase mediante una Edge Function pública validada y endpoints protegidos por Auth + RLS.
- Toda la información comercial del proyecto y de las tres tipologías está publicada dentro del sitio.
- La comercialización se presenta institucionalmente a nombre de **RE/MAX Encore**. Todas las acciones comerciales abren el WhatsApp configurado, sin focalizar la comunicación en una persona particular.
- No existen enlaces a RE/MAX.
- Las 56 imágenes recibidas fueron convertidas a WebP y optimizadas de aproximadamente 185 MB a 11 MB.
- Galerías completas por unidad con navegación, miniaturas y teclado.
- La galería del 2 ambientes contiene 19 fotografías; se eliminó la segunda imagen del orden anterior porque pertenecía a otra unidad.
- Las ambientaciones ilustrativas de living funcionan como portada y aparecen primero en cada galería. El orden manual se define en la propiedad `images` de cada unidad dentro de `script.js`.
- Toda la superficie de cada card abre su ficha (también mediante Enter o Espacio); el botón de WhatsApp conserva su acción independiente.
- Se eliminaron las referencias visibles a UF B, UF C y “Unidad 2 ambientes”; las tipologías se comunican mediante títulos descriptivos.
- Carrusel principal automático con 6 imágenes entregadas por el cliente, en el orden manual 4, 5, 6, 2, 1, 3, con transición suave y controles manuales.
- Sección de recorridos con 3 videos reales, uno por tipología. Los originales sumaban aproximadamente 326 MB; las versiones web 480p suman 53 MB y usan `preload="none"`, por lo que sólo se descargan al abrir el reproductor.
- Collage visual del entorno con estaciones de Subte, UBA Psicología y Hospital Ramos Mejía.
- La sección de ubicación prioriza la dirección Carlos Calvo 2590 y un mapa de Google Maps embebido, con CTA para coordinar una visita.
- Animaciones progresivas de entrada respetando `prefers-reduced-motion`.
- Responsive para desktop, iPad y mobile.
- Navegación móvil, filtros de tipología, animaciones progresivas y FAQ accesible.
- SEO básico, metadatos y contenido semántico incluidos.
- El copy comercial distingue datos confirmados de condiciones sujetas a consulta. La sección de preguntas frecuentes cubre entrega, tipologías, edificio, gastos, financiación, expensas, reserva, material ilustrativo y vigencia de precios.
- `/sumate` permite registrar vendedores y genera un link personal con `?vendedor=slug`.
- Todo vendedor nuevo queda pendiente. Jorge debe aprobarlo desde `/panel`; hasta entonces el enlace no personaliza el contacto ni atribuye actividad al vendedor.
- Una vez aprobado, el panel muestra un botón para copiar el enlace completo del vendedor.
- Pendiente futuro: al disponer de un dominio propio, verificar un remitente en Resend y enviar automáticamente el link por correo al aprobar. No incorporar claves de email al frontend ni al repositorio.
- El alta acepta exactamente 10 dígitos nacionales de WhatsApp y normaliza el destino al formato argentino `549…`, evitando prefijos `54` duplicados.
- Cuando se abre un link de vendedor, todos los CTA de WhatsApp y textos de contacto se personalizan con su nombre y teléfono.
- `/panel` es privado y muestra visitas, sesiones, aperturas de propiedades, clics a WhatsApp y rendimiento por vendedor.
- El listado de vendedores del panel se pagina visualmente de a 10 registros.
- El footer conserva su composición original y muestra únicamente un logo negro y discreto de RE/MAX Encore en la columna derecha, sin placa ni texto adicional. La página `/sumate` mantiene su encabezado tipográfico original, sin logo.
- Superusuario operativo: `jallaria@remax.com.ar`. Su contraseña no se versiona ni debe documentarse en el repositorio.
- Eventos medidos: `page_view`, `seller_link_view`, `unit_view` y `whatsapp_click`.
- Proyecto Supabase: `Carlos Calvo 2590`, referencia `ahgvuzeldnhxztbhcurt`, región São Paulo (`sa-east-1`).
- Edge Function: `public-api`, con acciones `resolveSeller`, `registerSeller` y `track`.
- RLS activa en `admins`, `sellers` y `events`. Las vistas del panel usan `security_invoker=true`.
- Listo para desplegar conectando el repositorio a Netlify.

## Pendientes imprescindibles antes de publicar

1. Confirmar nombre oficial del emprendimiento; actualmente se usa **Calvo 2590 / CC2590**.
2. Confirmar si la dirección comercial debe mostrarse como Carlos Calvo 2590 o Carlos Calvo 2500. Las descripciones recibidas indican 2590 y la ubicación resumida indica 2500; el sitio prioriza 2590.
3. Confirmar disponibilidad y condiciones concretas de financiación.
4. Agregar dominio, favicon, OG image, Analytics/Meta Pixel sólo si el cliente los solicita.
5. Jorge debe cambiar la contraseña temporal del panel después de recibirla.

## Reglas de contenido

- Los precios publicados provienen de la información entregada el 19/08/2026 y quedan sujetos a confirmación comercial.
- No presentar renders ambientados como fotografías contractuales.
- Mantener contacto y CTA visibles sin saturar la navegación.
- Priorizar velocidad: imágenes locales menores a 250–350 KB, lazy loading debajo del hero y cero librerías innecesarias.

## Estructura técnica

- `index.html`: contenido y estructura.
- `styles.css`: sistema visual y responsive.
- `script.js`: menú, filtros, header y animaciones.
- `assets/images/`: galerías WebP optimizadas de las tres unidades.
- `alta-vendedor.html` y `alta-vendedor.js`: registro público y generación del link personalizado.
- `panel.html` y `panel.js`: autenticación y métricas comerciales privadas.
- `portal.css`: estilos compartidos por alta y panel.
- `supabase-config.js`: URL y clave publicable de Supabase; nunca contiene la service-role key.
- `supabase/functions/public-api/index.ts`: API pública con validación de origen, clave publicable y datos de entrada.
- `supabase/migrations/20260821174000_sales_network.sql`: esquema reproducible, RLS, vistas y permisos.

## Fuentes visuales del entorno

- Estación Jujuy: EnelSubte.
- Estación Humberto I: Subte.ar.
- UBA Psicología: Wikimedia Commons.
- Hospital Ramos Mejía: Buenos Aires Ciudad.

Estas imágenes sólo ilustran puntos cercanos y deben mantener atribución documental. Antes de una campaña paga conviene confirmar la licencia de cada recurso o reemplazarlo por material propio.
- `netlify.toml`: configuración de hosting y headers.
- No hay framework ni dependencias de build. La persistencia y autenticación viven en Supabase.
- CSS y JavaScript usan versionado de URL y revalidación en Netlify para evitar que los dispositivos conserven interfaces antiguas después de un deploy.
