# Proyecto Desarrollo-web: Casino nova

## Descripción

En este proyecto se creó una página de casino ficticia con créditos y apuestas falsas, este proyecto no tiene uso práctico real ya que está enfocado principalmente en la práctica de creación de páginas web.

## Tecnologías utilizadas

Para este proyecto se usaron las tecnologías de:

- HTML5
- CSS3
- JavaScript
- Git
- GitHub
- AWS EC2
- Nginx

## Funcionalidades

La página del casino cuenta con varias funcionalidades como:

- Barra de navegación.
- Página de inicio.
- Presentación de los juegos disponibles.
- Sección informativa sobre cada juego.
- Perfil de usuario.
- Visualización de saldo y estadísticas.
- Formulario de creación de cuenta.
- Formulario de inicio de sesión.
- Botones y enlaces de navegación dentro de la página.
- Sistema de saldo compartido entre los juegos.
- Almacenamiento temporal de los datos del usuario.
- Registro de estadísticas de las partidas.

Además de esto los juegos con los que cuenta son:

- Ruleta (implementada).
- Dados (pendiente).
- Blackjack (implementado).
- Tragamonedas (pendiente).

## Estructura del proyecto

El proyecto cuenta con una estructura simple siendo esta:

- `index.html` → estructura y contenido de la página principal.
- `styles.css` → estilos y diseño visual.
- `README.md` → documentación del proyecto.
- Archivos HTML separados para inicio de sesión, crear cuenta, perfil y juegos.
- `Saldo.js` → manejo del saldo y estadísticas del usuario.
- Carpetas de Blackjack y Ruleta → contienen sus respectivos archivos HTML, CSS y JavaScript.

## Diseño

El diseño de la página utiliza:

- Fondo de color morado oscuro.
- Títulos y bordes de color dorado.
- Botones con fondo negro.
- Bordes redondeados.
- Distribución centrada de los elementos para que se vea más ordenado.
- Efectos visuales cuando pasa el cursor sobre los botones.

El objetivo del diseño es parecerse lo más posible a un casino de verdad.

## Instalación y ejecución

Para visualizar el proyecto solo descarga los archivos HTML, CSS y JavaScript y abre el `index.html` directamente en el ordenador, manteniendo los archivos y carpetas en sus respectivas ubicaciones para que todo funcione correctamente.

## Despliegue

El proyecto fue desplegado en una instancia de AWS EC2 utilizando:

- Ubuntu.
- Nginx.
- GitHub.
- Una dirección IP pública para acceder al sitio.

Nginx se utiliza como servidor web para mostrar los archivos HTML, CSS y JavaScript del proyecto.

## autores

Benja Muñoz. Jose Pablo. Vicente Gallardo.

## Consideraciones

En las últimas actualizaciones se agregaron 2 juegos (Blackjack y Ruleta) en los cuales se puede apostar el saldo disponible del usuario, además las estadísticas del usuario y su saldo son funcionales aunque solo por la sesión.

## Avances de la segunda entrega

En esta segunda entrega se realizaron varios cambios con respecto a la primera versión del proyecto.

Principalmente se separaron las diferentes secciones de la página en archivos HTML independientes, como el inicio de sesión, crear cuenta, perfil y los juegos, ya que anteriormente todo se encontraba dentro de una misma página.

También se implementó JavaScript, lo que permitió agregar funcionalidades que antes no estaban disponibles, como el funcionamiento de Blackjack y Ruleta, el sistema de apuestas y la actualización del saldo.

Se agregó el uso de `sessionStorage` para guardar temporalmente información como el usuario, el saldo y las estadísticas de las partidas. Además, ambos juegos utilizan el mismo saldo, por lo que las ganancias y pérdidas se reflejan en los dos.

Por el momento, el inicio de sesión y la creación de cuentas funcionan de manera simulada, ya que todavía no contamos con una base de datos para guardar la información permanentemente.

Finalmente, los juegos de Dados y Tragamonedas aún no están implementados, por lo que quedan pendientes para la siguiente y ultima entrega.
