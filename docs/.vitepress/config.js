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

    algolia: {
      apiKey: '0b8d24ec9f74b05becaf479a6ea20b2f',
      indexName: 'test',
      appId: 'KAS0X8OWDL',
    },
    lastUpdated: 'Last Updated',

    nav: [
      { text: '教程', link: '/guide/start' },
      { text: 'English', link: 'https://en.dtm.pub' },
      { text: '博客与分享', link: '/resource/blogs-theory' },
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
      '/': [
        {
          text: '基础',
          children: [
            {
              text: 'Why',
              link: '/guide/why'
            },
            {
              text: '安装运行',
              link: '/guide/install'
            },
            {
              text: '快速开始',
              link: '/guide/start'
            },
          ]
        },
        {
          text: '原理与实践',
          children: [
            {
              text: '分布式事务理论',
              link: '/practice/theory'
            },
            {
              text: 'DTM架构',
              link: '/practice/arch'
            },
            {
              text: 'SAGA',
              link: '/practice/saga'
            },
            {
              text: '二阶消息',
              link: '/practice/msg'
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
              text: '其他',
              link: '/practice/other'
            },
            {
              text: '异常与子事务屏障',
              link: '/practice/barrier'
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
          text: '接入参考',
          children: [
            {
              text: 'SDK',
              link: '/ref/sdk'
            },
            {
              text: '事务选项',
              link: '/ref/options'
            },
            {
              text: '存储引擎',
              link: '/ref/store'
            },
            {
              text: '支持的协议',
              link: '/ref/proto'
            },
            {
              text: 'go-zero对接',
              link: '/ref/gozero'
            },
            {
              text: 'HTTP 参考',
              link: '/ref/http'
            },
            {
              text: '项目概况',
              link: '/ref/projects'
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
              text: '部署',
              link: '/deploy/deploy'
            },
            // {
            //   text: '云上服务',
            //   link: '/deploy/cloud'
            // },
            {
              text: '运维',
              link: '/deploy/maintain'
            },
            {
              text: '升级指南',
              link: '/deploy/upgrade'
            },
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
              text: '对比其他框架',
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
