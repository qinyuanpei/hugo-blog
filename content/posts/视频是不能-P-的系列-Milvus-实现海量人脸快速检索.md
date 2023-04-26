---
categories:
- 编程语言
copyright: true
date: 2023-04-24 20:49:47
description: ''
slug: Use-Milvus-To-Quickly-Retrieve-Massive-Faces
tags:
- 人脸识别
- Python
- Milvus
- 向量
title: 视频是不能 P 的系列：使用 Milvus 实现海量人脸快速检索
toc: true
image: /posts/视频是不能-P-的系列-Milvus-实现海量人脸快速检索/eye-g11309d339_1280.jpg
---
最近一直在优化一个人脸识别项目，最大的感受是，科学的尽头永远都是殊途同归。一年前我在使用 [dlib](http://dlib.net/) 实现人脸识别的时候，其实当时有两个悬而未决的问题：其一是人脸样本数目增加带来的性能下降问题；其二是如何快速地判断目标人脸是否在人脸样本中。此时此刻，在经历了虹软人脸识别 SDK 的折磨以后，我终于意识到，这两个问题从来就没有消失，它会在某个合适的时机突然跳出来，然后不露声色地敲打着你说道：“**出来混还是要还的**”。此刻，回过头来重新审视这两个问题，我认为，它们本质上就是 1:1 和 1:N 的问题。笔者在使用[虹软](https://www.arcsoft.com.cn/technology/face.html)人脸识别 SDK 过程中，遇到了一个非常棘手的难题，即：当目标人脸在人脸数据库中时，其识别过程就非常地丝滑；而当目标人脸不在人脸数据库中时，其识别过程就异常地卡顿。因为有使用 dlib 做人脸识别的前车之鉴，博主猜测罪魁祸首可能是频繁的特征对比。相比于输出一条枯燥的结论，我更喜欢梳理解决问题过程中的思路。所以，对于今天这篇博客，笔者想和大家分享的内容是，使用 Milvus 实现海量人脸快速检索。

# 从人脸识别到向量

故事应该从哪里讲起呢？我想，可以从人脸数据库这个角度来切入。当我们把人脸特征存储到 CSV 或者是数据库中的时候，本质上是将 1: N 问题转化为 1:1 问题。因为你不得不遍历人脸数据库中的每一个样本，然后从中选取出一个最大的相似度或者最小的距离。此时，人脸识别的效率就会受到样本数量、相似度/距离计算两个因素的影响。以虹软人脸识别 SDK 为例，其免费版提供了 1:1 人脸特征对比的接口，付费版提供了 1:N 人脸特征对比的接口。当然，据热心网友透露，官方这个 1:N 其实还是通过 1:1 循环来实现的。可即便如此，在相同的时间复杂度下，想要写好这样一个循环，这件事情本身并不容易。所以，影响人脸识别效率的因素里，还应该考虑到人的因素。在这个硬件性能过剩的时代，“锱铢必较”大抵会成为一种难能可贵的品质。谁能想到，如今训练模型的门槛变成了一块显卡呢？

[![通过 one-hot 编码实现的文本向量化表示示意图 ](/posts/视频是不能-P-的系列-Milvus-实现海量人脸快速检索/bcf92-2020-02-17-one-hot.png.webp)](https://easyai.tech/ai-definition/word-embedding/)


可如果我们换一种角度来思考这个问题，就会发现这一切的根源来自向量这种全新的数据类型。不管是 CSV 还是关系型数据库，我们都无法直接对向量数据进行过滤和筛选，这迫使我们不得不在内存中加载所有的人脸特征数据，然后再通过逐个计算和对比的方式来查找目标数据。当目标人脸在人脸数据库中不存在的时候，这项工作就开始变得面目狰狞起来。这其实代表着一种趋势，即数据从结构化到非结构化的转变。例如，NLP 中计算文本的相似度时，其理论依据是向量的余弦公式。再比如时下最火爆的 ChatGPT，其使用的 [Embeddings](https://openai.com/blog/introducing-text-and-code-embeddings) 模型就是文本的向量化表示。如果你有接触过机器学习的相关知识，相信你会对向量有更丰富的认知。按照刘慈欣老师在《三体》小说中的描述，高维文明可以对低维文明实施降维打击。如果我们把向量看作是一种将高维度信息压缩为低维度信息的技术，那么，时下这场 AI 革命是不是可以同样视为降维打击呢？试想一下，那些如同咒语一般的提示词(Prompt)背后，不正是由无数个超出人类认知范围的多维向量在参与着复杂计算吗？

# Milvus 向量数据库

正如我们目前所看到的那样，AIGC 改变了我们对这个世界的编程方式，即从 DSL/GPL 逐步地转向自然语言。在 OpenAI 的 GPT4 以及百度的文心一言中，我们会注意到这些大语言模型(LLM)开始支持图片。也许，以后还会支持音频、视频、文件……等等不同的形式，而这其实就是我们经常听到“**多模态**”的概念。可以预见的是，未来会有更多的非结构化数据加入其中，传统的关系型数据库将不再适合 AI 时代。譬如，最为典型的“以图搜图”功能，难道你还能期望对某张图片使用 LIKE 关键字做模糊查询吗？从这个角度来说，向量数据库将会是未来 AI 应用不可或缺的基础设施，就像此刻的关系型数据库之于 CRUD 一样。目前，向量数据库主要有 Facebook 的 [Faiss](https://faiss.ai/)、[Pinecone](https://docs.pinecone.io/docs/openai)、Vespa、国内创业公司 Zilliz 的 [Milvus](https://milvus.io/)，以及京东的 [Varch](https://vearch.readthedocs.io/zh_CN/latest/) 等等，笔者这里以 Milvus 为例来展示向量数据库的核心功能——相似度检索。

## Milvus 的安装与使用

作为一家国内公司出品的产品，Milvus 的[文档](https://milvus.io/docs)写得非常详细，更重要的是它支持 [Python](https://pypi.org/project/pymilvus/)，这是我选择 Milvus 的其中一个理由。在阅读文档的过程中，博主发现，官方非常贴心地准备了 [docker-compose.yml](https://github.com/milvus-io/milvus/releases/download/v2.2.6/milvus-standalone-docker-compose.yml) 文件，我是无论如何都不能拒绝这份善意的，因此，我们直接通过 `Docker` 启动即可：

```bash
docker-compose up -d 
```

接下来，我们通过一个简单的示例来演示 Milvus 的用法。首先，我们假设可以用一个三维向量 (a, b, c) 来表示一个人的身高、体重、年龄。此时，我们有如下图所示的人物信息：

| Id          | Name        | Metrics       |
| :---        | :---        | :---          |
| 1           | 小明        | (1.8, 75, 25) |
| 2           | 小月        | (1.75, 70, 24) |
| 3           | 小王        | (1.8, 80, 28) |
| 4           | 小李        | (1.78, 78, 30) |
| 5           | 小张        | (1.75, 70, 23) |
| 6           | 小赵        | (1.8, 76, 29)  |

好了，为了将这些数据存入 Milvus，我们需要创建一个对应的集合，它相当于关系型数据库中的一张表，这里定义三个字段 id、name 和 metrics，它们分别表示主键Id、人物名称和人物指标。其中，人物指标是一个三维向量：

```python
# pip install pymilvus==2.2.7
from pymilvus import connections, CollectionSchema, FieldSchema, DataType, Collection, utility

# 连接数据库
connections.connect(
    alias="default", 
    user='minioadmin', password='minioadmin', 
    host='localhost', port='19530'
)

# 创建集合
people_id = FieldSchema(
    name='id', dtype=DataType.INT64, is_primary=True
)
people_name = FieldSchema(
    name='name', dtype=DataType.VARCHAR, max_length=200
)
people_metrics = FieldSchema(
    name='metrics', dtype=DataType.FLOAT_VECTOR, dim=3
)
schema = CollectionSchema(fields=[people_id, people_name, people_metrics])
collection = Collection(name='people', schema=schema, using='default', shards_num=2)
```

接下来，我们将这几个人物的信息写入 Milvus，需要注意的是，Python 中的向量其实使用数组来表示的，并且在组织写入数据的时候，我们应该按照列的方式来整理这些数据：

```python
# 插入数据
data = [
    [1, 2, 3, 4, 5, 6],
    ['小明','小月','小王','小李','小张','小赵'],
    [[1.8, 75, 25],[1.75, 70, 24],[1.8, 80, 28],[1.78, 78, 30],[1.75, 70, 23],[1.8, 76, 29]]
]
mr = collection.insert(data)
collection.flush()
```

那么，现在数据已经存储到 Milvus 中，我们该如何进行相似度检索呢？为此，我们需要创建一个对应的索引：

```python
# 创建索引
index_params = {
    "metric_type":"L2", # L2:欧式距离, IP:向量内积
    "index_type":"FLAT",
    "params":{ }
}
collection.create_index(
    field_name='metrics', 
    index_params=index_params
)
```

接下来，我们来编写查询条件，你可以选择使用欧式距离或者向量的点积来表示相似度，博主这里还是最经典的欧式距离，更多的细节可以参考[官方文档](https://milvus.io/docs/build_index.md)。如下图所示，你觉得和目标人物最接近的是哪一位呢？

```python
collection.load()

# 查询数据
search_params = {"metric_type": "L2", "params": {"nprobe": 10}}
results = collection.search(
    data=[[1.75, 72, 24]], # 查询一个身高 1.75 米、体重 72 公斤、年龄 24 岁的人物
    anns_field="metrics", 
    param=search_params,
    limit=10, 
    expr=None,
    output_fields=['id','name'],
    consistency_level="Strong"
)
```

答案揭晓，是小月，你猜对了吗？这说明 Milvus 返回的结果是符合我们的预期的。同理，你可以得到距离小王、小李、小张“最近”的人物，而这就是 Milvus 在向量相似性检索上的一个简单应用。

![Milvus 向量相似性检索结果展示](/posts/视频是不能-P-的系列-Milvus-实现海量人脸快速检索/Milvus_SearchResults.png)


其实，我并不喜欢这种单调的评价体系，因为人类自始至终都是一种复杂的生物，可我们这个世界，好像还是更喜欢用金钱这个指标来评价一个人，或许是因为一维向量更简单一点？可你不得不承认，在将一切都转化为向量以后，你就可以从定性分析转变为定量分析，人类的一切情绪波动在 AI 的眼中，不过是单调、重复的数学计算。

## Milvus 在人脸识别上的应用

现在，让我们尝试将 Milvus 运用到人脸识别上面。我们知道，在 dlib 中人脸特征值可以用一个 128 维的向量来表示。所以，这是一个非常合理的联想。此时，Milvus 会帮我们完成相似度计算的工作，这不正是我们希望看到的结果吗？坦白地讲，当我看到 Milvus 需要将数据加载到内存中时，我是有一点失望的，因为我担心这一切只是某种循环结构的掩饰。Anyway，现在可以通过 Milvus 找到相似度最高的人脸，依然不失为一种新的思路。有了前面的基础，我们可以非常容易地写出下面的代码：

```python
# 提取人脸特征并写入向量数据库
def extract_features_to_milvus(faces_dir):
    collection = None
    if not utility.has_collection('faces'):
        collection = create_collection('faces')
        create_index(collection, 'person_face')
    else:
        collection = Collection('faces')

    mean_features_list = list(get_mean_features_of_face(faces_dir))
    person_names = list(map(lambda x:x[1], mean_features_list))
    person_faces = list(map(lambda x:x[0].tolist(), mean_features_list))
    person_ids = [i+1 for i in range(len(mean_features_list))]
    mr = collection.insert([person_ids, person_names, person_faces])
    collection.flush()

# 从向量数据库中查询最相似的人脸
def search_face(collection, feature):
    search_params = {"metric_type": "IP", "params": {"nprobe": 10}}
    return collection.search(
        data=[np.array(feature).tolist()],
        anns_field="person_face", 
        param=search_params,
        limit=20, 
        expr=None,
        output_fields=['person_id','person_name'],
        consistency_level="Strong"
    )
```

你可能会问，实际的识别效果如何？对此，我想说的是，你不能依靠 Milvus 返回相似度最高的一张人脸。经过博主的测试，人脸识别的准确度和你每次查询数据多少有关，你至少应该返回几十个可能的结果，然后再从这些结果中选取一条匹配程度最高的数据。我个人的看法是，现阶段的向量数据库可能都逃脱不了循环的宿命，在样本数目不大的情况下，其优势并不显著。那么，从这个角度来说，这篇文章的尝试和探索是不是就宣告失败了呢？我只能说，**人有时候要试着放下对结果的执念，因为你不可能每次尝试都能得到好的结果**。曾经有前辈把机器学习比作炼丹，时下流行的各种 LLM，无一不经历了反复的训练和优化，所以，你可以说，我至少了解了一种可用于图片检索的方案啊，对吧？

# 本文小结

这篇文章主要尝试了在人脸识别中引入向量数据库的思路，而背景则是来源于真实项目中的一次性能优化。由于人脸特征数据是一种非结构化的数据，传统的关系型数据库对此可谓是无从下手。因此，在人脸识别的场景中，遍历人脸库中的每一个样本、逐一对比特征值，可以说是一种非常普遍的做法。目前，ChatGPT 及其相关的大语言模型(LLM) 保持热度不减，而像 Embedding 这样的概念开始频繁的出现在人们的视野当中。其实，不管是以前的词袋模型还是现在的 [Word2Vec](https://builtin.com/machine-learning/nlp-word2vec-python)，向量的概念一直都存在，无非是现在有更好的契机去了解这些知识。借助于向量这个桥梁，我们可以将大量的非结构化数据转换为结构化的数据。从某种意义上来讲，向量是一种从高维度走向低维度的信息压缩技术。而在人脸识别的场景中，向量数据库可以帮助我们完成相似度索引的工作，即使最终的识别效果并不理想，可我们终究还是在这个过程中有所收获。好了，以上就是这篇博客的全部内容，欢迎大家在评论区留下你的建议或者意见。
