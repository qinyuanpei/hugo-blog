function handleYearlyChart(el, data) {
    var dom = document.getElementById(el);
    var data = JSON.parse(dom.getAttribute('data-chart'))
    var chart = echarts.init(dom);
    var option = {
        title: {
            text: '文章统计',
            x: 'center'
        },
        tooltip: {},
        xAxis: {
            data: Object.keys(data)
        },
        yAxis: {
            type: 'value',
            name: '数量',
            min: 0,
            max: 35,
            interval: 5,
        },
        series: [{
            name: '数量',
            type: 'bar',
            data: Object.values(data)
        }, {
            name: '数量',
            type: 'line',
            data: Object.values(data)
        }]
    };
    chart.setOption(option);
}

function handleCategoryChart(el, data) {
    var dom = document.getElementById(el);
    var data = JSON.parse(dom.getAttribute('data-chart'))
    var chart = echarts.init(dom);
    chart.on("click", function (param) {
        if (typeof param.seriesIndex == 'undefined') {
            return;
        }
        if (param.type == 'click') {
            location.href = '/categories/' + encodeURI(param.data.name);
        }
    });
    var seriesData = []
    for (var key in data) {
        seriesData.push({
            name: key,
            value: data[key]
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

function handleTagsChart(el) {
    var dom = document.getElementById(el);
    var data = JSON.parse(dom.getAttribute('data-chart'))
    var maskImage = new Image();
    var chart = echarts.init(dom);
    chart.on('click', function (param) {
        if (typeof param.seriesIndex == 'undefined') {
            return;
        }
        if (param.type == 'click') {
            location.href = '/tags/' + encodeURI(param.data.name);
        }
    });
    var seriesData = [];
    for (var key in data) {
        seriesData.push({
            name: key,
            value: data[key]
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

function handleLanguagesChart(el) {
    var dom = document.getElementById(el);
    var data = JSON.parse(dom.getAttribute('data-chart'));
    var chart = echarts.init(dom);
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
        var score = Math.round((data[lang] / totalAmount + 0.32).toFixed(2) * 100);
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

function handleLeetCodeChart(el, data) {
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

function handleShanbayChart(el) {
    var dom = document.getElementById(el);
    var data = JSON.parse(dom.getAttribute('data-chart'));
    var chart = echarts.init(dom);
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
            data: data.map(x => {
                let date = new Date(x.checkin_date)
                return `${date.getMonth() + 1}-${date.getDate()}`
            })
        },
        yAxis: [{
            type: 'value',
            name: '时间',
            min: 0,
            max: 40,
            interval: 5,
        }],
        series: seriesData
    };
    chart.setOption(option);
}

function handleDoubanChart(el) {
    var dom = document.getElementById(el);
    var data = JSON.parse(dom.getAttribute('data-chart'))
    var chart = echarts.init(dom);
    var total = []
    for (let i = 0; i < data.books.length; i++) {
        total.push(Number(data.books[i]) + Number(data.movies[i]))
    }
    var option = {
        title: {
            text: '书影音统计',
            x: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                crossStyle: {
                    color: '#999'
                }
            }
        },
        xAxis: [
            {
                type: 'category',
                data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
                axisLabel: {
                    formatter: '{value}月'
                },
                axisPointer: {
                    type: 'shadow'
                }
            }
        ],
        yAxis: [
            {
                type: 'value',
                name: '数量',
                min: 0,
                max: 15,
                interval: 5,
                axisLabel: {
                    formatter: '{value}'
                }
            }
        ],
        series: [
            {
                name: '读书',
                type: 'bar',
                tooltip: {
                    valueFormatter: function (value) {
                        return value + ' 本';
                    }
                },
                data: data.books
            },
            {
                name: '观影',
                type: 'bar',
                tooltip: {
                    valueFormatter: function (value) {
                        return value + ' 部';
                    }
                },
                data: data.movies
            },
            {
                name: '合计',
                type: 'line',
                tooltip: {
                    valueFormatter: function (value) {
                        return value + ' 个';
                    }
                },
                data: total
            }
        ]
    };

    chart.setOption(option);
}

window.statics = {
    handleYearlyChart,
    handleCategoryChart,
    handleTagsChart,
    handleLanguagesChart,
    handleDoubanChart,
    handleShanbayChart
}

