import Vue from 'vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import App from './App.vue';
import store from './store';
import moment from 'moment';

Vue.config.productionTip = false;
moment.locale(chrome.i18n.getUILanguage());

Vue.prototype.$tr = (name) => chrome.i18n.getMessage(name);
Vue.prototype.$moment = moment;

Vue.use(ElementUI, {
    size: "mini"
});

new Vue({
    store,
    render: h => h(App)
}).$mount('#app');
