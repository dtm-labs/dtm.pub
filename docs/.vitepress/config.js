module.exports = {
  title: 'DTM开源项目文档',
  description: 'GO语言分布式事务管理服务',
  lang: 'zh-CN',
  head: [
    ['link', { rel: 'icon', type: 'image/svg', href: '/dtm.svg' }],
    ['script', {},
      `
      var _hmt = _hmt || [];
      (function() {
        var hm = document.createElement("script");
        hm.src = "https://hm.baidu.com/hm.js?4db922909fbd8227d82299ecd9ba3615";
        var s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(hm, s);
      })();
     `
    ]
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
      { text: '知乎', link: 'https://www.zhihu.com/people/ye-dongfu' },
      { text: '文档源码', link: 'https://github.com/dtm-labs/dtm.pub' },
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
            {
              text: '二阶段消息例子',
              link: '/guide/e-msg'
            },
            {
              text: 'SAGA 例子',
              link: '/guide/e-saga'
            },
            {
              text: 'TCC 例子',
              link: '/guide/e-tcc'
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
              text: '二阶段消息',
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
              text: 'Workflow',
              link: '/practice/workflow'
            },
            {
              text: '其他事务模式',
              link: '/practice/other'
            },
            {
              text: 'AT vs XA',
              link: '/practice/at'
            },
            {
              text: '异常与子事务屏障',
              link: '/practice/barrier'
            },
            {
              text: '最终成功',
              link: '/practice/must-succeed'
            },
            {
              text: '选择合适的模式',
              link: '/practice/choice'
            }
          ]
        },
        {
          text: '典型应用',
          children: [
            {
              text: '概述',
              link: '/app/intro'
            },
            {
              text: '订单系统',
              link: '/app/order'
            },
            {
              text: '秒杀',
              link: '/app/flash'
            },
            {
              text: '缓存一致性',
              link: '/app/cache'
            },
          ],
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
              text: '通信协议',
              link: '/ref/proto'
            },
            {
              text: '更多功能特性',
              link: '/ref/feature'
            },
            {
              text: 'go-zero对接',
              link: '/ref/gozero'
            },
            {
              text: 'kratos对接',
              link: '/ref/kratos'
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
              text: '管理后台',
              link: '/deploy/admin'
            },
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
            // {
            //   text: '对比其他框架',
            //   link: '/other/opensource'
            // },
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
