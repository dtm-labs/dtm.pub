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
      { text: '博客与分享', link: '/resource/blogs-theory' },
      // { text: '示例', link: '/examples/' },
      { text: 'Github', link: 'https://github.com/dtm-labs/dtm' },
      { text: '知乎', link: 'https://www.zhihu.com/people/ye-dongfu' }
    ],
    sidebar: {
      '/resource/': [
        {
          text: '分享视频',
          link: '/resource/videos',
        },
        {
          text: '博客 理论部分',
          link: '/resource/blogs-theory',
        },
        {
          text: '博客 深入系列',
          link: '/resource/blogs-deep',
        },
        {
          text: '博客Go',
          link: '/resource/blogs-go',
        },
        {
          text: '博客Python',
          link: '/resource/blogs-py',
        },
        {
          text: '博客Java',
          link: '/resource/blogs-java',
        },
        {
          text: '博客Donet',
          link: '/resource/blogs-donet',
        },
        {
          text: '博客PHP',
          link: '/resource/blogs-php',
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
              text: 'Why',
              link: '/guide/why'
            },
            {
              text: '开始',
              link: '/guide/start'
            },
            {
              text: '架构',
              link: '/summary/arch'
            },
          ]
        },
        {
          text: '事务原理',
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
              text: '异常与子事务屏障',
              link: '/exception/barrier'
            },
            {
              text: '不允许失败',
              link: '/practice/must-succeed'
            },
            {
              text: '选择合适的模式',
              link: '/practice/choice'
            }
          ]
        },
        {
          text: '接入指南',
          children: [
            {
              text: '接口协议',
              link: '/summary/protocol'
            },
            {
              text: '数据库接口',
              link: '/summary/db'
            },
            {
              text: 'DTM源码概况',
              link: '/summary/files'
            },
            {
              text: 'SDK',
              link: '/summary/code'
            },
            {
              text: '事务选项',
              link: '/ref/options'
            },
            {
              text: 'API参考 HTTP',
              link: '/ref/http'
            },
            {
              text: '接入示例',
              link: '/ref/sample'
            },
          ]
        },
        {
          text: '支持的协议',
          children: [
            {
              text: '概述',
              link: '/protocol/intro'
            },
            {
              text: 'HTTP',
              link: '/protocol/http'
            },
            {
              text: 'gRPC',
              link: '/protocol/grpc'
            },
            {
              text: 'go-zero',
              link: '/protocol/gozero'
            },
            {
              text: '微服务对接',
              link: '/protocol/support'
            },
          ]
        },

        {
          text: '特性',
          children: [
            {
              text: 'TCC子事务嵌套',
              link: '/character/tcc-nested'
            },
            {
              text: '支持的事务与存储',
              link: '/character/supported-db'
            },
            {
              text: '高可用',
              link: '/character/highly-available'
            },
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
            // {
            //   text: '云上服务',
            //   link: '/deploy/cloud'
            // },
            {
              text: 'Kubernetes部署',
              link: '/deploy/kubernetes'
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
              text: 'DTM开发测试指南',
              link: '/other/develop'
            },
            {
              text: 'Mysql存储性能测试',
              link: '/other/performance'
            },
            {
              text: 'Redis存储性能测试',
              link: '/other/perform-redis'
            },
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
