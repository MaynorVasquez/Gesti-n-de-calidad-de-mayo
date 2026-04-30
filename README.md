### may_quality_management

App de Frappe/ERPNext para gestión de calidad en planta de producción:
control de producto, inspección BPM al personal, lavado de manos ATP, orden y
limpieza por área, plantillas, parámetros y reportes de tendencia.

Incluye un **SPA Vue 3** (carpeta `dashboard/`) que vive en `/qc-dashboard` y
expone los flujos operativos con UX moderna (cards, firmas digitales, filtros
y paginación).

### Installation

You can install this app using the [bench](https://github.com/frappe/bench) CLI:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app $URL_OF_THIS_REPO --branch develop
bench install-app may_quality_management
```

### SPA — `/qc-dashboard`

El dashboard Vue está en [`dashboard/`](./dashboard) (Vite + Vue 3 + frappe-ui
+ Tailwind). Se compila a `may_quality_management/public/dashboard/` y el
plugin de Vite copia el `index.html` resultante a
`may_quality_management/www/qc_dashboard.html`, que es lo que sirve Frappe.

#### Build de producción

Desde la raíz del bench:

```bash
cd apps/may_quality_management/dashboard
yarn install                                    # solo la primera vez
yarn build

cd $PATH_TO_YOUR_BENCH                          # ej. /home/frappe/yaesta
bench build --app may_quality_management
bench --site SITE_NAME clear-website-cache      # ej. bench --site frontend clear-website-cache
```

`yarn build` emite los assets a
`may_quality_management/public/dashboard/`. `bench build` enlaza
`public/` al sitio bajo `/assets/may_quality_management/dashboard/` y
`clear-website-cache` invalida el `qc_dashboard.html` cacheado por Frappe.

Acceso en el navegador: `https://SITE/qc-dashboard` (con sesión iniciada en
Frappe).

#### Modo desarrollo con hot-reload

Dos terminales:

```bash
# 1) bench corriendo
bench start

# 2) Vite dev server (HMR)
cd apps/may_quality_management/dashboard
yarn dev
```

El dev server abre en `http://localhost:8080/qc-dashboard/` y proxiea las
llamadas de `/api`, `/assets`, `/login`, etc. al bench (puerto definido en
[`dashboard/vite.config.js`](./dashboard/vite.config.js), por defecto
`http://localhost:8004`).

#### Permisos

Para que el icono aparezca en `/apps`, el usuario tiene que tener el rol
**Quality Inspector** o **System Manager**. Crear el rol una sola vez:

```bash
bench --site SITE_NAME execute frappe.client.insert --kwargs \
  "{'doc':{'doctype':'Role','role_name':'Quality Inspector','desk_access':1}}"
```

Después asignarlo al usuario desde `/app/user`.

#### Scripts disponibles (en `dashboard/`)

- `yarn dev` — dev server con HMR.
- `yarn build` — build de producción + copia a `www/`.
- `yarn preview` — sirve el build localmente para validar.

### Contributing

This app uses `pre-commit` for code formatting and linting. Please [install pre-commit](https://pre-commit.com/#installation) and enable it for this repository:

```bash
cd apps/may_quality_management
pre-commit install
```

Pre-commit is configured to use the following tools for checking and formatting your code:

- ruff
- eslint
- prettier
- pyupgrade

### License

gpl-3.0
