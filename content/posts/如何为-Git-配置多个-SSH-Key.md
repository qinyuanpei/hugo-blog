---
categories:
- 编程语言
copyright: true
date: 2024-01-30 12:30:47
description: ''
slug: How-To-Configure-Multiple-SSH-Keys-For-Git
tags:
- Git
- SSH-Key
- 备忘
- Bash
title: 如何为 Git 配置多个 SSH Key
toc: true
image: /posts/如何为-Git-配置多个-SSH-Key/GIT-Branch-and-its-Operations.png
---

在电视剧《繁花》里有这样一个情节，汪小姐和宝总在一起时喜欢吃排骨年糕，后来两人分道扬镳，汪小姐用 **“从此想，排骨是排骨，年糕是年糕”** 这句对白来概括两个人的关系。不得不说，这句伤感中带着点文艺的台词，在受到剧粉及书迷追捧的同时，更是戳中了无数吃货的心。排骨年糕好不好吃，我不晓得。我唯一知道的事情是，人们需要亲密关系，可人们同样需要界限和距离感，排骨和年糕，就像是工作和生活，当我们意识到 **“工作是工作，生活是生活”** 的时候，或许我们就能达到真正的 **“Work-Life Balance”**。那么，对于程序员来说，工作和生活的界限在哪里呢？我想，这一切或许可以从为 Git 配置多个 SSH Key 说起。

{{<douban type="movie" id="34874646">}}

相信大家都会遇到这种场景，即一台电脑上同时存在多个 Git 账号的情况。譬如，公司的项目使用 Gitlab 托管，而个人的项目使用 Github 托管，更不必说，云效、Gitee、码云、Coding 等形形色色的平台。在这种情况下，你需要为每个代码托管平台生成 SSH Key，然后将其对应的公钥复制到指定的位置。所以，如何让这些不同托管平台的 SSH Key 和平共处、互不影响呢？这就是今天这篇文章想要分享的冷知识。当然，对博主个人而言，最主要的目的，还是希望能将公司和个人两个身份区分开来，所以，下面以 Github 和 Gitlab 为例来展示具体的配置过程。

# 生成 SSH Key

首先，为两个平台生成各自的 SSH Key，使用 `ssh-keygen` 命令即可:

```Bash
ssh-keygen -t rsa -C "<公司邮箱>" -f ~/.ssh/company-ssh
ssh-keygen -t rsa -C "<个人邮箱>" -f ~/.ssh/personal-ssh
```

考虑到安全性问题，现在更推荐使用 Ed2519 加密算法，此时，你只需要替换上述命令中的 rsa 为 ed2519 即可。

# 配置 Config 

接下来，我们需要为本地的 SSH 配置上个步骤中生成的两个 SSH Key。通常，这个配置文件存在于以下路径：

* Linux:  `~/.ssh/config`
* Windows:  `C:\Users\<Your-User>\.ssh\config`

如果在 Windows 系统下找不到该文件，我们直接创建一个无扩展名的文本文件即可：

```conf
Host gitlab.com
    HostName gitlab.com
    PreferredAuthentications publickey
    IdentityFile ~/.ssh/company-ssh
Host github.com
    HostName ssh.github.com
    PreferredAuthentications publickey
    IdentityFile ~/.ssh/personal-ssh
```

其中，`Host` 这一行表示该配置项的唯一标识，`HostName` 表示需要连接的目标服务器，`IdentityFile` 表示私钥文件的路径。可以注意到，我们这里共有两个 SSH Key 的配置，它们分别指向了上个步骤中生成的 SSH Key 私钥文件。至此，我们就完成了 SSH Key 的配置。

# 添加公钥

可以注意到，在上述配置文件中，`PreferredAuthentications` 这一项的值为 `publickey`，这表示平台将使用公钥来进行认证。所以，接下来，我们需要在 Github 以及 Gitlab 上添加对应的公钥：

![为 Github 添加 SSH 公钥](/posts/如何为-Git-配置多个-SSH-Key/Add-SSH-Key-For-Github.png)

![为 Gitlab 添加 SSH 公钥](/posts/如何为-Git-配置多个-SSH-Key/Add-SSH-Key-For-Gitlab.png)

这一点，在各个平台上基本上是相似的，通常都可以在设置中找到相应的选项，这里不再赘述。

# 身份验证

OK，现在我们可以来验证下 SSH Key 是否生效，以 Github 为例：

```bash
ssh -T git@github.com
```

如果你可以看到类似下面这样的回应，就证明这个 SSH Key 已添加成功，Gitlab 同理：

![为 Github 添加 SSH 公钥](/posts/如何为-Git-配置多个-SSH-Key/SSH-Key-Check.png)

# 使用 SourceTree

到这一步，其实我们的目的就达到了，Git 客户端会根据项目里 Git 仓库的地址，来决定要使用哪一个 SSH Key。博主平时习惯使用 SourceTree，所以，这里我还想再补充一个点，那就是邮箱。众所周知，Git 里的配置有全局配置和本地配置两种，通常情况下，我们会使用下面的命令来配置全局用户：

```bash
git config --global user.name "<Your-Name>"
git config --global user.email <Your-Email>
```

而 SourceTree，默认使用全局用户，这无疑会令我们在工作和生活上的身份产生混淆。对此，我的建议是选取工作邮箱来配置全局用户，然后在个人项目里使用个人邮箱来配置本地用户，这样就不会在个人项目中泄露或者掺杂公司邮箱，这样可以有效地杜绝信息安全或者是知识产权方面的纠纷。我现在养成的一个习惯是，在 SourceTree 里提交代码的时候，会稍微留意一下下面的用户信息，这算是在本地配置了多个 SSH Key 以后的一个副作用啦！

本文完！