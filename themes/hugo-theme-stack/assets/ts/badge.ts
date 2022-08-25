function createBadge(badgeTitle, badgeDesc, titleColor, descColor) {
    console.log(
        `%c ${badgeTitle} %c ${badgeDesc} %c`,
        `background: ${titleColor}; padding: 1px; border-radius: 3px 0 0 3px;  color: #fff`,
        `background: ${descColor}; padding: 1px; border-radius: 0 3px 3px 0;  color: #fff`,
        'background:transparent'
      )
}

window.createBadge = createBadge;