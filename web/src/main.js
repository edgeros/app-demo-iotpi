import Vue from 'vue'
import App from './App.vue'
import router from './router'
import { Cell, List, NavBar, Notify, CellGroup, Image, Icon, Switch, PullRefresh} from 'vant';
import {edger} from '@edgeros/web-sdk';
import SocketIO from 'socket.io-client';
import VueSocketIOExt from 'vue-socket.io-extended';
import { setToken, setSrand, getHeaders } from './service/auth';
import { setActive } from './service/state';
import 'vant/lib/index.css';

Vue.config.productionTip = false

Vue.use(Cell);
Vue.use(List);
Vue.use(NavBar);
Vue.use(Notify);
Vue.use(CellGroup);
Vue.use(Image);
Vue.use(Icon);
Vue.use(Switch);
Vue.use(PullRefresh);

edger.onAction('active', () => {
  setActive(true);
});
edger.onAction('deactive', () => {
  setActive(false);
});

edger.onAction('token', (result) => {
  const { token, srand } = result;
  setToken(token);
  setSrand(srand);
});

edger.token()
  .then((result) => {
    const { token, srand } = result;
    setToken(token);
    setSrand(srand);
    const socket = SocketIO({
      path: '/iotpi',
      query: getHeaders(),
      transports: ['websocket']
    });
    Vue.use(VueSocketIOExt, socket);
  })
  .catch((error) => {
    console.error(error);
  })
  .finally(() => {
    new Vue({
      router,
      render: h => h(App)
    }).$mount('#app')
  });