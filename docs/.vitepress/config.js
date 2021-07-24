module.exports = {
  title: 'DTM教程',
  description: 'GO语言分布式事务管理服务',
  lang: 'zh-CN',
  head: [['link', { rel: 'icon', type: 'image/jpeg', href: './imgs/dtm.jpeg' }]],
  themeConfig: {
    logo: './imgs/dtm.jpeg',
    sidebar: {
      '/config/': 'auto',
      '/plugins': 'auto',
      // catch-all fallback
      '/': [
        {
          text: '基础',
          children: [
            {
              text: '安装',
              link: './guide/install'
            },
            {
              text: '开始',
              link: './guide/start'
            },
            {
              text: '架构',
              link: './guide/start'
            }
          ]
        },
        {
          text: '事务模式',
          children: [
            {
              text: 'TCC',
              link: './trans/tcc'
            },
            {
              text: 'SAGA',
              link: './trans/saga'
            },
            {
              text: 'XA',
              link: './trans/xa'
            },
            {
              text: '事务消息',
              link: './trans/msg'
            },
            {
              text: '其他',
              link: './trans/other'
            }
          ]
        },
        {
          text: '异常处理',
          children: [
            {
              text: '异常',
              link: './exception/exception'
            },
            {
              text: '子事务屏障',
              link: './exception/barrier'
            }
          ]
        },
        {
          text: '其他',
          children: [
            {
              text: '其他框架',
              link: './other/dtrans'
            },
            {
              text: '子事务屏障',
              link: './exception/barrier'
            }
          ]
        },
      ]
    }
  }
}
