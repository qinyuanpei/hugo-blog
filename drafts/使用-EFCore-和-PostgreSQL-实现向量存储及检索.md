---
abbrlink: 
categories:
- 编程语言
date: 2024-03-06 21:34:36
description: 
slug: Use-EFCore-With-PostgreSQL-For-Vector-Storage-And-Retrieval
tags:
- PostgreSQL
- pgvector
- 向量
- LLM
title: 使用 EFCore 和 PostgreSQL 实现向量存储及检索
---
随着 ChatGPT 的兴起及其背后的 AIGC 产业不断升温，向量数据库已成为业界备受瞩目的领域。[FAISS](https://github.com/facebookresearch/faiss)、[Milvus](https://milvus.io/)、[Pinecone](https://www.pinecone.io/)、[Chroma](https://github.com/chroma-core/chroma)、Qdrant 等产品层出不穷。市场调研公司 MarketsandMarkets 的数据显示，全球向量数据库市场规模预计将从 2020 年的 3.2 亿美元增长至 2025 年的 10.5 亿美元，年均复合增长率高达 26.8%。这表明向量数据库正从最初的不温不火逐步演变为大模型的 "超级大脑"。
向量数据库不仅解决了大模型在 "事实性" 和 "实时性" 方面的固有缺陷，还为企业重新定义了知识库管理方式。此外，与传统关系型数据库相比，向量数据库在处理大规模高维数据方面具有更高的查询效率和更强的处理能力。因此，向量数据库被认为是未来极具潜力的数据库产品。
然而，面对非结构化数据的挑战，传统的关系型/非关系型数据库并未坐以待毙。开始支持向量数据库的特性，PostgrelSQL 就是其中的佼佼者。

# 

# 