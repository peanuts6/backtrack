(function (global) {
    function getRefererUrl () {
        var prefix = '',
            search = '',
            hash = '',
            param = '',
            ohash = '',
            params = {};
        var url = location.href;
        var urls = url.split('#');
        url = urls[0];
        hash = urls[1] ? urls[1] : '';
        url = url.split('?');
        search = url[1] ? url[1] : '';
        prefix = url[0];
        if (hash) {
            // search加在单页hash后面如：index.html?aa&bb&cc/#/a?b&c&d
            hash = hash.split('?');
            ohash = hash[0];
            param = hash[1] ? hash[1] : '';
        }
        // 拼接search
        if (search) {
            if (param) {
                param = '&' + param;
            }
        }
        search = search + param;
        // 拆分search为{key:value}
        param = search.split('&');
        for (var i = 0; i < param.length; i++) {
            var a = param[i].split('=');
            params[a[0]] = a[1] || '';
        }
        return {
            prefix: prefix,
            search: search,
            params: params,
            hash: ohash
        };
    }

    // 获取search中某一个字段，
    function getParameter (key) {
        var reg = new RegExp('[&,?]' + key + '=([^\\&#]*)', 'i');
        var value = reg.exec(location.search);
        return value ? value[1] : null;
    }

    function setRoutePath () {
        var local, str = '';
        var l = getRefererUrl();
        str += l.prefix;
        console.log('init path');
        var skippath = new RegExp('/(page4|result).html', 'i');
        var isSkipPath = skippath.test(location.pathname);
        if (l.search) {
            str += '?' + l.search + '&trace=' + (isSkipPath ? '2' : '1');
        } else {
            str += '?trace=' + (isSkipPath ? '2' : '1');
        }
        if (str.hash && str.hash !== '') {
            str += '#' + str.hash;
        }
        local = global.sessionStorage.getItem('routepath') ? (global.sessionStorage.getItem('routepath')).split(',') : [];
        local.push(str);
        global.sessionStorage.setItem('routepath', local.join(','));
    }

    var locate = {
        getRefererUrl: getRefererUrl,
        getParameter: getParameter,
        initRoutePath: function () {
            var trace = /[&,?]trace=([^\\&]*)/.test(location.href);
            var l;
            var reload = false;
            if (global.performance) {
                reload = global.performance.navigation.type === 1;
                console.log('performance== ', global.performance.navigation.type);
            } else {
                console.log('no performance');
                // 取最后一个path
                l = global.sessionStorage.getItem('routepath') ? (global.sessionStorage.getItem('routepath')).split(',') : [];
                var b, c;
                if (l.length > 0) {
                    b = l.pop();
                    c = location.href;
                    b = b.replace(/([&,?]trace=[1,2])/, '');
                    if (b === c) {
                        reload = true;
                    } else {
                        reload = false;
                    }
                }
            }
            // 刷新页面不记录、从堆栈返回不记录、忽略路径(中转页)不记录
            var ignorepath = new RegExp('/(translate|product_detail).html', 'i');
            if (!reload && !trace && !ignorepath.test(location.pathname)) {
                setRoutePath();
            }
        },
        back: function(){
            var local = global.sessionStorage.getItem('routepath') ? (global.sessionStorage.getItem('routepath')).split(',') : [];
            // 对接第三方接入入口
            var from = getParameter('backurl') || '';

            // 接XXX流程的返回url
            var burl = getParameter('burl');
            if (burl) {
                if (burl !== '') {
                    global.location.replace(decodeURIComponent(burl));
                }
                return;
            }

            // 回退功能
            var lastpath, lastpath2;
            var trace, trace2;
            if (from === '') {
                lastpath = local.pop();

                // 增加跳过路径
                trace = getParameterFromUrl('trace', lastpath);
                trace2 = trace;
                while (local.length > 0 && (trace && trace === '2')) {
                    lastpath2 = local.pop();
                    trace = getParameterFromUrl('trace', lastpath2);
                    // 确保值跳出循环不被改变
                    if (trace === '2') {
                        trace2 = trace;
                    }
                }
                //
                if (trace2 === '2') {
                    local.push(lastpath2);
                }

                global.sessionStorage.setItem('routepath', local.join(','));
                // Toastr.info(local);
                // 最后一个堆栈删没了
                if (local.length === 0) {
                    global.sessionStorage.removeItem('routepath');
                    var t = api['index'] : api['index'];
                    var ds = global.sessionStorage.getItem('DSEARCH') || '';
                    if (ds !== '') {
                        var s = [];
                        var d = ds.split('&');
                        for (var i = 0; i < d.length; i++) {
                            // 剔除不需要回传的参数
                            if (!/templateId|prdCode|from=|backurl|pageId|trace=1|trace=2/.test(d[i])) {
                                s.push(d[i]);
                            }
                        }
                        t += '?' + s.join('&');
                    }
                    location.replace(t);
                } else {
                    location.replace(local[local.length - 1]);
                }
            } else {
                // 当前url带有backurl参数，则返回backurl地址
                location.replace(decodeURIComponent(from + ''));
            }
        }
    };


    // 跟踪web路由
    locate.initRoutePath();
    window.addEventListener('hashchange', function () {
        var h = location.hash;
        if (!h && ['', '#', '#/'].indexOf(h) != -1) {
            console.log('hashchange', h);
            locate.initRoutePath();
        }
    }, false);

}(window))