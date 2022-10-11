---
categories:
- 数据存储
copyright: true
date: 2022-10-10 12:30:47
description: ''
slug: A-Story-Of-Git-Large-File-Storage
tags:
- Git
- LFS
- 技巧
- 记录
title: 关于 Git 大文件上传这件小事
toc: true
image: /posts/关于-Git-大文件上传这件小事/cover.jpg
---

很多年后，当我在命令行中熟练地操作 Git 的时候，我总会不由地想起从前意气风发的自己。毕竟不知不觉间，三十岁的年龄已然被更年轻的人们嫌弃“苍老”，除却生理上不可逆转的自然衰老，更多的或许是一种心态上的衰老。以前，我是非常鄙夷在 Git 仓库里提交 Word 或者 Excel 文件这种行为的，甚至连理由都给得十分正当，即：这种文件不利于差异的对比和合并。后来，参与的项目越来越多，渐渐认识到 Markdown 始终是一种小众的格式，你没有办法要求所有人都去适应 Markdown。所以，当我说我在心态上变成了一个老人的时候，其实是指，我不再对这件事情那么执着。当然，人生本来就是一个解决麻烦再制造麻烦的过程。当你默许了在 Git 仓库里提交非文本文件的行为，当这些非文本文件随着时间推移变得越来越大时，就出现了 Git 大文件上传、存储等等一系列的问题。因此，今天这篇文章，我们来聊聊 Git 里的大文件。

# 提交前的未雨绸缪

其实，博主不愿意在 Git 仓库里上传 Word 或者 Excel 文件，一个最为直接的理由是，它会成为我们拉取或者推送代码时的累赘。君不见，腾讯硬生生在手机 QQ 里内置了一个虚幻 4 引擎，想象一下，如果把这么多的文件都放到 Git 仓库里，每次做一点修改该有多痛苦啊！事实上，Github 对文件大小的限制是 100M，Gitlab 对文件大小的限制则是 600M，一旦超过这个限制，就会被判定为大文件。因此，[Atlassian](https://www.atlassian.com/)、[GitHub](https://github.com) 等组织一起开发了针对 Git 的 Large File Storage 扩展，即：[Git LFS](https://git-lfs.github.com/)。其原理是延迟地下载大文件的相关版本来减少大文件对仓库的影响，具体来说，就是在 `checkout` 到工作区的时候才会真正去下载大文件的内容。如果大家想了解更多 [Git LFS](https://git-lfs.github.com/) 的细节，可以阅读下面这份文档：[https://www.atlassian.com/git/tutorials/git-lfs](https://www.atlassian.com/git/tutorials/git-lfs)，这里不再考虑对其进行二次加工。

![Git LFS 原理示意图](/posts/关于-Git-大文件上传这件小事/cover.jpg)

当你准备向一个 Git 仓库提交大文件的时候，首先，你需要下载和安装 [Git LFS](https://git-lfs.github.com./) 扩展并执行命令：

```bash
git lfs install
```

其次，在 Git 仓库中，你需要通过 `git lfs track` 命令告诉 Git LFS，你希望它帮你管理哪些文件：

```bash
git lfs track "*.jpg"
```

这里以 `*.jpg` 为例，它表示希望 Git LFS 对所有的 `.jpg` 格式的文件进行管理，这一步的结果是生成一个名为 `.gitattributes` 的文件。因此，理论上你可以直接编辑这个文件来达到相同的目的：


```plain
*.jpg filter=lfs diff=lfs merge=lfs -text
```

最后，你需要确保 `.gitattributes` 文件能被 Git 仓库追踪：

```bash
git add .gitattributes
```

一旦完成了这个准备工作，你就可以像平时一样提交和推送变更：

```bash
git add awesome.jpg
git commit -m "Add a awesome image file"
git push origin main
```

下图演示了 Git LFS 从初始化到应用的整个过程，可以注意到，这个过程中会生成各种钩子脚本：

![Git LFS 的初始化与应用](/posts/关于-Git-大文件上传这件小事/Git-LFS-03.png)

# 提交后的亡羊补牢

扁鹊见蔡桓公的故事，告诉我们防微杜渐的道理。可如果你和博主一样，是在提交了一个大文件以后，才开始接触 [Git LFS](https://git-lfs.github.com/) 的相关内容。那么，你大概会遇到下面的错误：

![Git 上传文件超过 100M 的错误提示](/posts/关于-Git-大文件上传这件小事/Git-LFS-01.png)

你可能会想，既然是这个文件的大小超过了 Github 的限制，那我把这个文件删除掉是不是就可以了呢？经过博主一番挣扎，发现这个思路完全是徒劳的。因为这个大文件就像持续了三年的新冠病毒一样，只要存在被它感染过的历史记录，都会在推送时提示上面的错误。所以，删除这个大文件并不能真正解决问题，我们必须要确保此前的提交历史中没有这个大文件。下面分享一个神奇的命令 [git filter-branch](https://cloud.tencent.com/developer/section/1138641) ：

```bash
git filter-branch -f --index-filter 'git rm --cached --ignore-unmatch /src/CSharpWasm/mono-6.12.0.182-x64-0.msi'
```

通过这个命令，我们就可以重写整个提交历史：

![从提交历史中删除指定的大文件](/posts/关于-Git-大文件上传这件小事/Git-LFS-02.png)

此时，我们只需要按提交大文件前的步骤，重新提交该文件即可，并且可以突破 100M 的限制：

![成功提交一个超过 100M 的大文件](/posts/关于-Git-大文件上传这件小事/Git-LFS-04.png)


# 本文小结

我写作的话题，基本上可以分为两类：有计划的和无计划的。显然，这一篇属于后者，它就像育碧旗下的开放世界，当你漫游其中总会遇到那些令人意外的支线任务。我个人挺喜欢这种由点及面的认知模式，即从一个特定的问题逐步过渡到一个更为宽泛的知识或者体系上面。在这篇文章里，无法提交一个超过 100M 的大文件是表，不了解 [Git LFS](https://git-lfs.github.com/) 是里，更有趣的一点是，解决问题的过程通常是由“**果**”反推出“**因**”，而撰写博客的过程则是由“**因**”顺推出“**果**”。从这个角度来看的话，对读者“**揣着明白装糊涂**”这才是最难把握的一个分寸，平时写长文章总担心写不清楚，而写短文章则担心像流水账。对于 Git LFS 来说，Git 仓库存储的其实是一个[指针文件](https://github.com/git-lfs/git-lfs/wiki/Tutorial#lfs-pointer-files-advanced)，真正的内容则是存储在 LFS 服务器里，主流的代码托管平台如 Github、Gitlab 等都支持 Git LFS，我们只需要安装 Git LFS 的客户端扩展即可。当然，我对非文本文件的合并依然持悲观态度，想象一下，两个人同时修改了一个大文件，一个已经推送到远程，一个已经提交到本地，那么，当他们尝试合并代码的时候，又会发生什么事情呢？作为一名程序员，每天被安排排查和解决问题，简直是家常便饭，可解决问题会有尽头吗？我想，大概率是没有的罢！

# 参考链接
* [https://git-lfs.github.com](https://git-lfs.github.com)
* [https://github.com/git-lfs/git-lfs/wiki/Tutoria](https://github.com/git-lfs/git-lfs/wiki/Tutoria)
* [https://www.atlassian.com/git/tutorials/git-lfs](https://www.atlassian.com/git/tutorials/git-lfs)