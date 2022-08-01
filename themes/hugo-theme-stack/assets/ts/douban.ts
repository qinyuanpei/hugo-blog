class DoubanCard {
    private ele: HTMLElement;
    private subjectId: string;
    private requestUrl: string;
    private requestType: string;

    constructor(ele:HTMLElement, subjectId:string, requestUrl:string, requestType:string) {
        this.ele = ele;
        this.subjectId = subjectId;
        this.requestUrl = requestUrl;
        this.requestType = requestType;
        
        const model = this.fetchData();
        this.render(model);
    }

    private fetchData() {
        var cacheItem = localStorage.getItem(this.subjectId);
        if (cacheItem == null || typeof (cacheItem) == 'undefined') {
            fetch(this.requestUrl)
                .then(response => response.json())
                .then(data => {
                    let model = {
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

                    localStorage.setItem(this.subjectId, JSON.stringify(model));
                    return model;
                });
        } else {
            return JSON.parse(cacheItem);
        }
    }

    private render(model: any) {
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
}

window.DoubanCard = function(ele, subjectId, requestUrl, requestType) {
    return new DoubanCard(ele, subjectId, requestUrl, requestType);
}