---
categories:
- 编程语言
copyright: true
date: 2022-11-15 12:49:47
description: 这篇文章介绍了作者在企业级应用项目中接触到的面向企业和用户的项目区别，重点讨论了为什么需要LDAP认证以及如何在Nginx和Apache服务器上集成LDAP认证。在具体操作中，展示了如何在Nginx中安装nginx-auth-ldap模块以及在Apache中使用mod-authnz-ldap模块实现LDAP认证，并简要介绍了在后端实现Basic认证的流程。文章最后总结了Nginx和Apache在LDAP认证方面的不同之处，并对企业级应用的认证方案提出了讨论。
image: /posts/为你的服务器集成-LDAP-认证/fantasy-ga56af2520_1280.jpg
slug: Integrate-LDAP-Authentication-For-Your-Server
tags:
- Apache
- Nginx
- LDAP
- 认证
title: 为你的服务器集成 LDAP 认证
toc: true
---

回顾我这些年的工作经历，面向企业(2B)和面向用户(2C)的项目都曾接触过。我个人觉得，面向企业的项目更注重业务，参与决策的人数多、周期长，目的是为企业提供生产经营价值，如缩减成本、提升效率等等，而面向用户的项目更注重体验，参与决策的人数少、周期短，目的是为消费者提供更多的使用价值，本质上是为了圈揽用户和抢夺流量。我在参与这些项目的过程中发现，企业级应用的研发更注重与第三方软件如 SAP、金蝶、用友、ERP 等等的整合，因此，类似单点登录、数据同步这样的需求非常普遍。每当这个时候，我就不由地想起一位前辈。

![时间就像沙漏里的沙一样流逝](/posts/为你的服务器集成-LDAP-认证/time-ge417ba6ed_1280.jpg)


当我还在 Automation 打杂的时候，前辈总是一脸得意地问我：“听说过 AD Domain 吗？”。那时，初出茅庐的我年少轻狂，不好意思说我不会，立马敷衍道：“当然听说过，只是一直没用过”。前辈目光如炬，大抵是看出我心虚，立马不屑一顾地回应道：“那就是不会”。过了几秒钟，前辈不紧不慢地接着说道：“只有学会了 AD Domain，你才算是一只脚踏进了企业级应用开发这个领域，知道吗？”，我点了点头，心道：“这不就和茴香豆的茴字有五种写法一样无聊吗？”。多年后，当 LDAP 这个字眼再次映入眼帘的时候，我内心终于清楚地知道：我错了。

# 为什么需要 LDAP 认证

我错在哪里了呢？我想，要回答这个问题，还是需要从企业管理的角度来着手。一个面向用户(2C)的产品，其用户基本上是不受地域因素限制的，而对于一个面向企业(2B)的产品，其用户基本上是在一个层次分明、有着明显边界的范围内。运营一个企业，除了业务系统以外，可能还需要 OA、财务、ERP 等等外围软件的支持，如果是一家互联网公司，可能还需要 DevOps、监控、协作等等方面的支撑。此时，从企业的角度自然是希望可以统一账号体系，这样就衍生出了各种各样的单点登陆和认证方案，单单是博主接触过的就有：[OAuth2](https://oauth.net/2/)、[CAS](https://www.apereo.org/projects/cas)、[Keycloak](https://www.keycloak.org/)、[IdentityServer4](docs.identityserver.io/en/latest/)，这些方案可以说是各有千秋，此中曲折我们按下不表。

![运行在 Windows Server 上的 AD](/posts/为你的服务器集成-LDAP-认证/AD_On_Windows_Server.png)

这里博主想说的是，一旦企业通过 AD Domain 或者说 [Active Directory](https://learn.microsoft.com/zh-cn/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview) 来管理用户，就自然而然地牵扯出域登录或者域账号登录的问题。这类围绕 AD Domain 或者说域的问题，我们都可以考虑使用 LDAP 认证或者 [Kerberos](https://web.mit.edu/Kerberos/) 认证，特别是后者，主流的软件如 Kafka、Zookeeper、MySQL 等等均支持这一协议，它可以实现在登录本地账户后，免登录打开一个网站的效果。可想而知，这是一个对企业而言极具诱惑力的特性，一个账号打通所有基础设施。当然，我承认 Kerberos 这个协议是非常复杂的，绝非三言两语可以厘清其中的千丝万缕，所以，我们今天只是聊聊 LDAP 认证这个话题。

![通过 LDAP Browser 访问 AD](/posts/为你的服务器集成-LDAP-认证/LDAP_Browser.png)

可能大家会纠结，LDAP 和 Active Directory 这两者间的关系，事实上， LDAP 是指轻量目录访问协议(Lightweight Directory Access Protocol)，而 Active Directory 则是微软针对该协议的一种实现。当然，微软为了解决域控的问题，利用 LDAP 存储了一部分私有的数据。所以，两者的关系就像是接口和实现类，我们这里只需要 Active Directory 当成一台 LDAP 服务器即可。关于 Active Directory 的基础知识，这里不再做更多的科普。总而言之，通过 LDAP 我们可以对某个网站实现认证，从而达到保护资源的目的。譬如博主目前参与的前端项目，它是没有常规的登录、注册页面的，它采用的就是域账号登录的形式。下面，我们来看看如何集成 LDAP 认证。

# 如何集成 LDAP 认证 

结合博主在上文中描述的场景，假设我们有一个前端项目通过 Nginx 或者 Apache 进行托管。通常情况下，我们可以直接访问这些前端页面，这意味这些资源是不受任何保护的。对企业来说，它更希望将这些资源保护起来，以确保只有它的员工或者说加入域的用户才可以访问，此时，我们该如何解决这个问题呢？

## Nginx 篇

以 Nginx 为例，我们可以通过 [nginx-auth-ldap](https://github.com/kvspb/nginx-auth-ldap) 这个模块来解决这个问题。下面是一个简单的示意图，其基本思路是：在输入用户名和密码后，该模块会连接 LDAP 服务器对用户身份进行校验，如果校验通过，则会以 Basic 认证的的方式生成 `Authorization` 请求头；反之，将会返回 401 状态码，表示认证失败。

![Nginx 集成 LDAP 示意图](/posts/为你的服务器集成-LDAP-认证/LDAP-Auth-With-Nginx.drawio.png)

注意到，这是一个第三方的模块，不管你是通过 Docker 或者主机来部署 Nginx，它都不会包含这个模块，此时，我们就需要为 Nginx 安装这个模块。因为 Nginx 采用的是静态编译的策略，所以，安装模块本质上就是同时拉取 Nginx 和模块的源码，然后重新编译生成二进制文件的过程。首先，我们来下载该模块的源码：

```bash
git clone https://github.com/kvspb/nginx-auth-ldap.git /usr/src/nginx-auth-ldap/; 
```

接下来，我们需要下载 Nginx 源码，无论你是在全新安装的 Nginx 上安装模块，还是在一个安装好的 Nginx 上安装模块，这一步都是必须的，千言万语汇成一句话：Nginx 采用的是静态编译的策略。博主这里是在 `nginx:stable-alpine` 这个镜像的基础上安装模块： 

```bash
wget http://nginx.org/download/nginx-1.22.1.tar.gz
tar -zxvf nginx-1.22.1.tar.gz
cd nginx-1.22.1
```
接下来，如果是全新安装 Nginx，那么，你可以像下面这样列出常用的模块，然后用 `--add-module` 参数指向当前模块的路径：`/usr/src/nginx-auth-ldap/` 。请注意，下面的参数经过简化，并不代表实际使用的参数：
```bash
./configure \
  --prefix=/etc/nginx \
  --sbin-path=/usr/sbin/nginx \
  --with-http_addition_module \
  --with-http_auth_request_module \
  --add-module=/usr/src/nginx-auth-ldap/ 

make && make install 
```
如果是安装好的 Nginx，那么，这个参数就必须从当前的 Nginx 上继承过来，否则，已经安装好的模块将不会参与编译。原本博主非常喜欢 Nginx ，可这一条博主实在不能容忍，这完全是在用户面前摆烂，难道使用了哪些了模块你心里没点数吗？非要逼着用户去帮你维护这些配置信息？这些又臭又长的参数真的不考虑做持久化吗？吐槽完 Nginx，我们继续来填坑，为了获取 Nginx 当前的配置参数，你可以使用 `nginx -V` 这个命令(注意：这个 `V` 必须要大写)，此时，我们就可以得到下面的答案：

![获取 Nginx 配置参数](/posts/为你的服务器集成-LDAP-认证/Nginx-Configure-Parameters.png)

这意味着什么呢？这意味着你需要把红框里的这一堆参数放到 `./configure` 后面，然后再像上面一样添加 `--add-module` 参数，这简直是造孽啊！为了简化这个过程，我改进了一下脚本：

```bash
# 匹配 configure arguments ，然后再从第 21 个字符开始截取，即冒号后面的所有内容
NGINX_CONFIG=$(nginx -V 2>&1 | grep 'configure arguments' | cut -c21-)
./configure $NGINX_CONFIG --add-module=/usr/src/nginx-auth-ldap/ 
make && make install
```
当然，如果你亲自折腾过这一切，就知道这是痴心妄想，因为提取出来的这组参数会提示各种各样的错误，总之，你需要按照实际的情况来对这组参数就行调整，看着  [Dockerfile](https://github.com/Regularly-Archive/2022/blob/main/src/vue-ldap/Dockerfile_Nginx) 里比裹脚布还要长的参数，Nginx 官方难道你们不会心痛吗？当然，当你熬过这一切以后，我们就可以着手 Nginx 的配置啦：

```nginx
http {
  # 定义 LDAP 服务器
  ldap_server ldap {
    # LDAP 服务器地址，使用 sAMAccountName 还是 uid 以实际的 AD 配置为准
    url ldap://<IP>:389/OU=OPS,DC=company,DC=com?sAMAccountName?one;
    # 管理员账号, CN/OU/DC 以实际的 AD 配置为准
    binddn "CN=<Administrator>,OU=OPS,DC=company,DC=com";
    # 管理员密码
    binddn_passwd "<Password>";
    group_attribute uniquemember;
    group_attribute_is_dn on;
    require valid_user;
  }

  server {
    listen  80;
    server_name  localhost;

    location / {
      # 启用 LDAP 认证
      auth_ldap "Forbidden";
      auth_ldap_servers ldap;
      root /usr/nginx/wwwroot;
      index index.html;
    }
  }
}
```

可以注意到，我们只需要按实际域控来配置 `ldap_server` 节点，然后为受保护的资源启用 LDAP 认证即可。此时，如果访问前端页面，浏览器将会提示输入用户名和密码：

![Nginx 集成 LDAP 效果演示-1](/posts/为你的服务器集成-LDAP-认证/集成-LDAP-认证-01.png)

如果我们输入的用户名或者密码不正确会怎么样呢？浏览器将会孜孜不倦地提示你输入用户名和密码。如果我们点击取消会怎么样呢？此时，如下图所示，它将会返回 `401` 状态码，表示认证失败：

![Nginx 集成 LDAP 效果演示-2](/posts/为你的服务器集成-LDAP-认证/集成-LDAP-认证-06.png)

此外，我们可以注意到，一旦认证通过，我们就可以正常访问前端页面。与此同时，所有的请求都会自动带上 `Authorization` 请求头，显然，这是一个 Basic 认证：

![Nginx 集成 LDAP 效果演示-3](/posts/为你的服务器集成-LDAP-认证/集成-LDAP-认证-03.png)

![Nginx 集成 LDAP 效果演示-5](/posts/为你的服务器集成-LDAP-认证/集成-LDAP-认证-05.png)

至此，我们就实现了 Nginx 下的 LDAP 认证集成。

## Apache 篇

虽然 Nginx 比 Apache 更轻量、社区更活跃，可是在模块管理这方面，Apache 是完全吊打 Nginx 的，类似地，Apache 通过 `mod-authnz-ldap` 这个模块来实现 LDAP 认证的集成，并且这个模块有二进制包，可以直接通过包管理器来安装，从这方面来看，Nginx 完全不如 Apache ：

```bash
# 安装模块
apt-get update;
apt-get install -y libldap2 mod_ldap mod-authnz-ldap; 
# 启用模块
a2enmod ldap; 
a2enmod authnz_ldap; 
```
接下来，我们只需要修改一下 Apache 的配置文件即可：

```xml
<VirtualHost *:80>
  ServerName localhost

  ServerAdmin webmaster@localhost
  DocumentRoot /var/www/html

  LogLevel debug

  ErrorLog ${APACHE_LOG_DIR}/error.log
  CustomLog ${APACHE_LOG_DIR}/access.log combined

  <Location "/">
    AuthType Basic
    AuthName "LDAP SSO"
    AuthBasicProvider ldap
    AuthLDAPBindDN "CN=<Administrator>,OU=OPS,DC=company,DC=com"
    AuthLDAPBindPassword "<Password>"
    AuthLDAPURL ldap://<IP>:389/OU=OPS,DC=company,DC=com?sAMAccountName?one
    Require valid-user
  </Location>
</VirtualHost>
```

可以注意到，两者的配置是非常相似，可以实现相同的效果，这里就不再详细展示啦！

## Backend 篇

在前面的示意图里，我们看到还有 `Backend` 这样一个环节。其实，很多时候，我觉得企业级应用的开发非常别扭，因为它总是在现代中透着些古板，说它现代是因为它在跟进微服务、前后端分离、容器化这些流行趋势，说它古板是因为它总在尝试用新技术做旧时代的东西。譬如，前后端分离以后，JWT 是最常见的认证方式，在这种模式下，服务就应该是无状态的，可实际开发中它还是会搞出来一个 Session 的概念，难道现在还是汤姆猫的时代吗？这个域账号登录的想法确实不错，可它和现在主流的 JWT 是不兼容的，除非在服务器端实现了 Basic 认证。下面是 ASP.NET Core 中实现 Basic 认证的一个简单流程：

```csharp
async Task Invoke(HttpContext context)
{
    try
    {
        // 1.提取用户信息
        var header = context.Request.Headers["Authorization"]
        var authHeader = AuthenticationHeaderValue.Parse(header);
        var authParams = Convert.FromBase64String(authHeader.Parameter);
        var credentials = Encoding.UTF8.GetString(authParams).Split(':', 2);
        var username = credentials[0];
        var password = credentials[1];
        
        // 2.验证用户信息
        var user = await _userService.Authenticate(username, password);
        if (user != null)
        {
            // 3.指定当前用户
            var claims = new[] {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.UserName),
            };
            var identity = new ClaimsIdentity(claims, "Basic");
            var principal = new ClaimsPrincipal(identity);
            context.User = principal;
        }
    }
    catch {}

    await _next(context);
}
```

可以看到，Basic 认证的过程其实就是从 `Authorization` 请求头里提取用户信息并进行验证的过程，博主这里是以中间件的形式来进行说明。按照一般的做法，你可能需要继承 `AuthenticationHandler` 并重写 `HandleAuthenticateAsync()` 和 `HandleChallengeAsync()` 这两个方法，思路其实是完全一样的，这里就不再详细展开说啦！总而言之，如果前端想结合 LDAP 做身份认证，需要后端提供相应的支持。当然，如果你可以在请求传入到后端前自动产生一个 JWT 令牌，那再好不过啦！

# 本文小结

本文分享了 Nginx 和 Apache 结合 LDAP 实现身份认证的过程，背景则是企业级应用开发过程中对单点登陆、域账号登录的诉求。在这个过程中，博主对 Nginx 和 Apache 这两款服务器的差异有了更深刻的认识。考虑到 Nginx 采用的静态编译的策略，因此，给 Nginx 安装模块，本质上就是重新编译 Nginx 的过程，这个过程可谓是痛并快乐着，就像你在文章里看到的那样，博主已经不止一次吐槽过 Nginx 这个奇葩的模块管理方式。相比之下，Apache 的舒适感简直爆棚，因为它的模块都可以直接通过包管理器来安装。当我们为网站集成了 LDAP 认证以后，它会在打开站点时提示输入用户名和密码，一旦身份验证通过，Nginx 或者 Apache 会自动地为每个请求生成 `Authorization` 请求头，考虑到这个认证方式和目前主流的 JWT 认证不兼容，因此，这个方案需要后端实现 Basic 认证。在此基础上，博主提供了一个 ASP.NET Core 实现 Basic 认证的示例。有趣的是，虽然 Kerberos 协议被指出存在安全漏洞，可它还是在用 Basic 认证来传递用户信息，那么，你告诉我，企业应用需要的这种认证方案，到底是好是坏呢？