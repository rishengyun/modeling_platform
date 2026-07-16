/**
 * 防御：非 qiankun 环境下，部分依赖（如 Element Plus）内部可能读取
 * window.__POWERED_BY_QIANKUN__.isPoweredByQiankun 导致整个 Vue 初始化崩溃。
 * iframe 嵌入时不存在该全局变量，预先注入防止抛 TypeError。
 */
;(window as any).__POWERED_BY_QIANKUN__ ??= { isPoweredByQiankun: false }

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import '@/assets/css/global.css'
import 'virtual:svg-icons-register'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import md5 from 'js-md5'

const app = createApp(App)
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.use(createPinia())
app.mount('#app')

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}