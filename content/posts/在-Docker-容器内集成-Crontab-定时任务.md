---
categories:
- 编程语言
copyright: true
date: 2022-11-24 12:30:47
description: ''
slug:  Integrate-Crontab-Scheduled-Tasks-Inside-Docker-Containers
tags:
- 容器
- Linux
- Docker
- Bash
title: 在 Docker 容器内集成 Crontab 定时任务
toc: true
image: /posts/在-Docker-容器内集成-Crontab-定时任务/russian-gd53d0982f_1280.jpg
---

有时候，我们需要在容器内执行某种定时任务。譬如，`Kerberos` 客户端从 `KDC` 中获取到的 `TGT` 默认有效期为 10 个小时，一旦这个票据失效，我们将无法使用单点登录功能。此时，我们就需要一个定时任务来定时刷新票据。此前，博主为大家介绍过 [Quartz](https://www.quartz-scheduler.net/) 和 [Hangfire](https://www.hangfire.io/overview.html) 这样的定时任务系统，而对于 Linux 来说，其内置的 [crontab](https://linuxhandbook.com/crontab/) 是比以上两种方案更加轻量级的一种方案，它可以定时地去执行 `Linux` 中的命令或者是脚本。对应到 `Kerberos` 的这个例子里面，从 KDC 申请一个新的票据，我们只需要使用 `kinit` 这个命令即可。因此，在今天这篇博客里，我想和大家分享一下，如何在 Docker 容器内集成 Crontab 定时任务，姑且算是在探索 Kerberos 过程中的无心插柳，Kerberos 认证这个话题博主还需要再消化一下，请大家拭目以待，哈哈！

# Crontab 基础知识

众所周知，Linux 中的所有内容都是以文件的形式保存和管理的，即：一切皆为文件。那么，自然而然的地，Linux 中的定时任务同样遵循这套丛林法则，因此，当我们谈论到在 Linux 中执行定时任务这个话题的时候，本质上依然是在谈论某种特定格式的文件。事实上，这类文件通常被称为 `crontab` 文件，这是一个来源于希腊语 chronos 的词汇，其含义是时间。Linux 会定时(每分钟)读取 `crontab` 文件中的指令，检查是否有预定任务需要执行。下面是一个 `crontab` 文件的示例：

```bash
# 每分钟执行一次 ls 命令
* * * * * /bin/ls
# 周一到周五的下午5点发邮件
0 17 * * 1-5 mail -s "hi" alex@162.com
# 每月1号和15号执行脚本
0 0 1,15 * * /var/www/newbee/check.sh
# 00:20、02:20、04:20...执行 echo 命令
20 0-23/2 * * * echo "hello"
```
可以注意到，`crontab` 文件就像是一份写给 Linux 的日程表，它会告诉 Linux 每个时刻应该做什么样的事情。虽然这些事情看起来都显得琐碎繁复，甚至都精确到了每一分钟，可如果我们观察得足够仔细的话，就会发现这些定时任务都可以用下面的形式来表示，即：

```bash
* * * * * <program> 
```
其中，`<program>` 可以是一个命令或者脚本，而对于 `<program>` 前面的这部分，我们通常将其称为 cron 表达式，其含义定义如下：

```plaintext
*    *    *    *    *
-    -    -    -    -
|    |    |    |    |
|    |    |    |    +----- 星期(0 - 6)
|    |    |    +---------- 月份(1 - 12) 
|    |    +--------------- 日期(1 - 31)
|    +-------------------- 小时(0 - 23)
+------------------------- 分钟(0 - 23)
```
例如，`49 19 24 11 *` 这串神秘代码表示的是：11 月 24 日 19 时 49 分，在此基础上，当第一位为 * 时，表示每分钟都执行 `<program>` ；当第一位为 a-b 时，表示在 a 分钟到 b 分钟这段时间内执行 `<program>` ；当第一位为  */n 时，表示每隔 n 分钟执行一次 `<program>` ；当第一位为 a,b,c... 时表示第 a、b、c...分钟时执行一次 `<program>` 。依次类推，我们可以在不同的时间单位上使用这些表达式。例如：

```bash
# 每周六晚上00:00
0 0 * * 6
# 每周六和周天晚上00:00
0 0 * * 0,6
# 每周六和周天晚上00:00 ~ 04:00
0 0-4 * * 0,6
# 每周六和周天晚上00:00 和 01:00 执行
0 0,1 * * 0,6
# 每周六和周天晚上每隔两个小时执行一次
0 */2 * * 0,6
```

现在，回到我们一开始的问题，如何通过定时任务来解决 Kerberos 票据过期的问题呢？首先，我们准备一个名为 `renew.sh` 的脚本，这是一个非常简单的脚本，无论你是否接触过 Kerberos，是否了解 Principal 或是 SPN 这些概念，你都可以轻而易举地上手：

```bash
echo [$(date)] 'request a new ticket for HTTP/web.your-domain.com@YOUR-DOMAIN.COM'
kinit -kt /etc/apache2/krb-container.keytab HTTP/web.your-domain.com@YOUR-DOMAIN.COM
```

接下来，我们只需要在真正的 `crontab` 文件里引用这个脚本即可，从上面的表达式定义出发，我们可以知道，这个定时任务每隔 10 分钟执行一次：

```bash
cronfile='/usr/crontab/cron.conf'
renewTicket='*/10 * * * * /usr/crontab/renew.sh'
echo "$renewTicket" | tee -a $cronfile
crontab $cronfile
/etc/init.d/cron reload
/etc/init.d/cron restart
```

这里运用到的第一个技巧是 `crontab` 命令，它可以生成、编辑、删除、列举定时任务：

``` bash
# 生成定时任务
crontab <-u user> file
# 编辑定时任务
crontab <-u user> -e
# 删除定时任务
crontab <-u user> -r
# 列举定时任务
crontab <-u user> -l
```
在本文的示例中，博主没有指定 `-u` 这个参数，这是因为博主使用的是 `root` 用户。事实上，在指定了编辑器的情况下，你可以使用 `-e` 参数通过交互式的命令行来编写定时任务：

```bash
# 使用 vim 作为 crontab 的编辑器
export EDITOR="/usr/bin/vim"
crontab -e 
```
此时，我们就可以通过 `vim` 修改这份 `crontab` 文件。相信此时此刻，你会有一种感觉，这个 `crontab` 文件不就是一份由 cron 表达式组成的日程表吗？事实上，Linux 系统会维护一份 `crontab` 文件，我们自己编写的 `crontab` 文件会在执行 `crontab` 命令后合入到这份 `crontab` 文件里：

![通过命令行交互式编辑定时任务](/posts/在-Docker-容器内集成-Crontab-定时任务/edit-crontab-in-vim.png)

需要注意到的是，当我们在 Docker 容器内执行定时任务时，需要确保生成定时任务的这部分脚本，在容器的入口位置被执行，简而言之，我们应该有一个名为 `entrypoint.sh` 的脚本，并用它来替代容器的默认入口：

```bash
CMD ["sh", "/usr/docker/entrypoint.sh"]
```

一旦定时任务被创建出来，我们总是可以使用 `crontab -l` 命令列举出当前用户下有哪些定时任务：

![显示所有的定时任务](/posts/在-Docker-容器内集成-Crontab-定时任务/show-crontab-in-terminals.png)


# Crontab 日志问题

在这个过程中，博主发现一个问题，那就是看不到这些定时任务的执行日志。通常，这些日志位于以下路径：`/var/log/cron.log`，我们可以使用下面的命令：

```bash
tail -f /var/log/cron.log
```

此时，我们会得到下面的错误，显然，这是日志没有写入的缘故：

![无法查看定时任务日志](/posts/在-Docker-容器内集成-Crontab-定时任务/no-crontab-logs-in-terminals.png)

在尝试安装 `rsyslog` 以及修改配置启用定时任务日志后，该问题依然存在：

```bash
sudo apt-get install -y rsyslog;
sudo vim /etc/rsyslog.d/50-default.conf;
```
有趣的是，这个做法在 Ubuntu 最新版本中是生效的，而两者的区别是：前者是容器，后者是虚拟机。

![查看定时任务日志](/posts/在-Docker-容器内集成-Crontab-定时任务/crontab-logs-in-terminals.png)

吾上下求索而不得，最终采用下面的方案来解决，即直接重定向脚本输出到容器的标准输出：

```bash
echo [$(date)] 'Hello' > /proc/1/fd/1
```

此时，我们就可以在容器中看到对应的日志，虽然这只是一个小问题，可个人感觉还是挺折腾人的：

![重定向输出到容器日志](/posts/在-Docker-容器内集成-Crontab-定时任务/crontab-logs-in-docker.png)

# 参考链接

* [如何在 Docker 中执行 Crontab](https://cloud.tencent.com/developer/article/1451664)
* [How to Setup Rsyslog Server on Debian 11 (Bullseye)](https://www.linuxtechi.com/setup-rsyslog-server-on-debian/)
* [Understanding Crontab in Linux With Examples](https://linuxhandbook.com/crontab/)
* [What Is Cron Job](https://www.javatpoint.com/what-is-cron-job)





