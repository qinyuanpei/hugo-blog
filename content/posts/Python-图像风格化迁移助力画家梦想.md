---
categories:
- 编程语言
copyright: true
date: 2022-05-01 13:32:47
description: 这篇文章探讨了风格化迁移的概念，并以图像风格化迁移为例进行讨论。文章提及了人人都是食神、产品经理、艺术家的观点，引出了图像风格化迁移的背景和意义。详细介绍了风格化迁移的定义、实现原理以及算法支撑，包括神经网络在图像风格化迁移中的应用。最后，作者分享了自定义模型训练的尝试和结果，并通过图像展示了传统水墨画风格迁移的效果。文章结尾以对艺术与技术的思考和对创作的热情做出总结。
image: /posts/Python-图像风格化迁移助力画家梦想/cover.jpg
slug: A-Introduction-To-Stylized-Migration-Of-Python
tags:
- Python
- OpenCV
- 美术
- 画家
title: Python 图像风格化迁移助力画家梦想
toc: true
---

很多年前，星爷在《食神》这部电影里大彻大悟，「只要用心，人人都是食神」。从那个时候起，这句话就隐隐约约带着返璞归真、回归本心的意思。如同电影里描绘的餐饮行业一样，在资本市场的裹挟下，造神这项运动显得轻而易举，这个食神可以是史蒂·周，可以是唐牛，可以是任何人。因此，当穷困潦倒的史蒂芬·周，因为一碗叉烧饭而落泪的时候，我想，这或许是一种直面自我的顿悟。毕竟，电影里的星爷原本就不会做饭。《舌尖上的中国》带火了一句话，“高端的食材，往往只需要最简单的烹饪”，在我看来，这同样是一种“人人都是食神”的自我暗示。多年以后，互联网行业炙手可热的彼时彼刻，一句“人人都是产品经理”让无数人发现，提需求的门槛居然如此的低。其实，早在 1967 年，德国艺术家约瑟夫·博伊斯就曾语出惊人，“人人都是艺术家”，联想到“鸡娃”教育下的各种艺术特长培训班，这句话大概是真的。你内心深处是否同样保留着某种艺术家的梦呢？那么，此时此刻，博主想和大家分享的话题是图像的风格化迁移。

# 走近风格化迁移

提到风格化迁移这个概念的时候，大家可能会感到陌生，所以，我们不妨用相近的概念来进行类比。纵观人类的历史长河，初唐四杰、唐宋八大家的诗文各有千秋，李杜诗篇、苏辛长短句各领风骚，更不必说书法上的颜筋柳骨、苏黄米蔡。我曾经在碑林博物馆密密麻麻的石碑中，近距离看到人们如何将石碑上的文字拓下，我开始在脑海里徜徉，是否人类一切伟大的创造都是起源于模仿？这种思绪最终在艾伦·图灵的传记电影 [《模仿游戏》](https://movie.douban.com/subject/10463953/) 中找到了某种回应，就像人工智能领域里的神经网络，其实就是在模仿人类的大脑进行思考，甚至退一万步讲，当我们还是一个婴儿的时候，襁褓中的牙牙学语、蹒跚学步，这其实还是一种模仿。那么，如果要给风格化迁移下一个定义的话，其实就是让人工智能来对某种风格或者特点进行“模仿”，以图像的风格化迁移为例，它可以将梵高、莫奈或者毕加索的绘画风格“移植”到一张目标图片上，如下图所示：

![Neural-Style-Transformer 示意图](/posts/Python-图像风格化迁移助力画家梦想/Neural-Style-Transformer.drawio.png)

它可以借由梵高《星空》这副作品中的色彩，来「绘制」一副不一样的向日葵，虽然，梵高一生中创作了无数幅向日葵，在他人生的不同阶段，或表达对生命的渴望，或刻画出死亡的压抑。由此可见，风格化迁移其实可以理解为，不同流派绘画风格的一种“模仿”。当然，这一切都是由计算机通过特定的算法来实现，你可以想象一下，当你通过描摹字帖的方式来练字时，本质上就是在模仿那些书法家们的笔划，而如果将一切的行为都转化为数学公式，这其实就是一种风格化迁移啦！

![卷积神经网络(CNN)在图像风格化迁移上的应用](/posts/Python-图像风格化迁移助力画家梦想/Neural-Style-Transformer.Articles.png)

目前，图像的风格化迁移，主要的算法支撑来自下面这两篇文章：

* [A Neural Algorithm of Artistic Style](https://www.researchgate.net/publication/281312423_A_Neural_Algorithm_of_Artistic_Style)
* [Instance Normalization: The Missing Ingredient for Fast Stylization](https://www.researchgate.net/publication/305683206_Instance_Normalization_The_Missing_Ingredient_for_Fast_Stylization)

其中，前者提出“用神经网络来解决图像风格化迁移”的思路，而后者则是在此基础上引入了“可感知的损失”这一概念，如果大家有兴趣的话，不妨读一读下面这篇文章，它更像是一篇综述性质的文章，可以帮助你快速了解图像风格化迁移的前世今生，个人感觉，读这类文章会让你快速地认识到自己的无知，这或许是一件好事。

* [Neural Style Transfer: A Review](https://www.researchgate.net/publication/333702745_Neural_Style_Transfer_A_Review)

坦白讲，博主是第一次接触神经网络。所以，要学习陶渊明，「好读书，不求甚解」。如果大家确实对这块内容感兴趣的话，还是建议亲自去读一下这些文章，我就不在这里班门弄斧啦！(逃

# 体验风格化迁移
 
 好了，当我们对图像风格化迁移有了一定的了解以后，下面我们来快速体验下图像风格化迁移。OpenCV 在 3.3 版本后，正式引入了 DNN ，这使得我们可以在 OpenCV 中使用 Caffe、TensorFlow、Torch/PyTorch 等主流框架中训练好的模型。这里，我们主要参考了 [OpenCV](https://github.com/opencv/opencv/) 官方的 [示例代码](https://github.com/opencv/opencv/blob/4.x/samples/dnn/fast_neural_style.py):

```python
def style_transfer(pathIn='', pathOut='', model='', width=None, jpg_quality=80):
    '''
    pathIn: 原始图片的路径
    pathOut: 风格化图片的路径
    model: 预训练模型的路径
    width: 设置风格化图片的宽度，默认为None, 即原始图片尺寸
    jpg_quality: 0-100，设置输出图片的质量，默认80，越大图片质量越好
    '''

    ## 读入原始图片，同时调整图片至所需尺寸
    img = cv2.imread(pathIn)
    (h, w) = img.shape[:2]
    if width is not None:
        img = cv2.resize(img, (width, round(width*h/w)), interpolation=cv2.INTER_CUBIC)
        (h, w) = img.shape[:2]
    

    ## 载入预训练模型
    net = cv2.dnn.readNetFromTorch(model)
    net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)

    ## 将图片构建成一个 blob：设置图片尺寸，将各通道像素值减去平均值
    ## 比如 ImageNet 所有训练样本各通道统计平均值，然后执行一次前馈网络计算
    avg = (103.939, 116.779, 123.680)
    blob = cv2.dnn.blobFromImage(img, 1.0, (w, h), avg, swapRB=False, crop=False)
    net.setInput(blob)
    output = net.forward()

    ## reshape 输出结果, 将减去的平均值加回来，并交换各颜色通道
    output = output.reshape((3, output.shape[2], output.shape[3]))
    output[0] += avg[0]
    output[1] += avg[1]
    output[2] += avg[2]
    output = output.transpose(1, 2, 0)

    ## 输出风格化后的图片
    cv2.imwrite(pathOut, output, [int(cv2.IMWRITE_JPEG_QUALITY), jpg_quality])
```

接下来，为了让这段代码可以正常工作，你需要通过 `pip` 安装 `opencv-python` 这个包：

```bash
# OpenCV 核心包，必须安装
python -m pip install opencv-python==4.5.5.64
# OpenCV 扩展包，建议安装
python -m pip install opencv-contrib-python==4.5.5.64
```

OpenCV 官方的示例代码中是不带预训练模型的，它使用的是由热心网友 [jcjohnson](https://github.com/jcjohnson) 开发的项目：[fast-neural-style](https://github.com/jcjohnson/fast-neural-style)。当然，请不要高兴得太早，因为这个项目中同样不带预训练模型，博主一开始就是犯了这个错误，以为直接把这个项目克隆下来就可以了，果然，这里吃了没有文化的亏啊！

![Fast-Neural-Style 项目结构](/posts/Python-图像风格化迁移助力画家梦想/Fast-Neural-Style-Project.png)

总而言之，如果这里你下载下来的模型文件大小只有几个 KB 的话，建议你还是手动下载模型文件比较好一点，两种模型的下载链接，我都放在下面啦，你只需要替换模型名称即可！

* http://cs.stanford.edu/people/jcjohns/fast-neural-style/models/instance_norm/candy.t7
* http://cs.stanford.edu/people/jcjohns/fast-neural-style/models/eccv16/starry_night.t7

事实上，[fast-neural-style](https://github.com/jcjohnson/fast-neural-style) 这个项目共提供了 10 种不同的风格，它们分别是：基于 [Instance Normalization: The Missing Ingredient for Fast Stylization](https://arxiv.org/abs/1607.08022) 这篇文章的 6 种风格，以及基于 [A Neural Algorithm of Artistic Style](https://arxiv.org/abs/1508.06576) 这篇文章的 4 种风格：

![eccv16 中提供的 4 种风格](/posts/Python-图像风格化迁移助力画家梦想/Neural-Style-eccv16.png)

![instance_norm 中提供的 6 种风格](/posts/Python-图像风格化迁移助力画家梦想/Neural-Style-instance_norm.png)

这里，我们准备了一张向日葵的图片，并选择 `instance_norm/candy.t7` 这个模型来进行风格迁移，我们来一起看看能从中得到什么：

```python
style_transfer('sunflower.jpg', 'sunflower_candy.jpg','models\instance_norm\candy.t7')
```

此时，我们可以得到下面的结果，我个人认为，这有一种接近油画或者水粉画的感觉。因为某种特殊的原因，我对这些美术知识有一点粗浅的了解，所以，当我决定写这篇博客的时候，我总是不免会感慨丛生，画家用颜料来表达自我，诗人用文字来书写人生，一如今天我们用照片和视频来记录生活，可不管我们承载内容的媒介有多丰富，我们对于理解和认同的需求感从未减弱，正所谓，“人生得一知己足矣 ，斯世当以同怀视之”。

![通过风格化迁移生成的图像-01](/posts/Python-图像风格化迁移助力画家梦想/Neural-Style-Transformer.candy.png)

类似地，下面是利用剩下的模型生成的图片，我个人更喜欢第 5 张图片，看起来俨然一副素雅的手绘风。通过计算机来生成图像，其中最大的好处是不需要和颜料打交道。我从前有位学美术的朋友，每次见到对方，你总能从那个人换洗过衣服上找到油彩的痕迹：

![通过风格化迁移生成的图像-03](/posts/Python-图像风格化迁移助力画家梦想/Neural-Style-Transformer.03.jpg)

![通过风格化迁移生成的图像-05](/posts/Python-图像风格化迁移助力画家梦想/Neural-Style-Transformer.05.jpg)

![通过风格化迁移生成的图像-06](/posts/Python-图像风格化迁移助力画家梦想/Neural-Style-Transformer.06.jpg)

风格化迁移对普通的照片尚且有如此魔力，如果把它运用到名家作品上又会怎么样呢？这里，我选择是 [约翰内·维米尔](http://www.chinashj.com/ysll_ysllsy/12771.html) 的 [《戴头巾的少女》](https://zhuanlan.zhihu.com/p/81627184)，这幅画出名到了什么程度呢？漫威“寡姐”斯嘉丽·约翰逊、周冬雨、张靓颖等一众女明星都曾模仿过这一形象：

![戴头巾的少女使用风格化迁移后的效果](/posts/Python-图像风格化迁移助力画家梦想/Neural-Style-Transformer.girl.png)

怎么样，换一种方式来欣赏名家作品，是否会感到别有风味？而这种感觉，就像让达芬奇放下手里的鸡蛋去画漫天星空，就像让梵高用冷色调的笔触去描摹被刺死在浴缸里的马拉，为原本就扑朔迷离的历史添上一点天马行空的想象，虽然这一切可能都没什么意义，可人生嘛，好玩不就行啦！

# 自定义模型训练

到现在为止，我们已体验到通过 [fast-neural-style](https://github.com/jcjohnson/fast-neural-style) 实现“画画”的乐趣，虽然屏幕前的你，可能并不会认同这种乐趣。大概几年前，我有过一位来自印度的同事，他原本是来中国留学，毕业后找工作就一直留在西安。他主要从事沟通方面的工作，特别是那些需要和外国人打交道的场合。因此，在完全不懂技术的他的眼中，我在电脑面前不停敲击键盘、编程这件事情，在他看来就像是在“画画”。当有一天我真的在用代码“画画”的时候，我突然就想到了他，而人生正是由无数个这样的小插曲组成。

![王希孟-千里江山图卷(局部)](/posts/Python-图像风格化迁移助力画家梦想/s58defb9d45b7f.jpg)

接下来，我想尝试下自定义模型训练，譬如，用传统的国画来训练模型，然后将其运用到某一张图片上。为什么我会产生这样的想法呢？因为，曾经会有人因为选择国画还是油画，特意来征求我个人的意见，即使对方心中早已有答案，即使我在美术专业上全然是个外行，可那种被人信赖和依赖的感觉，我自始至终都特别怀念，如果有一种东西可以画出一个人内心所想，我们是不是就可以在沟通和理解上少一点遗憾。某种意义上，写博客就是在不断地输出自我的认知，尽管这个过程漫长而且煎熬。

![网友创作的核酸上河图(局部)](/posts/Python-图像风格化迁移助力画家梦想/b9888300002141fd83b8ba7ebac8d0fc.jpeg)

起初，我是参照 [fast-neural-style](https://github.com/jcjohnson/fast-neural-style) 这个项目来编写 `Dockerfile`，因为我只有一个非 GPU 的环境来训练模型。其实，在 [#40](https://github.com/jcjohnson/fast-neural-style/pull/40) 和 [#146](https://github.com/jcjohnson/fast-neural-style/pull/146) 这两个 Issues 下，已然有热心的朋友实现了容器化。可惜，我一直无法解决在`Dockerfile`內克隆代码报错的问题，再加上搭建 [Torch](http://torch.ch/) 环境并不是那么顺理。因此，我最终找到了它的替代品：[fast_neural_style_train](https://github.com/cleexiang/fast_neural_style_train)，它是基于 [PyTorch](https://pytorch.org/) 实现的，使用我更为熟悉的 Python 果然要舒服一点，如果你喜欢 [TensorFlow](https://tensorflow.google.cn/)，同样可以选择对应实现的版本。这里我简单说下训练过程：

```bash
git clone https://github.com/cleexiang/fast_neural_style_train
cd fast_neural_style_train
python -m pip install -r requirements.txt
```

如你所见，我们需要克隆项目、安装依赖，这个步骤基本没有太多难度。训练模型需要一个数据集，这里我们选用的 COCO 2014 的数据集，大概有 13G 左右的样子，下面是对应的下载链接，建议使用镜像地址来下载：

* [http://images.cocodataset.org/zips/train2014.zip (官方地址)](http://images.cocodataset.org/zips/train2014.zip)
* [https://pjreddie.com/media/files/train2014.zip (镜像地址)](https://pjreddie.com/media/files/train2014.zip)

解压后你会得到大概 8 万张左右的图片，按照 [PyTorch](https://pytorch.org/) 的要求，你需要将其放置在一个文件夹中，然后将其作为一个整体放在你的数据集根目录。这句话是什么意思呢？譬如，你的数据集目录为 `/dataset/`, 这些图片你放置在一个叫做 `/train2014/` 的目录中，那么，整个的目录结构应该是 `/dataset/train2014/`。下面我们开始训练，请注意，下面的所有目录都相对于 `/fast_neural_style_train/neural_style/` 而言：

```bash
cd neural_style
python neural_style.py train \
    --dataset ./dataset/ \
    --style-image ./myStyle.jpg \
    --save-model-dir ./trained \
    --epochs 2 --cuda 0
```
其中，`myStyle.jpg` 是我用来训练的传统水墨画，`./trained` 用来指定模型输出的目录，`--cuda 0` 表示通过 CPU 来训练模型，如果你有 GPU 环境，可以考虑把这个参数改成 `1`。执行命令后，首次会下载 `vgg16` 模型，这是一个用于卷积神经网络的模型，如果网络环境不稳定，可以多尝试几次，剩下的就是静静地等待啦，以博主的渣电脑举例，一个小时大概能跑 2000 张图片，所以，这 8 万多张图片，大概需要跑 40 个小时，太上老君炼丹的乐趣你体会到了吗？

![在博主电脑的 CPU 上训练模型截图-1](/posts/Python-图像风格化迁移助力画家梦想/Neural-Style-Transformer.Training.png)

![在博主电脑的 CPU 上训练模型截图-2](/posts/Python-图像风格化迁移助力画家梦想/Neural-Style-Transformer.Training-2.png)

通常来讲，只要跑完这些 Epoch，你就可以训练出一个特定的模型，`Torch` 训练出来的模型是 `.t7` 格式，`PyTorch` 训练出来的模型是 `.pt`、`.pth` 以及 `.pkl` 格式，理论上，我们只需要通过下面的命令，就可以验证训练出来的模型的效果。不过，博主这里出了一点点意外，在离成功只有一步之遥的时候，或许是因为 Windows 的自动更新，或许是因为某种难以预料的原因...，总而言之，电脑重启了一次，这是我第二次失败了，而第一次是跑到一半卡住了，我终于知道，为什么这个世界需要有专业的机器学习平台存在！

```python
python neural_style.py eval 
    --content-image ./input.jpg /
    --model ./myStyle.pt /
    --output-image ./output.jpg /
    --cuda 0
```

遗憾自然是有的，不过程序可以跑无数次，最多是花费一点点时间。可人生的很多事情，都是没有办法再重新来过的，当你遇见不同的人和事，你不知道未来会迎来什么样的结局，就像我花费了这 40 多个小时训练模型这件事情一样，也许下一次还会失败呢？可那又有什么关系，毕竟，生活里唯一不变的，只有变化本身啦！无论好坏，稍后我都会更新这件事情的结果，允许我先潦草地为这篇文章写下结尾。

![本文中用来训练模型的传统水墨画](/posts/Python-图像风格化迁移助力画家梦想/Fast-Neural-Style-Train-MyStyle.jpg)

![本文中用来验证模型的桂林山水](/posts/Python-图像风格化迁移助力画家梦想/Fast-Neural-Style-Train-Input.jpg)

如上图所示，这里我们使用一张传统水墨画来训练模型，并尝试将这种风格迁移到一张桂林山水的图片上，此时，东方世界的传统水墨画、西方世界的照相机，会碰撞出怎么样的火花呢？也许，下面的结果会让你感到失望，因为机器学习有时候就像炼丹，可不是人人都能炼成火眼金睛。关于这三种模型格式，官方的说法是，模型文件只有是否保留模型结构的区别，除此以外，无非是扩展名不一样罢了！

![自定义模型风格化迁移效果](/posts/Python-图像风格化迁移助力画家梦想/Fast-Neural-Style-Train-Output.jpg)

![自定义模型风格化迁移效果-输入2](/posts/Python-图像风格化迁移助力画家梦想/Fast-Neural-Style-Train-Input2.jpg)

![自定义模型风格化迁移效果-输出2](/posts/Python-图像风格化迁移助力画家梦想/Fast-Neural-Style-Train-Output2.jpg)

可以注意到，实际的效果并不显著，不知道是不是因为传统国画中使用的颜色有关。以前看[《国家宝藏》](https://www.bilibili.com/video/BV1TW4118757/) 的时候，《千里江山图》中使用的颜色基本都是从矿物中提取出来的，也许，正是因为颜料的来之不易，人们在作画时便多了一份虔诚。前段时间，有网友创作出了《清明上河图》风格的“核酸上河图”，千年以后，后人观察我们今天的所作所为，是不是就和我们看宋朝时候的生活风貌一样呢？

![色彩让世界变得丰富，但不要戴有色眼镜](/posts/Python-图像风格化迁移助力画家梦想/colors.png)

# 本文小结

数年前，我曾拜读过 [阮一峰](http://www.ruanyifeng.com/blog/) 老师翻译的 [《黑客与画家》](https://book.douban.com/subject/6021440/)，在这本书中，作者表达的观点是，黑客与画家在本质上是接近的，他们都在试图创作出优秀的作品，都需要想象力和创造力，都需要持续的关注细节、追求卓越。其实，任何一种艺术，不管是否重要，如果你想要在该领域出类拔萃，就必须全身心投入。毫无疑问，[黑客是数字时代的手工艺人](/posts/4205536912/)。所以，在写今天写这篇文章的时候，我觉得这种“混搭”或者说“跨界”，仿佛是两种身份的一次重合，在电脑上花费 40 多个小时来训练一个模型，是不是有种“都云作者痴，谁解其中味”的自嘲呢？图像的风格化迁移，个人觉得是特别有趣的一个领域，因为它可以把艺术和审美这种抽象的东西，转化为一种数学上的表达，就像黄金分割比、莫乌比斯环……也许，在某个像素的背后，就隐藏着蒙娜丽莎微笑的秘密呢？作为一个双子座，我生命中 80% 的时间都在理性和感性中纠缠，这大概是一种宿命。也许，我的使命就是去找出这样一个公式，好描摹我这像风一样来去不定的心的轨迹，本文完，谢谢大家！