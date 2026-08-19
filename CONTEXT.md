# Contexto del proyecto — Calvo 2500

## Objetivo

Landing page comercial 100% front-end para un desarrollo inmobiliario a estrenar en Carlos Calvo 2500, San Cristóbal, CABA. Debe ser rápida, clara, didáctica y especialmente cuidada en mobile y tablet. El destino de hosting previsto es Netlify.

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
- No se necesita backend en esta etapa. Para captar leads más adelante se puede usar Netlify Forms o un enlace de WhatsApp.

## Estado actual

- Sitio estático funcional, sin build step.
- Responsive para desktop, iPad y mobile.
- Navegación móvil, filtros de tipología, animaciones progresivas y FAQ accesible.
- SEO básico, metadatos y contenido semántico incluidos.
- Listo para desplegar arrastrando la carpeta a Netlify o conectando el repo.

## Pendientes imprescindibles antes de publicar

1. Confirmar nombre oficial del emprendimiento.
2. Confirmar teléfono/WhatsApp, nombre del asesor y oficina comercial.
3. Descargar y autorizar las fotos originales del desarrollo. RE/MAX bloqueó la extracción automatizada de la galería, por lo que la versión inicial usa una dirección visual abstracta propia.
4. Reemplazar las ilustraciones CSS por fotos locales optimizadas en WebP/AVIF, manteniendo texto alternativo.
5. Confirmar superficies, orientación, piso, precio, entrega, amenities y terminaciones de cada tipología.
6. Confirmar si se desea formulario Netlify o únicamente WhatsApp.
7. Agregar dominio, favicon, OG image, Analytics/Meta Pixel sólo si el cliente los solicita.

## Reglas de contenido

- No afirmar precios, fechas, financiación o disponibilidad sin confirmación comercial.
- No presentar renders ambientados como fotografías contractuales.
- Mantener contacto y CTA visibles sin saturar la navegación.
- Priorizar velocidad: imágenes locales menores a 250–350 KB, lazy loading debajo del hero y cero librerías innecesarias.

## Estructura técnica

- `index.html`: contenido y estructura.
- `styles.css`: sistema visual y responsive.
- `script.js`: menú, filtros, header y animaciones.
- `netlify.toml`: configuración de hosting y headers.
- No hay base de datos, framework ni dependencias.

