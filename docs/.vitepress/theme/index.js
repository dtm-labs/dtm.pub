import Theme from 'vitepress/theme'
import { h } from 'vue'
import Search from './Search.vue'
import './custom.css'

export default {
  ...Theme,
  Layout() {
    return h(Theme.Layout, null, {
      'navbar-search': () => h(Search),
      'page-bottom': () =>
        h('div', { class: 'footer' }, [
          h(
            'a',
            {
              href: 'https://beian.miit.gov.cn/',
              target: '_blank',
              rel: 'noopener'
            },
            [h('span', '京ICP备2021024322号-1')]
          ),
        ]),
      'home-footer': () =>
        h('div', { class: 'footer' }, [
          h(
            'a',
            {
              href: 'https://beian.miit.gov.cn/',
              target: '_blank',
              rel: 'noopener'
            },
            [h('span', '京ICP备2021024322号-1')]
          ),
        ])
    })
  }
}
