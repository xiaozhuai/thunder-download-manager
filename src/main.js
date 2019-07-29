import Vue from 'vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import App from './App.vue';
import store from './store';
import i18n from './i18n';
import moment from 'moment';

Vue.config.productionTip = false;
const locale = window.navigator.languages[0];
i18n.setLocale(locale);
moment.locale(locale);

Vue.prototype.$tr = (name) => i18n.tr(name);
Vue.prototype.$moment = moment;

Vue.use(ElementUI, {
    size: "mini"
});

new Vue({
    store,
    render: h => h(App)
}).$mount('#app');
