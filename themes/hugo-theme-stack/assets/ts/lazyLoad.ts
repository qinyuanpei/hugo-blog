let getTop = function(e) {
    var T = e.offsetTop;
    while(e = e.offsetParent) {
            T += e.offsetTop;
    }
    return T;
}

let lazyLoad = function(imgs) {
    var H = document.documentElement.clientHeight;
    var S = document.documentElement.scrollTop || document.body.scrollTop;
    for (var i = 0; i < imgs.length; i++) {
        if (H + S > getTop(imgs[i])) {
            if (imgs[i].getAttribute('loading') == 'lazy' && imgs[i].getAttribute('data-src')) {
                let src = decodeURIComponent(imgs[i].getAttribute('data-src'))
                imgs[i].src = src
            }
        }
    }
}

export default function() {
    window.onload = window.onscroll = function () {
        var imgs = document.querySelectorAll('img');
        lazyLoad(imgs);
    }
}
