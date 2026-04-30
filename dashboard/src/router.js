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
]

const router = createRouter({
  history: createWebHistory('/qc-dashboard/'),
  routes,
})

export default router
