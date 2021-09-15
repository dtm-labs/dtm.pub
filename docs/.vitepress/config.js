module.exports = {
  title: 'DTM教程',
  description: 'GO语言分布式事务管理服务',
  lang: 'zh-CN',
  head: [
    ['link', { rel: 'icon', type: 'image/svg', href: '/dtm.svg' }],
    ['script', { defer: true, type: 'text/javascript', src: 'https://s9.cnzz.com/z_stat.php?id=1280154965&web_id=1280154965' }]
  ],
  themeConfig: {
    logo: '/dtm.svg',

    // algolia: {
    //   apiKey: '<YOUR_CUSTOM_APP_ID>',
    //   indexName: 'dtm',
    //   searchParameters: {
    //     facetFilters: ['tags:cn']
    //   }
    // },

    nav: [
      { text: '指引', link: '/guide/start' },
      { text: 'English', link: 'https://en.dtm.pub' },
      { text: '博客', link: '/blogs/classic-dtrans' },
      // { text: '示例', link: '/examples/' },
      { text: 'Github', link: 'https://github.com/yedf/dtm' },
      { text: '知乎', link: 'https://www.zhihu.com/people/ye-dongfu' }
    ],
    sidebar: {
      '/blogs/': [
        {
          text: '分布式事务最经典的七种解决方案',
          link: '/blogs/classic-dtrans',
        },
        {
          text: '如何选择最适合你的分布式事务方案',
          link: '/blogs/choose-dtrans',
        },
        {
          text: '用Go轻松完成一个SAGA分布式事务',
          link: '/blogs/go-saga',
        },
        {
          text: '用Go轻松完成一个TCC分布式事务',
          link: '/blogs/go-tcc',
        },
      ],
      '/examples/': 'auto',
      // catch-all fallback
      '/': [
        {
          text: '基础',
          children: [
            {
              text: '分布式事务理论',
              link: '/guide/theory'
            },
            {
              text: '安装',
              link: '/guide/install'
            },
            {
              text: 'Why',
              link: '/guide/why'
            },
            {
              text: '开始',
              link: '/guide/start'
            }
          ]
        },
        {
          text: '概况',
          children: [
            {
              text: '架构',
              link: '/summary/arch'
            },
            {
              text: '接口协议',
              link: '/summary/protocol'
            },
            {
              text: '数据库接口',
              link: '/summary/db'
            },
            {
              text: '代码概况',
              link: '/summary/code'
            },
          ]
        },
        {
          text: '实践',
          children: [
            {
              text: 'SAGA',
              link: '/practice/saga'
            },
            {
              text: 'TCC',
              link: '/practice/tcc'
            },
            {
              text: 'XA',
              link: '/practice/xa'
            },
            {
              text: '事务消息',
              link: '/practice/msg'
            },
            {
              text: '其他',
              link: '/practice/other'
            },
            {
              text: '等待事务结果',
              link: '/practice/wait'
            },
            {
              text: '选择合适的模式',
              link: '/practice/choice'
            }
          ]
        },
        {
          text: '异常处理',
          children: [
            {
              text: '异常',
              link: '/exception/exception'
            },
            {
              text: '子事务屏障',
              link: '/exception/barrier'
            }
          ]
        },
        {
          text: '部署运维',
          children: [
            {
              text: '基础',
              link: '/deploy/base'
            },
            {
              text: 'Docker部署',
              link: '/deploy/docker'
            },
            {
              text: '云上服务',
              link: '/deploy/cloud'
            },
            {
              text: '线上部署',
              link: '/deploy/online'
            },
            {
              text: '直接部署',
              link: '/deploy/direct'
            },
            {
              text: '运维',
              link: '/deploy/maintain'
            }
          ]
        },
        {
          text: '其他',
          children: [
            {
              text: '其他框架',
              link: '/other/opensource'
            },
            {
              text: '谁在用',
              link: '/other/using'
            }
          ]
        },
      ]
    }
  },
  markdown: {
    anchor: {
      renderPermalink: require('./render-perma-link')
    },
    config: (md) => {
      md.use(require('./markdown-it-custom-anchor'))
    }
  }
}
