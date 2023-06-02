class DoubanCard {
    private ele: HTMLElement;
    private subjectId: string;
    private requestUrl: string;
    private requestType: string;
    private localData: string;

    constructor(ele: HTMLElement, subjectId: string, requestUrl: string, requestType: string, data: string) {
        this.ele = ele;
        this.subjectId = subjectId;
        this.requestUrl = requestUrl;
        this.requestType = requestType;
        this.localData = data ? JSON.parse(data): null
        console.log(this.localData)

        const model = this.fetchData();
        if (this.requestType == 'movie') {
            this.renderMovie(model);
        } else {
            this.renderBook(model);
        }

    }

    private fetchData() {
        var cacheItem = localStorage.getItem(this.subjectId);
        if (cacheItem == null || typeof (cacheItem) == 'undefined') {
            fetch(this.requestUrl)
                .then(response => response.json())
                .then(data => {
                    let model = {}
                    if (this.requestType == "movie") {
                        model = {
                            title: data.data[0].name,
                            link: 'https://movie.douban.com/subject/' + data.doubanId,
                            cover: data.data[0].poster,
                            desc: data.data[0].description,
                            star: Math.floor(parseFloat(data.doubanRating)),
                            vote: data.doubanRating,
                            genre: data.data[0].genre,
                            date: data.dateReleased,
                            director: data.director[0].data[0].name
                        };
                    } else {
                        let desc = data.summary
                        desc = desc.replaceAll('<p>', '')
                        desc = desc.replaceAll('</p>', '')
                        model = {
                            title: data.title,
                            link: 'https://book.douban.com/subject/' + this.subjectId,
                            cover: data.images.medium,
                            desc: desc,
                            star: Math.floor(parseFloat(data.rating.average)),
                            vote: data.rating.average,
                            date: data.pubdate,
                            author: data.author.join(',')
                        }
                    }

                    localStorage.setItem(this.subjectId, JSON.stringify(model));
                    return model;
                });
        } else {
            return JSON.parse(cacheItem);
        }
    }

    private renderMovie(model: any) {
        const html = `
        <div class="post-preview"">
            <div class="post-preview--meta">
                <div class="post-preview--middle">
                    <h4 class="post-preview--title">
                        <a target="_blank" href="${model.link}">${model.title}</a>
                    </h4>
                    <div class="rating">
                        <div class="rating-star allstar${model.star}"></div>
                        <div class="rating-average">${model.vote}</div>
                    </div>
                    <time class="post-preview--date">
                        ${model.director}, ${model.genre}, ${model.date}
                    </time>
                    <section style="max-height: 75px; overflow: hidden;" class="post-preview--excerpt">
                        ${model.desc}
                    </section>
                </div>
            </div>
            <img class="post-preview--image" src="${model.cover}" loading="lazy">
        </div>
        `
        this.ele.insertAdjacentHTML('afterend', html)
    }

    private renderBook(model: any) {
        const html = `
        <div class="post-preview"">
            <div class="post-preview--meta">
                <div class="post-preview--middle">
                    <h4 class="post-preview--title">
                        <a target="_blank" href="${model.link}">${model.title}</a>
                    </h4>
                    <div class="rating">
                        <div class="rating-star allstar${model.star}"></div>
                        <div class="rating-average">${model.vote}</div>
                    </div>
                    <time class="post-preview--date">
                        ${model.author}, ${model.date}
                    </time>
                    <section style="max-height: 75px; overflow: hidden;" class="post-preview--excerpt">
                        ${model.desc}
                    </section>
                </div>
            </div>
            <img class="post-preview--image" src="${model.cover}" loading="lazy">
        </div>
        `
        this.ele.insertAdjacentHTML('afterend', html)
    }
}

window.DoubanCard = function (ele, subjectId, requestUrl, requestType) {
    return new DoubanCard(ele, subjectId, requestUrl, requestType);
}