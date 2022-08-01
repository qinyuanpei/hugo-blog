function handleData (posts) {
    var tags = {};
    var yearly = {};
    var categories = {};
    for (post of posts) {
        //统计不同年份
        var post_date = new Date(post.date);
        var post_year = post_date.getFullYear().toString();
        if (post_year in yearly) {
            yearly[post_year] = yearly[post_year] + 1;
        } else {
            yearly[post_year] = 1;
        }
        //统计不同分类
        for (category of post.categories) {
            if (category in categories) {
                categories[category] = categories[category] + 1;
            } else {
                categories[category] = 1;
            }
        }
        //统计标签
        for (tag of post.tags) {
            if (tag.name in tags) {
                tags[tag] = tags[tag] + 1;
            } else {
                tags[tag] = 1;
            }
        }
    }
    return {
        yearly: yearly,
        categories: categories,
        tags: tags
    };
}

function handleYearlyChart (el, data) {
    var chart = echarts.init(document.getElementById(el));
    var option = {
        title: {
            text: '文章统计',
            x: 'center'
        },
        tooltip: {},
        xAxis: {
            data: Object.keys(data.yearly)
        },
        yAxis: {},
        series: [{
            name: '数量',
            type: 'bar',
            data: Object.values(data.yearly)
        }, {
            name: '数量',
            type: 'line',
            data: Object.values(data.yearly)
        }]
    };
    chart.setOption(option);
}

function handleCategoryChart (el, data) {
    var chart = echarts.init(document.getElementById(el));
    chart.on("click", function (param) {
        if (typeof param.seriesIndex == 'undefined') {
            return;
        }
        if (param.type == 'click') {
            location.href = '<%- config.url %>' + '/categories/' + encodeURI(param.data.name);
        }
    });
    var seriesData = []
    for (var key in data.categories) {
        seriesData.push({
            name: key,
            value: data.categories[key]
        });
    }
    var option = {
        title: {
            text: '分类统计',
            x: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        series: [{
            name: '分类',
            type: 'pie',
            radius: '50%',
            center: ['50%', '50%'],
            data: seriesData,
            itemStyle: {
                emphasis: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    };
    chart.setOption(option);
}

function handleTagsChart (el, data) {
    var maskImage = new Image();
    var chart = echarts.init(document.getElementById(el));
    chart.on('click', function (param) {
        if (typeof param.seriesIndex == 'undefined') {
            return;
        }
        if (param.type == 'click') {
            location.href = '<%- config.url %>' + '/tags/' + encodeURI(param.data.name);
        }
    });
    var seriesData = [];
    for (var key in data.tags) {
        seriesData.push({
            name: key,
            value: data.tags[key]
        });
    }
    var option = {
        title: {
            text: '标签统计',
            x: 'center'
        },
        series: [{
            type: 'wordCloud',
            sizeRange: [10, 100],
            rotationRange: [-90, 90],
            rotationStep: 45,
            gridSize: 2,
            shape: 'circle',
            image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABAklEQVQ4T63TLyyFURjH8c8trs0UicDMNFMIBF3RkJhNoOmKzSapJgkKzZ8k0BWBQjQbAkUym5vYs513e++7l3fX9dvOTjjP893v+XNq2lStzXxFQC82MIOBAvwJZ9jCa/aWB/TjCn0Vrl4wgeeIywMOsIgLzOO9AOrGEaYRsUsZ4BydmEQHBhF2yxRlPeIzuW2Egx3MJetv2K0oYQ09iFKOAzCCa9RbnEgD4wFYT2cZC5itAJ3iEPvYDsBmShpNTb3H0A+QBwzjC7c4CcAK9nCDD0wVppNnReIlujCG1QBE56Oev6ie7UGQy5arDNoUmwHu0jTijl78pqbYf/9MLffhG9gELuqHjsg6AAAAAElFTkSuQmCC",
            drawOutOfBound: false,
            textStyle: {
                color: function () {
                    return (
                        "rgb(" +
                        [
                            Math.round(Math.random() * 160),
                            Math.round(Math.random() * 160),
                            Math.round(Math.random() * 160),
                        ].join(",") +
                        ")"
                    );
                },
            },
            emphasis: {
                textStyle: {
                    shadowBlur: 10,
                    shadowColor: "#333",
                    color: "#409EFF"
                }
            },
            data: seriesData.sort(function (a, b) {
                return b.value - a.value;
            })
        }]
    };
    chart.setOption(option);
}

function handleLanguageChart (el, data) {
    var chart = echarts.init(document.getElementById(el));
    var totalAmount = Object.keys(data)
        .map(function (x) {
            return data[x]
        })
        .reduce(function (prev, curr, idx, arr) {
            return prev + curr;
        });
    var scores = [];
    var indicators = [];
    for (let lang of Object.keys(data)) {
        indicators.push({ text: lang, max: 100 })
        var score = (data[lang] / totalAmount + 0.35).toFixed(2) * 100;
        scores.push(score);
    }
    option = {
        title: {
            text: '语言统计',
            x: 'center'
        },
        tooltip: {
            trigger: 'axis',
        },
        radar: [
            {
                indicator: indicators,
                radius: 80,
                center: ['50%', '60%'],
            },
        ],
        series: [
            {
                type: 'radar',
                tooltip: {
                    trigger: 'item',
                },
                areaStyle: {},
                data: [
                    {
                        value: scores,
                        name: '语言使用(%)'
                    }
                ]
            }
        ]
    };
    chart.setOption(option);
}

function handleLeetCodeChart (el, data) {
    var chart = echarts.init(document.getElementById(el));
    var seriesData = []
    for (var key in data.categories) {
        seriesData.push({
            name: key,
            value: data.categories[key]
        });
    }
    var option = {
        title: {
            text: '力扣统计',
            x: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        series: [{
            name: '分类',
            type: 'pie',
            radius: '50%',
            center: ['50%', '50%'],
            data: seriesData,
            itemStyle: {
                emphasis: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    };
    chart.setOption(option);
}

function handleShanbayChart (el, data) {
    var chart = echarts.init(document.getElementById(el));
    var seriesData = []
    seriesData.push({
        name: "学习时长",
        type: "line",
        data: data.map(x => x.words.used_time + x.listen.used_time + x.speak.used_time + x.read.used_time)
    });
    option = {
        title: {
            text: '扇贝打卡',
            x: 'center'
        },
        tooltip: {
            trigger: 'axis'
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data.map(x => x.checkin_date)
        },
        yAxis: [{
            type: 'value',
            min: 0,
            max: 35,
            interval: 5
        }],
        series: seriesData
    };
    chart.setOption(option);
}

export default {
    handleData,
    handleYearlyChart,
    handleCategoryChart,
    handleTagsChart
}
