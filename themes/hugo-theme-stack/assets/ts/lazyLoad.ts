let getTop = function(e) {
    var T = e.offsetTop;
    while(e = e.offsetParent) {
            T += e.offsetTop;
    }
    return T;
}

let lazyLoad = function(lazyImages) {
    var H = document.documentElement.clientHeight;
    var S = document.documentElement.scrollTop || document.body.scrollTop;
    for (var i = 0; i < lazyImages.length; i++) {
        if (H + S > getTop(lazyImages[i])) {
            if (lazyImages[i].getAttribute('data-src')) {
                let src = lazyImages.getAttribute('data-src')
                lazyImages[i].src = src
            }
        }
    }
}

export default function() {
    document.addEventListener("DOMContentLoaded", function() {
        var lazyImages = document.querySelectorAll('img');
        if ("IntersectionObserver" in window) {
            console.log('IntersectionObserver')
            let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
                entries.forEach(function(entry) {
                  if (entry.isIntersecting) {
                    let lazyImage = entry.target;
                    if (lazyImage.getAttribute('data-src')) {
                        lazyImage.src = lazyImage.getAttribute('data-src');
                        lazyImageObserver.unobserve(lazyImage);
                    }
                  }
                });
              });
          
            lazyImages.forEach(function(lazyImage) {
                lazyImageObserver.observe(lazyImage);
            });
        } else {
            console.log('fallback')
            document.addEventListener("scroll", function() {
                lazyLoad(lazyImages)
            });
        }
    })
}
