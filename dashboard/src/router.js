import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import ATPList from './pages/ATPList.vue'
import ATPNew from './pages/ATPNew.vue'
import ATPDetail from './pages/ATPDetail.vue'
import IPList from './pages/IPList.vue'
import IPNew from './pages/IPNew.vue'
import IPDetail from './pages/IPDetail.vue'
import OLList from './pages/OLList.vue'
import OLNew from './pages/OLNew.vue'
import OLDetail from './pages/OLDetail.vue'
import MuestraList from './pages/MuestraList.vue'
import MuestraNew from './pages/MuestraNew.vue'
import MuestraDetail from './pages/MuestraDetail.vue'
import ParoList from './pages/ParoList.vue'
import ParoNew from './pages/ParoNew.vue'
import ParoDetail from './pages/ParoDetail.vue'

const routes = [
  { path: '/', name: 'home', component: Home },

  { path: '/atp', name: 'atp-list', component: ATPList },
  { path: '/atp/new', name: 'atp-new', component: ATPNew },
  {
    path: '/atp/:name',
    name: 'atp-detail',
    component: ATPDetail,
    props: true,
  },

  { path: '/personal', name: 'ip-list', component: IPList },
  { path: '/personal/new', name: 'ip-new', component: IPNew },
  {
    path: '/personal/:name',
    name: 'ip-detail',
    component: IPDetail,
    props: true,
  },

  { path: '/limpieza', name: 'ol-list', component: OLList },
  { path: '/limpieza/new', name: 'ol-new', component: OLNew },
  {
    path: '/limpieza/:name',
    name: 'ol-detail',
    component: OLDetail,
    props: true,
  },

  { path: '/muestras', name: 'muestra-list', component: MuestraList },
  { path: '/muestras/new', name: 'muestra-new', component: MuestraNew },
  {
    path: '/muestras/:name',
    name: 'muestra-detail',
    component: MuestraDetail,
    props: true,
  },

  { path: '/paros', name: 'paro-list', component: ParoList },
  { path: '/paros/new', name: 'paro-new', component: ParoNew },
  {
    path: '/paros/:name',
    name: 'paro-detail',
    component: ParoDetail,
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory('/qc-dashboard/'),
  routes,
})

export default router
