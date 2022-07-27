let getTop = function(e) {
    var T = e.offsetTop;
    while(e = e.offsetParent) {
            T += e.offsetTop;
    }
    return T;
}

let lazyLoadByDefault = function(imgs) {
    var H = document.documentElement.clientHeight;
    var S = document.documentElement.scrollTop || document.body.scrollTop;
    for (var i = 0; i < imgs.length; i++) {
        if (H + S > getTop(imgs[i])) {
            if (imgs[i].getAttribute('loading') == 'lazy' && imgs[i].getAttribute('data-src')) {
                let src = decodeURI(imgs[i].getAttribute('data-src'))
                imgs[i].src = src
                imgs[i].removeAttribute("loading")
            }
        }
    }
}

let lazyLoadByObserver = function(lazyImages) {
    let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            let lazyImage = entry.target;
            if (lazyImage.getAttribute('loading') == 'lazy' && lazyImage.getAttribute('data-src')) {
                let src = decodeURI(lazyImage.getAttribute('data-src'))
                lazyImage.src = src
                lazyImage.removeAttribute("loading")
                lazyImageObserver.unobserve(lazyImage);
            }
          }
        });
      });
  
      lazyImages.forEach(function(lazyImage) {
        lazyImageObserver.observe(lazyImage);
      });
}

export default function() {
    window.onload = window.onscroll = function () {
        var imgs = document.querySelectorAll('img');
        if ("IntersectionObserver" in window) {
            lazyLoadByObserver(imgs)
        } else {
            lazyLoadByDefault(imgs)
        }
    }
}
