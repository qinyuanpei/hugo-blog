---
categories:
- 前端开发
copyright: true
date: 2022-07-12 22:49:47
description: ''
slug: Implementation-Of-Vue-Router-Extension-That-Supports-External-Link
tags:
- 前端
- Vue
- 路由
- 思考
title: 支持外部链接跳转的 Vue Router 扩展实现
toc: true
image: //cdn.jsdelivr.net/gh/qinyuanpei/blog.yuanpei.me@master/posts/支持外部链接跳转的-Vue-Router-扩展实现/cover.jpeg
---

众所周知，[Vue Router](https://v3.router.vuejs.org/zh/installation.html) 是 [Vue](https://cn.vuejs.org/) 中重要的插件之一，特别是在当下流行的 [单页面应用/SPA](https://docs.microsoft.com/zh-cn/aspnet/single-page-application/overview/) 中，这种感觉会越来越明显。此时，路由的作用就是根据 `URL` 来决定要显示什么内容。诚然，页面这个概念在工程/模块中依然存在，可当你开始关注最终发布的产物时，你会发现本质上它只有一个页面。无论你选择 `hash` 或者是 `history` 模式的路由，它都像是在同一张纸上反复写写画画，让你看起来觉得它有很多个不同的页面。回顾早期的前端项目，它往往会有多个不同的页面组成，我们是通过一个个的超链接来实现不同页面间的跳转。如今，这一切都已一去不复返，我们只能在单页面应用的世界里继续披荆斩棘。当然，绝大多数的普通用户无法感知到这种程度的变化，在他们的眼中，那依然不过是普通的一个超链接。那么，当一个项目中充斥着各种各样的超链接的时候，这个问题就值得我们单独拿出来讲一讲。所以，今天这篇博客的主题是路由和外部链接。请注意，这是一组相对通用的概念，不受限于任何一个前端框架，我们只是选择了使用 `Vue` 来进行说明。

# 问题现状

我们的项目存在着大量的超链接以及导航菜单，在 UI 设计阶段，通常不会有人关心，一个链接到底是内部链接还是外部链接。与此同时，由于 `HTML` 这门标记语言的极大灵活性，实现一个导航链接的方式有 N 多种，可以是一个 `a` 标签，可以是一个 `div` 标签，甚至可以是一个 `span` 标签。虽然 [Vue Router](https://v3.router.vuejs.org/zh/installation.html) 里提供了 `router-link` 组件，可在实际的项目中，需要综合考虑团队风格和第三方 UI 库的因素，甚至有时候，再没有设计规范的情况下，可能大家连 `router-link` 组件都不愿意用或者说压根就没机会用。

这样就造成一个非常尴尬的局面，当你需要为页面编写业务代码的时候，你不得不在各种各样的超链接上浪费时间，只要不是通过 `a` 标签实现的，你都必须处理它点击的事件，更不必说，你还要区分这个链接是一个内部链接还是一个外部链接，原因是 [Vue Router](https://v3.router.vuejs.org/zh/installation.html) 不支持外部链接，你不得不通过 `window.location` 或者 `window.open()` 的这样的方式来实现“曲线救国”，试想，如果每一个都这么折腾一遍，你还会觉得有趣吗？

而在我们的项目里，实际上它还需要从网页端唤起应用，这样便又涉及到了 [URL Schemes](https://sspai.com/post/31500) 这个话题。除了 `Android` 和 `iOS` 这个平台上的差异，单单就 `Windows` 而言，其基于注册表的方案对协议提供者的约束并不强，如果团队内对此没有任何规范的话，你将面对各种千奇百怪的参数传递方式。听到这里，你是不是感觉头都大了一圈？如果因为某种原因，它还需要你每次都传递一个令牌过去，你告诉我，你准备如何让这一切的混乱与不堪重新归于宁静呢？

![学如逆水行舟，不进则退](/posts/支持外部链接跳转的-Vue-Router-扩展实现/standup-paddleboarding-g737c60ff8_1280.jpg)


# 改进思路

OK，现在假设，我们制止这场混乱的方式，是强迫大家都去使用 `router-link` 这个组件，虽然它最终渲染出来就是一个 `a` 标签。相信参加工作以后，大家都会有这样一种感觉，那就是工作中 99.9% 的事情，都是在最好和最坏中间选一个过渡状态，然后不断地为之投入精力或者叫做填坑，甚至有很多东西，从来都不是为了让一件事情变得更好而存在。作为这个地球上脆弱而渺小的个体，时间、生命、爱，每一样东西都像缓缓从指尖滑落的沙子，我们实在是太喜欢这种可以掌控点什么的感觉了。所以，如果一件事情没法从道理或者科学上讲通的话，那就用制度或者规范来作为武器，在一个连国家都可以宣布破产的年代，大概，话语权比是非对错更重要。因此，在博主的博客里，在这小小的一方天地里，不妨假设我有这种话语权，可以强迫大家都使用 `router-link` 这个组件。我们讲，`Vue Router` 不支持外部链接，一个非常直观的理由是，当我们写出下面的代码时，它会完全辜负我们的期望：

```vue
<router-link to="https://blog.yuanpei.me">Go</router-link>
```

显然，我们期望它可以跳转到 [https://blog.yuanpei.me](https://blog.yuanpei.me) 这个地址，可你只要亲自试一下，就会知道这是你的一厢情愿。因为，此时浏览器地址栏中的地址会显示为：

```bash
http://localhost:8080/#/https://https://blog.yuanpei.me
```

当然，我们的用户不会操心这种事情，正如他们从来不会去刻意地分辨，这是一个内部链接还是一个外部链接。这里讲一下博主的思路，博主打算在 `router-link` 的基础上再做一层封装，内部链接通常是以`/` 来开头的，基于这个特点，我们可以区分出这是一个内部链接还是一个外部链接。针对内部链接，我们继续使用 `router-link` 组件；针对外部链接，我们直接使用 `a` 标签即可。此时，对应的 `Vue` 模板定义如下：

```vue
<template>
  <a v-if="isExternal" :href="formatedUrl" :target="target">
    <slot></slot>
  </a>
  <router-link v-else v-bind="originProps">
    <slot></slot>
  </router-link>
</template>
```
在这里，我们对外暴露了 `to` 和 `target` 两个属性，前者允许我们传入一个字符串或者对象，后者可以控制这个链接的打开方式，是在当前窗口还是一个新窗口中打开：

```javascript
export default {
  name: "MyRouterLink",
  props: {
    to: {
      type: [Object, String],
      default: () => { 
        path: '/'
      },
      required: true,
    },
    target: {
      type: String,
      default: () => '',
    },
  },
  // ...
}
```
还记得我们是怎么区分内部链接和外部链接的吗？只需要判断传入的 `URL` 是否以 `/` 开头。在这里，我们需要对 `to` 的类型进行判断：

```javascript
computed: {
    isExternal() {
      if (typeof(this.to) === 'object') {
        return this.to.path && this.to.path[0] !== '/'
      }

      if (typeof(this.to) === 'string') {
        return this.to && this.to[0] !== '/'
      }
      
      return false
    },
}
```

当然，在某些情况下，这个 `URL` 允许使用者传入查询参数(QueryString)。这里，我们用 `formatedUrl` 这个计算属性来统一进行处理：
 
```javascript
computed: {
    formatedUrl() {
      let url = "";
      if (typeof(this.to) === 'object') {
        url = this.to.path
      } else if (typeof(this.to) === 'string') {
        url = this.to
      }

      let queryArray = [];
      if (this.to.query) {
        for (let key in this.to.query) {
          const value = encodeURIComponent(this.to.query[key]);
          queryArray.push(`${key}=${value}`);
        }
      }

      if (queryArray.length == 0) {
        return url;
      }

      if (url.indexOf("?") != -1) {
        url = `${url}${queryArray.join("&")}`;
      } else {
        url = `${url}?${queryArray.join("&")}`;
      }

      return url;
    },
}
```

最后，需要特别说明的是 `originProps` 这个计算属性，虽然我们封装了 `router-link` 这个组件，但我们希望这个新组件是兼容  `router-link` 本身自带的属性的。此时，我们可以采用下面的方式来处理，具体可以参考官方文档：[vm.$attrs](https://cn.vuejs.org/v2/api/#vm-attrs)：

```javascript
computed: {
    originProps() {
      return { ...this.$props, ...this.$attrs };
    },
}
```

现在，万事具备，我们来试用一下这个新的组件，看看效果如何：

```vue
<header>
    <my-router-link to="/home">首页</my-router-link>
    <my-router-link to="/message">消息</my-router-link>
    <my-router-link to="https://blog.yuanpei.me" target="_blank">博客</my-router-link>
    <my-router-link
       :to="{ path: 'https://www.baidu.com/s', query: { wd: '天气' } }"
       target="_blank"
    >
       百度
    </my-router-link>
    <my-router-link
       :to="{
          path: 'tencent://',
          query: { uin: '875974254', site: 'Vue', menu: 'yes' },
        }"
    >
       QQ
    </my-router-link>
</header>
```

我们可以注意到，现在它可以同时支持内部链接和外部链接，并且我们可以传递一个对象来更好地控制 `URL` 的细节，当然，它还可以从桌面唤起 `QQ` 应用，只要协议提供方采用类似的传参方式，那么，这个方案其实可以做到一劳永逸的。完整的代码我已上传到 [Github](https://github.com/Regularly-Archive/2022/tree/main/src/front-mock)，方便大家可以做进一步的探索。

![从网页端唤起应用](/posts/支持外部链接跳转的-Vue-Router-扩展实现/从网页端唤起应用.png)

# 话题延伸

坦白讲，在我写这篇文章的时候，我一直在思考一个问题，即：如何给所有出站的超链接携带令牌信息？这个想法其实是在解决别人产生的问题，譬如，从子系统 `A` 跳转到子系统 `B` 的过程中，为了实现所谓的“免登录”，大佬们提议直接把令牌信息附加到 `URL`上传递过去，先不说令牌信息刷新和过期的问题，就单单是令牌信息附加到 `URL`上这一项，看起来都是非常愚蠢的做法，众所周知，浏览器对针对 `GET` 请求时的 `URL` 长度存在限制，你这不是直愣愣地往人家枪口上撞吗？放着 [CAS](https://www.apereo.org/projects/cas)、[Keycloak](https://www.keycloak.org/) 这种成熟的方案不用，非要用这种掩耳盗铃式的半桶水方案？也许，人类还真就喜欢做这样的事情，毕竟这样可以制造出问题和麻烦，让别人有事可做。听我说，谢谢你，因为有你...吐槽归吐槽，一开始我是写了一个自定义指令来做这个事情：

```javascript
Vue.directive('attach-query-string',function (el, binding) {
  if (el.tagName === 'A') {
    const token = resolveToken()
    const userId = resolveUserId()
    const posting = resolvePostings()[0] || ''
    if (el.href.indexOf('?') != -1){
      el.href = `${el.href}&token=${token}&userId=${userId}&deviceType=${DeviceType.RCT}&posting=${posting}`
    } else {
      el.href = `${el.href}?token=${token}&userId=${userId}&deviceType=${DeviceType.RCT}&posting=${posting}`
    }
  }
})
```
注意到，这个指令只对 `a` 标签有效，所以，那些花里胡哨、奇形怪状的超链接依然是个令人头疼的问题，我们先忽略它们就好：

```vue
<a 
    :href="item.link" 
    :target="item.openNewTab ? '_blank' : '_self'" 
    v-attach-query-string
>
    {{ item.name }}
</a>
```
这个指令表示，它将会在 `mounted` 和 `updated` 的时候触发相应的逻辑，对于大多数的超链接而言，其 `src` 只会初始化一次，所以，这个方案基本上可行的，唯一的难点在于，并不是所有人都会如你期望的那样使用 `a` 标签。当然，我内心深处永远相信 `jQuery` 一把梭，所以，通常尝试过 `querySelectorAll()` ，但我始终觉得这样子显得有点丑陋，说好的不再操作 `DOM` 了呢？如果按照我们现在的思路，其实可以在组件内部统一处理，下面是一个简单的实现：

```javascript
  computed: {
    formatedUrl() {
      let url = "";
      if (typeof(this.to) === 'object') {
        url = this.to.path
      } else if (typeof(this.to) === 'string') {
        url = this.to
      }

      let queryArray = [];

      // 统一追加参数
      const token = resolveToken()
      const userId = resolveUserId()
      const posting = resolvePostings()[0] || ''
      queryArray.push(`token=${token}`)
      queryArray.push(`userId=${userId}`)
      queryArray.push(`posting=${posting}`)
      
      // 处理组件传入的参数
      if (this.to.query) {
        for (let key in this.to.query) {
          const value = encodeURIComponent(this.to.query[key]);
          queryArray.push(`${key}=${value}`);
        }
      }

      if (queryArray.length == 0) {
        return url;
      }

      if (url.indexOf("?") != -1) {
        url = `${url}${queryArray.join("&")}`;
      } else {
        url = `${url}?${queryArray.join("&")}`;
      }

      return url;
    },
  },
```

从本质上讲，这两种方案做得事情是完全相同的，无非是拥有了新知识或者技能以后，再去重新审视过去的种种选择，人虽然始终没有办法打破自身的历史局限性，可是能从新知识或者技能中不断丰富自我的认知，这又属实是种颇具幸福感的事情，因为，从这一刻起，你已经告别了昨天的自己，真正做到了“且将新火试新茶”。回过头来再次审视这个问题的时候，你会觉得哪一种更好呢？欢迎大家在评论区留下你的答案。

# 本文小结

本文介绍了一种针对 [Vue Router](https://v3.router.vuejs.org/zh/installation.html) 进行扩展的思路，主要是为了解决 `router-link` 不支持外部链接跳转的问题。关注这个问题的契机，则是来源于项目中大量存在着的超链接和导航菜单。其中，除了指向站内的内部链接，还有指向站外的外部链接，而这些外部链接中，又牵扯到从网页端唤醒应用的问题，所以，我们需要一种相对统一的机制来处理这些内部细节，因此，就有了今天的这篇博客。除此以外，因为一部分人的愚蠢决定，我们必须要在所有出站的 `URL` 上附加令牌信息，针对这个问题，博主先是尝试了自定义指令的做法，然后又在现在的方案上做了一点处理，这使得我们能把精力放在真正重要的地方。从整体上而言，如果在设计 UI 前，就定好这样一种规范，所有人都使用这个统一的组件，这个问题处理起来会稍微简单一点，可惜，从人类让一群人一起编程的那一刻起，这种人与人间的磨合和牵制就会一直存在，正所谓“有人的地方就有江湖”，身处江湖的人，多少会有点身不由己的磕磕绊绊，本文完！