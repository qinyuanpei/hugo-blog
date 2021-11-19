const rewardBox = document.querySelector('.cy-reward-pop');
const rewardButton = document.querySelector('.cy-reward');
const closeButton = document.querySelector('.cy-close-btn');
const chioceItems = document.querySelectorAll('.platform-item');

export let initialReward = function() {
    if (rewardButton != null) {
        rewardButton.addEventListener('click', () => {
            rewardBox.style.display ='block';
        });
    }

    if (closeButton != null) {
        closeButton.addEventListener('click', () => {
            rewardBox.style.display ='none';
        });
    }

    if (chioceItems != null) {
        chioceItems.forEach(item => {
            item.addEventListener('click', ()=> {
                let radios = document.querySelectorAll('.platform-radio-box');
                radios.forEach(radio => {
                    radio.classList.remove('platform-checked');
                    radio.style.background = 'url(/imgs/reward/radio2.jpg)';
                });
    
                let radio = item.querySelector('.platform-radio-box');
                radio.classList.add('platform-checked');
                radio.style.background = 'url(/imgs/reward/radio1.jpg)';
                let choiceId = radio.attributes['data-id'].value;
    
                let qrcodes = document.querySelectorAll('.cy-reward-code img');
                qrcodes.forEach(qrcode => {
                    let nodeType = choiceId + '-code';
                    if (qrcode.attributes['node-type'].value == nodeType){
                        qrcode.style.display ='inline';
                    } else {
                        qrcode.style.display ='none';
                    }
                });
            })
        });
        
        if (chioceItems[1] != null) {
            chioceItems[1].click();
        }
    }
}