(function(){
let translateObjs = {};
const trans = (...a) => {
    return translateObjs[a[0x0]] = a, '';
};
function regTextVar(a, b) {
    var c = ![];
    return d(b);
    function d(k, l) {
        switch (k['toLowerCase']()) {
        case 'title':
        case 'subtitle':
        case 'photo.title':
        case 'photo.description':
            var m = (function () {
                switch (k['toLowerCase']()) {
                case 'title':
                case 'photo.title':
                    return 'media.label';
                case 'subtitle':
                    return 'media.data.subtitle';
                case 'photo.description':
                    return 'media.data.description';
                }
            }());
            if (m)
                return function () {
                    var r, s, t = (l && l['viewerName'] ? this['getComponentByName'](l['viewerName']) : undefined) || this['getMainViewer']();
                    if (k['toLowerCase']()['startsWith']('photo'))
                        r = this['getByClassName']('PhotoAlbumPlayListItem')['filter'](function (v) {
                            var w = v['get']('player');
                            return w && w['get']('viewerArea') == t;
                        })['map'](function (v) {
                            return v['get']('media')['get']('playList');
                        });
                    else
                        r = this['_getPlayListsWithViewer'](t), s = j['bind'](this, t);
                    if (!c) {
                        for (var u = 0x0; u < r['length']; ++u) {
                            r[u]['bind']('changing', f, this);
                        }
                        c = !![];
                    }
                    return i['call'](this, r, m, s);
                };
            break;
        case 'tour.name':
        case 'tour.description':
            return function () {
                return this['get']('data')['tour']['locManager']['trans'](k);
            };
        default:
            if (k['toLowerCase']()['startsWith']('viewer.')) {
                var n = k['split']('.'), o = n[0x1];
                if (o) {
                    var p = n['slice'](0x2)['join']('.');
                    return d(p, { 'viewerName': o });
                }
            } else {
                if (k['toLowerCase']()['startsWith']('quiz.') && 'Quiz' in TDV) {
                    var q = undefined, m = (function () {
                            switch (k['toLowerCase']()) {
                            case 'quiz.questions.answered':
                                return TDV['Quiz']['PROPERTY']['QUESTIONS_ANSWERED'];
                            case 'quiz.question.count':
                                return TDV['Quiz']['PROPERTY']['QUESTION_COUNT'];
                            case 'quiz.items.found':
                                return TDV['Quiz']['PROPERTY']['ITEMS_FOUND'];
                            case 'quiz.item.count':
                                return TDV['Quiz']['PROPERTY']['ITEM_COUNT'];
                            case 'quiz.score':
                                return TDV['Quiz']['PROPERTY']['SCORE'];
                            case 'quiz.score.total':
                                return TDV['Quiz']['PROPERTY']['TOTAL_SCORE'];
                            case 'quiz.time.remaining':
                                return TDV['Quiz']['PROPERTY']['REMAINING_TIME'];
                            case 'quiz.time.elapsed':
                                return TDV['Quiz']['PROPERTY']['ELAPSED_TIME'];
                            case 'quiz.time.limit':
                                return TDV['Quiz']['PROPERTY']['TIME_LIMIT'];
                            case 'quiz.media.items.found':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_ITEMS_FOUND'];
                            case 'quiz.media.item.count':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_ITEM_COUNT'];
                            case 'quiz.media.questions.answered':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_QUESTIONS_ANSWERED'];
                            case 'quiz.media.question.count':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_QUESTION_COUNT'];
                            case 'quiz.media.score':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_SCORE'];
                            case 'quiz.media.score.total':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_TOTAL_SCORE'];
                            case 'quiz.media.index':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_INDEX'];
                            case 'quiz.media.count':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_COUNT'];
                            case 'quiz.media.visited':
                                return TDV['Quiz']['PROPERTY']['PANORAMA_VISITED_COUNT'];
                            default:
                                var s = /quiz\.([\w_]+)\.(.+)/['exec'](k);
                                if (s) {
                                    q = s[0x1];
                                    switch ('quiz.' + s[0x2]) {
                                    case 'quiz.score':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['SCORE'];
                                    case 'quiz.score.total':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['TOTAL_SCORE'];
                                    case 'quiz.media.items.found':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_ITEMS_FOUND'];
                                    case 'quiz.media.item.count':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_ITEM_COUNT'];
                                    case 'quiz.media.questions.answered':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_QUESTIONS_ANSWERED'];
                                    case 'quiz.media.question.count':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_QUESTION_COUNT'];
                                    case 'quiz.questions.answered':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['QUESTIONS_ANSWERED'];
                                    case 'quiz.question.count':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['QUESTION_COUNT'];
                                    case 'quiz.items.found':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['ITEMS_FOUND'];
                                    case 'quiz.item.count':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['ITEM_COUNT'];
                                    case 'quiz.media.score':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_SCORE'];
                                    case 'quiz.media.score.total':
                                        return TDV['Quiz']['OBJECTIVE_PROPERTY']['PANORAMA_TOTAL_SCORE'];
                                    }
                                }
                            }
                        }());
                    if (m)
                        return function () {
                            var r = this['get']('data')['quiz'];
                            if (r) {
                                if (!c) {
                                    if (q != undefined) {
                                        if (q == 'global') {
                                            var s = this['get']('data')['quizConfig'], t = s['objectives'];
                                            for (var u = 0x0, v = t['length']; u < v; ++u) {
                                                r['bind'](TDV['Quiz']['EVENT_OBJECTIVE_PROPERTIES_CHANGE'], h['call'](this, t[u]['id'], m), this);
                                            }
                                        } else
                                            r['bind'](TDV['Quiz']['EVENT_OBJECTIVE_PROPERTIES_CHANGE'], h['call'](this, q, m), this);
                                    } else
                                        r['bind'](TDV['Quiz']['EVENT_PROPERTIES_CHANGE'], g['call'](this, m), this);
                                    c = !![];
                                }
                                try {
                                    var w = 0x0;
                                    if (q != undefined) {
                                        if (q == 'global') {
                                            var s = this['get']('data')['quizConfig'], t = s['objectives'];
                                            for (var u = 0x0, v = t['length']; u < v; ++u) {
                                                w += r['getObjective'](t[u]['id'], m);
                                            }
                                        } else
                                            w = r['getObjective'](q, m);
                                    } else {
                                        w = r['get'](m);
                                        if (m == TDV['Quiz']['PROPERTY']['PANORAMA_INDEX'])
                                            w += 0x1;
                                    }
                                    return w;
                                } catch (x) {
                                    return undefined;
                                }
                            }
                        };
                }
            }
            break;
        }
        return function () {
            return '';
        };
    }
    function e() {
        var k = this['get']('data');
        k['updateText'](k['translateObjs'][a], a['split']('.')[0x0]);
        let l = a['split']('.'), m = l[0x0] + '_vr';
        m in this && k['updateText'](k['translateObjs'][a], m);
    }
    function f(k) {
        var l = k['data']['nextSelectedIndex'];
        if (l >= 0x0) {
            var m = k['source']['get']('items')[l], n = function () {
                    m['unbind']('begin', n, this, !![]), e['call'](this);
                };
            m['bind']('begin', n, this, !![]);
        }
    }
    function g(k) {
        return function (l) {
            k in l && e['call'](this);
        }['bind'](this);
    }
    function h(k, l) {
        return function (m, n) {
            k == m && l in n && e['call'](this);
        }['bind'](this);
    }
    function i(k, l, m) {
        for (var n = 0x0; n < k['length']; ++n) {
            var o = k[n], p = o['get']('selectedIndex');
            if (p >= 0x0) {
                var q = l['split']('.'), r = o['get']('items')[p];
                if (m !== undefined && !m['call'](this, r))
                    continue;
                for (var s = 0x0; s < q['length']; ++s) {
                    if (r == undefined)
                        return '';
                    r = 'get' in r ? r['get'](q[s]) : r[q[s]];
                }
                return r;
            }
        }
        return '';
    }
    function j(k, l) {
        var m = l['get']('player');
        return m !== undefined && m['get']('viewerArea') == k;
    }
}
var script = {"start":"this.init()","id":"rootPlayer","data":{"locales":{"en":"locale/en.txt"},"name":"Player2017","textToSpeechConfig":{"pitch":1,"speechOnTooltip":false,"volume":1,"stopBackgroundAudio":false,"speechOnInfoWindow":false,"rate":1,"speechOnQuizQuestion":false},"defaultLocale":"en","displayTooltipInTouchScreens":true,"history":{}},"backgroundColor":["#FFFFFF"],"scrollBarMargin":2,"propagateClick":false,"hash": "8eeb9ab5ccbbb4e865414d4bc0ba48e1cb208dfdbdbf1a0ae44c94ccb8f33c0f", "definitions": [{"class":"Panorama","frames":[{"thumbnailUrl":"media/panorama_8D634515_86B9_7AE7_41CF_A26ECBB81F6C_t.webp","class":"CubicPanoramaFrame","cube":{"class":"ImageResource","levels":[{"colCount":18,"rowCount":3,"height":1536,"url":"media/panorama_8D634515_86B9_7AE7_41CF_A26ECBB81F6C_0/{face}/0/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","width":9216},{"colCount":12,"rowCount":2,"height":1024,"url":"media/panorama_8D634515_86B9_7AE7_41CF_A26ECBB81F6C_0/{face}/1/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","width":6144}]}}],"thumbnailUrl":"media/panorama_8D634515_86B9_7AE7_41CF_A26ECBB81F6C_t.webp","hfov":360,"id":"panorama_8D634515_86B9_7AE7_41CF_A26ECBB81F6C","vfov":180,"hfovMin":"150%","data":{"label":"Pano 3"},"label":trans('panorama_8D634515_86B9_7AE7_41CF_A26ECBB81F6C.label'),"hfovMax":130},{"id":"panorama_8AA8CD17_86B9_6AE3_41DD_F462A8FB0D9C_camera","class":"PanoramaCamera","enterPointingToHorizon":true,"initialSequence":"this.sequence_8D488900_86B9_6ADD_41B9_042A4FDA24A0","displayOriginPosition":{"pitch":-90,"hfov":165,"class":"RotationalCameraDisplayPosition","yaw":0,"stereographicFactor":1},"displayMovements":[{"duration":1000,"class":"TargetRotationalCameraDisplayMovement"},{"targetPitch":0,"duration":3000,"easing":"cubic_in_out","class":"TargetRotationalCameraDisplayMovement","targetStereographicFactor":0}],"initialPosition":{"pitch":0,"class":"PanoramaCameraPosition","yaw":0}},{"class":"PanoramaCamera","enterPointingToHorizon":true,"id":"panorama_BD807A56_B156_7060_41B7_AF664A7A9456_camera","initialSequence":"this.sequence_BD5624A2_B156_5023_41D7_D0B7FA919AA7","initialPosition":{"pitch":0,"class":"PanoramaCameraPosition","yaw":0}},{"class":"Panorama","frames":[{"thumbnailUrl":"media/panorama_BDC9E2D5_B156_D060_41E1_D7B9164F2D77_t.webp","class":"CubicPanoramaFrame","cube":{"class":"ImageResource","levels":[{"colCount":36,"rowCount":6,"height":3072,"url":"media/panorama_BDC9E2D5_B156_D060_41E1_D7B9164F2D77_0/{face}/0/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","width":18432},{"colCount":18,"rowCount":3,"height":1536,"url":"media/panorama_BDC9E2D5_B156_D060_41E1_D7B9164F2D77_0/{face}/1/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","width":9216},{"colCount":12,"rowCount":2,"height":1024,"url":"media/panorama_BDC9E2D5_B156_D060_41E1_D7B9164F2D77_0/{face}/2/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","width":6144}]}}],"thumbnailUrl":"media/panorama_BDC9E2D5_B156_D060_41E1_D7B9164F2D77_t.webp","hfov":360,"id":"panorama_BDC9E2D5_B156_D060_41E1_D7B9164F2D77","vfov":180,"data":{"label":"Pondicherry dron"},"label":trans('panorama_BDC9E2D5_B156_D060_41E1_D7B9164F2D77.label'),"hfovMax":130},{"class":"Panorama","frames":[{"thumbnailUrl":"media/panorama_8AA8CD17_86B9_6AE3_41DD_F462A8FB0D9C_t.webp","class":"CubicPanoramaFrame","cube":{"class":"ImageResource","levels":[{"colCount":18,"rowCount":3,"height":1536,"url":"media/panorama_8AA8CD17_86B9_6AE3_41DD_F462A8FB0D9C_0/{face}/0/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","width":9216},{"colCount":12,"rowCount":2,"height":1024,"url":"media/panorama_8AA8CD17_86B9_6AE3_41DD_F462A8FB0D9C_0/{face}/1/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","width":6144}]}}],"thumbnailUrl":"media/panorama_8AA8CD17_86B9_6AE3_41DD_F462A8FB0D9C_t.webp","hfov":360,"id":"panorama_8AA8CD17_86B9_6AE3_41DD_F462A8FB0D9C","vfov":180,"hfovMin":"150%","data":{"label":"Pano 1"},"label":trans('panorama_8AA8CD17_86B9_6AE3_41DD_F462A8FB0D9C.label'),"hfovMax":130},{"toolTipBackgroundColor":"#F6F6F6","progressOpacity":0.7,"progressRight":"33%","width":"100%","progressBarBorderColor":"#000000","playbackBarHeadShadowOpacity":0.7,"progressBarBackgroundColorDirection":"horizontal","toolTipFontFamily":"Arial","playbackBarHeadShadowVerticalLength":0,"toolTipBorderColor":"#767676","subtitlesFontFamily":"Arial","playbackBarProgressBackgroundColorRatios":[0],"vrPointerSelectionTime":2000,"playbackBarBorderColor":"#FFFFFF","toolTipPaddingBottom":4,"progressBarBackgroundColorRatios":[0],"progressBorderColor":"#000000","playbackBarProgressBorderColor":"#000000","playbackBarBorderRadius":0,"progressBarBackgroundColor":["#3399FF"],"subtitlesGap":0,"playbackBarHeadShadowHorizontalLength":0,"progressBackgroundColor":["#000000"],"playbackBarHeadBorderRadius":0,"surfaceReticleColor":"#FFFFFF","toolTipFontColor":"#606060","toolTipShadowColor":"#333138","progressBottom":10,"playbackBarHeadBorderColor":"#000000","playbackBarBackgroundOpacity":1,"playbackBarHeadShadowBlurRadius":3,"playbackBarBorderSize":0,"surfaceReticleSelectionColor":"#FFFFFF","progressBorderSize":0,"progressHeight":2,"vrPointerSelectionColor":"#FF6600","subtitlesTextShadowVerticalLength":1,"data":{"name":"Main Viewer"},"firstTransitionDuration":0,"playbackBarLeft":0,"progressBarBorderSize":0,"progressBarBorderRadius":2,"subtitlesBackgroundColor":"#000000","subtitlesTop":0,"subtitlesTextShadowHorizontalLength":1,"subtitlesTextShadowOpacity":1,"toolTipFontSize":"1.11vmin","playbackBarHeadHeight":15,"subtitlesFontColor":"#FFFFFF","toolTipPaddingLeft":6,"subtitlesTextShadowColor":"#000000","progressBorderRadius":2,"progressLeft":"33%","playbackBarHeadBackgroundColorRatios":[0,1],"playbackBarHeadShadow":true,"playbackBarHeadShadowColor":"#000000","playbackBarHeadBorderSize":0,"id":"MainViewer","subtitlesFontSize":"3vmin","propagateClick":false,"vrThumbstickRotationStep":20,"playbackBarHeadBackgroundColor":["#111111","#666666"],"toolTipPaddingRight":6,"vrPointerColor":"#FFFFFF","playbackBarBottom":5,"class":"ViewerArea","minHeight":50,"toolTipPaddingTop":4,"minWidth":100,"playbackBarBackgroundColor":["#FFFFFF"],"playbackBarHeight":10,"playbackBarHeadWidth":6,"playbackBarBackgroundColorDirection":"vertical","playbackBarRight":0,"subtitlesBackgroundOpacity":0.2,"subtitlesBorderColor":"#FFFFFF","subtitlesBottom":50,"playbackBarProgressBorderSize":0,"playbackBarProgressBackgroundColor":["#3399FF"],"height":"100%","playbackBarProgressBorderRadius":0,"toolTipTextShadowColor":"#000000","progressBackgroundColorRatios":[0]},{"class":"Video","id":"video_BD909C11_B156_57E0_41C0_585B747F5C5B","width":4096,"video":"this.videores_BDBDA82B_B156_3021_41B8_3792A2C03729","data":{"label":"Untitled 34"},"height":2048,"label":trans('video_BD909C11_B156_57E0_41C0_585B747F5C5B.label'),"thumbnailUrl":"media/video_BD909C11_B156_57E0_41C0_585B747F5C5B_t.webp"},{"aaEnabled":true,"arrowKeysAction":"translate","class":"PanoramaPlayer","touchControlMode":"drag_rotation","mouseControlMode":"drag_rotation","viewerArea":"this.MainViewer","displayPlaybackBar":true,"keepModel3DLoadedWithoutLocation":true,"id":"MainViewerPanoramaPlayer"},{"id":"mainPlayList","items":[{"camera":"this.panorama_8AA8CD17_86B9_6AE3_41DD_F462A8FB0D9C_camera","media":"this.panorama_8AA8CD17_86B9_6AE3_41DD_F462A8FB0D9C","class":"PanoramaPlayListItem","player":"this.MainViewerPanoramaPlayer","begin":"this.setEndToItemIndex(this.mainPlayList, 0, 1)"},{"media":"this.video_BD909C11_B156_57E0_41C0_585B747F5C5B","class":"VideoPlayListItem","player":"this.MainViewerVideoPlayer","begin":"this.fixTogglePlayPauseButton(this.MainViewerVideoPlayer); this.setEndToItemIndex(this.mainPlayList, 1, 2)","start":"this.MainViewerVideoPlayer.set('displayPlaybackBar', true); this.MainViewerVideoPlayer.set('displayPlayOverlay', true); this.MainViewerVideoPlayer.set('clickAction', 'play_pause'); this.changeBackgroundWhilePlay(this.mainPlayList, 1, '#000000'); this.pauseGlobalAudiosWhilePlayItem(this.mainPlayList, 1)"},{"camera":"this.panorama_8D64012D_86B9_7D27_41B6_9885332C5CA7_camera","media":"this.panorama_8D64012D_86B9_7D27_41B6_9885332C5CA7","class":"PanoramaPlayListItem","player":"this.MainViewerPanoramaPlayer","begin":"this.setEndToItemIndex(this.mainPlayList, 2, 3)"},{"camera":"this.panorama_8D634515_86B9_7AE7_41CF_A26ECBB81F6C_camera","media":"this.panorama_8D634515_86B9_7AE7_41CF_A26ECBB81F6C","class":"PanoramaPlayListItem","player":"this.MainViewerPanoramaPlayer","begin":"this.setEndToItemIndex(this.mainPlayList, 3, 4)"},{"camera":"this.panorama_BD807A56_B156_7060_41B7_AF664A7A9456_camera","media":"this.panorama_BD807A56_B156_7060_41B7_AF664A7A9456","class":"PanoramaPlayListItem","player":"this.MainViewerPanoramaPlayer","begin":"this.setEndToItemIndex(this.mainPlayList, 4, 5)"},{"camera":"this.panorama_BDC9E2D5_B156_D060_41E1_D7B9164F2D77_camera","media":"this.panorama_BDC9E2D5_B156_D060_41E1_D7B9164F2D77","class":"PanoramaPlayListItem","end":"this.trigger('tourEnded')","player":"this.MainViewerPanoramaPlayer","begin":"this.setEndToItemIndex(this.mainPlayList, 5, 0)"}],"class":"PlayList"},{"displayPlayOverlay":true,"viewerArea":"this.MainViewer","class":"VideoPlayer","id":"MainViewerVideoPlayer","displayPlaybackBar":true,"clickAction":"play_pause"},{"class":"Panorama","frames":[{"thumbnailUrl":"media/panorama_8D64012D_86B9_7D27_41B6_9885332C5CA7_t.webp","class":"CubicPanoramaFrame","cube":{"class":"ImageResource","levels":[{"colCount":18,"rowCount":3,"height":1536,"url":"media/panorama_8D64012D_86B9_7D27_41B6_9885332C5CA7_0/{face}/0/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","width":9216},{"colCount":12,"rowCount":2,"height":1024,"url":"media/panorama_8D64012D_86B9_7D27_41B6_9885332C5CA7_0/{face}/1/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","width":6144}]}}],"thumbnailUrl":"media/panorama_8D64012D_86B9_7D27_41B6_9885332C5CA7_t.webp","hfov":360,"id":"panorama_8D64012D_86B9_7D27_41B6_9885332C5CA7","vfov":180,"hfovMin":"150%","data":{"label":"Pano 2"},"label":trans('panorama_8D64012D_86B9_7D27_41B6_9885332C5CA7.label'),"hfovMax":130},{"class":"PanoramaCamera","enterPointingToHorizon":true,"id":"panorama_8D634515_86B9_7AE7_41CF_A26ECBB81F6C_camera","initialSequence":"this.sequence_8D4C0901_86B9_6ADF_41C8_D42210AEE28C","initialPosition":{"pitch":0,"class":"PanoramaCameraPosition","yaw":0}},{"class":"PanoramaCamera","enterPointingToHorizon":true,"id":"panorama_BDC9E2D5_B156_D060_41E1_D7B9164F2D77_camera","initialSequence":"this.sequence_BAAC8B6A_B156_D020_41E4_849E1B08F855","initialPosition":{"pitch":0,"class":"PanoramaCameraPosition","yaw":0}},{"class":"PanoramaCamera","enterPointingToHorizon":true,"id":"panorama_8D64012D_86B9_7D27_41B6_9885332C5CA7_camera","initialSequence":"this.sequence_8D4C2901_86B9_6ADF_41C9_8516BDCD6C28","initialPosition":{"pitch":0,"class":"PanoramaCameraPosition","yaw":0}},{"class":"Panorama","frames":[{"thumbnailUrl":"media/panorama_BD807A56_B156_7060_41B7_AF664A7A9456_t.webp","class":"CubicPanoramaFrame","cube":{"class":"ImageResource","levels":[{"colCount":36,"rowCount":6,"height":3072,"url":"media/panorama_BD807A56_B156_7060_41B7_AF664A7A9456_0/{face}/0/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","width":18432},{"colCount":18,"rowCount":3,"height":1536,"url":"media/panorama_BD807A56_B156_7060_41B7_AF664A7A9456_0/{face}/1/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","width":9216},{"colCount":12,"rowCount":2,"height":1024,"url":"media/panorama_BD807A56_B156_7060_41B7_AF664A7A9456_0/{face}/2/{row}_{column}.webp","class":"TiledImageResourceLevel","tags":"ondemand","width":6144}]}}],"thumbnailUrl":"media/panorama_BD807A56_B156_7060_41B7_AF664A7A9456_t.webp","hfov":360,"id":"panorama_BD807A56_B156_7060_41B7_AF664A7A9456","vfov":180,"hfovMin":"120%","data":{"label":"DJI_0491-copy"},"label":trans('panorama_BD807A56_B156_7060_41B7_AF664A7A9456.label'),"hfovMax":130},{"class":"PanoramaCameraSequence","id":"sequence_8D488900_86B9_6ADD_41B9_042A4FDA24A0","movements":[{"yawSpeed":7.96,"yawDelta":18.5,"easing":"cubic_in","class":"DistancePanoramaCameraMovement"},{"yawSpeed":7.96,"yawDelta":323,"class":"DistancePanoramaCameraMovement"},{"yawSpeed":7.96,"yawDelta":18.5,"easing":"cubic_out","class":"DistancePanoramaCameraMovement"}]},{"class":"PanoramaCameraSequence","id":"sequence_BD5624A2_B156_5023_41D7_D0B7FA919AA7","movements":[{"yawSpeed":7.96,"yawDelta":18.5,"easing":"cubic_in","class":"DistancePanoramaCameraMovement"},{"yawSpeed":7.96,"yawDelta":323,"class":"DistancePanoramaCameraMovement"},{"yawSpeed":7.96,"yawDelta":18.5,"easing":"cubic_out","class":"DistancePanoramaCameraMovement"}]},{"height":2036,"class":"VideoResource","id":"videores_BDBDA82B_B156_3021_41B8_3792A2C03729","hasAudio":false,"width":4072,"levels":["this.videolevel_BDA1183C_B156_3020_41E2_D02367FD7746"]},{"class":"PanoramaCameraSequence","id":"sequence_8D4C0901_86B9_6ADF_41C8_D42210AEE28C","movements":[{"yawSpeed":7.96,"yawDelta":18.5,"easing":"cubic_in","class":"DistancePanoramaCameraMovement"},{"yawSpeed":7.96,"yawDelta":323,"class":"DistancePanoramaCameraMovement"},{"yawSpeed":7.96,"yawDelta":18.5,"easing":"cubic_out","class":"DistancePanoramaCameraMovement"}]},{"class":"PanoramaCameraSequence","id":"sequence_BAAC8B6A_B156_D020_41E4_849E1B08F855","movements":[{"yawSpeed":7.96,"yawDelta":18.5,"easing":"cubic_in","class":"DistancePanoramaCameraMovement"},{"yawSpeed":7.96,"yawDelta":323,"class":"DistancePanoramaCameraMovement"},{"yawSpeed":7.96,"yawDelta":18.5,"easing":"cubic_out","class":"DistancePanoramaCameraMovement"}]},{"class":"PanoramaCameraSequence","id":"sequence_8D4C2901_86B9_6ADF_41C9_8516BDCD6C28","movements":[{"yawSpeed":7.96,"yawDelta":18.5,"easing":"cubic_in","class":"DistancePanoramaCameraMovement"},{"yawSpeed":7.96,"yawDelta":323,"class":"DistancePanoramaCameraMovement"},{"yawSpeed":7.96,"yawDelta":18.5,"easing":"cubic_out","class":"DistancePanoramaCameraMovement"}]},{"framerate":30,"codec":"h264","height":2036,"class":"VideoResourceLevel","bitrate":13755,"type":"video/mp4","url":trans('videolevel_BDA1183C_B156_3020_41E2_D02367FD7746.url'),"posterURL":trans('videolevel_BDA1183C_B156_3020_41E2_D02367FD7746.posterURL'),"id":"videolevel_BDA1183C_B156_3020_41E2_D02367FD7746","width":4072}],"scripts":{"changePlayListWithSameSpot":TDV.Tour.Script.changePlayListWithSameSpot,"historyGoBack":TDV.Tour.Script.historyGoBack,"getCurrentPlayers":TDV.Tour.Script.getCurrentPlayers,"showPopupPanoramaOverlay":TDV.Tour.Script.showPopupPanoramaOverlay,"getMediaHeight":TDV.Tour.Script.getMediaHeight,"pauseGlobalAudiosWhilePlayItem":TDV.Tour.Script.pauseGlobalAudiosWhilePlayItem,"getOverlays":TDV.Tour.Script.getOverlays,"setMainMediaByIndex":TDV.Tour.Script.setMainMediaByIndex,"toggleMeasurement":TDV.Tour.Script.toggleMeasurement,"toggleTextToSpeechComponent":TDV.Tour.Script.toggleTextToSpeechComponent,"keepCompVisible":TDV.Tour.Script.keepCompVisible,"textToSpeech":TDV.Tour.Script.textToSpeech,"setSurfaceSelectionHotspotMode":TDV.Tour.Script.setSurfaceSelectionHotspotMode,"toggleVR":TDV.Tour.Script.toggleVR,"clone":TDV.Tour.Script.clone,"setValue":TDV.Tour.Script.setValue,"stopAndGoCamera":TDV.Tour.Script.stopAndGoCamera,"isPanorama":TDV.Tour.Script.isPanorama,"syncPlaylists":TDV.Tour.Script.syncPlaylists,"openLink":TDV.Tour.Script.openLink,"textToSpeechComponent":TDV.Tour.Script.textToSpeechComponent,"getRootOverlay":TDV.Tour.Script.getRootOverlay,"disableVR":TDV.Tour.Script.disableVR,"getPlayListWithItem":TDV.Tour.Script.getPlayListWithItem,"setStartTimeVideoSync":TDV.Tour.Script.setStartTimeVideoSync,"getPlayListItems":TDV.Tour.Script.getPlayListItems,"getPixels":TDV.Tour.Script.getPixels,"_initTTSTooltips":TDV.Tour.Script._initTTSTooltips,"showPopupImage":TDV.Tour.Script.showPopupImage,"initAnalytics":TDV.Tour.Script.initAnalytics,"initOverlayGroupRotationOnClick":TDV.Tour.Script.initOverlayGroupRotationOnClick,"changeBackgroundWhilePlay":TDV.Tour.Script.changeBackgroundWhilePlay,"cloneBindings":TDV.Tour.Script.cloneBindings,"clonePanoramaCamera":TDV.Tour.Script.clonePanoramaCamera,"getPanoramaOverlaysByTags":TDV.Tour.Script.getPanoramaOverlaysByTags,"quizSetItemFound":TDV.Tour.Script.quizSetItemFound,"setOverlaysVisibility":TDV.Tour.Script.setOverlaysVisibility,"mixObject":TDV.Tour.Script.mixObject,"isCardboardViewMode":TDV.Tour.Script.isCardboardViewMode,"changeOpacityWhilePlay":TDV.Tour.Script.changeOpacityWhilePlay,"setMapLocation":TDV.Tour.Script.setMapLocation,"registerKey":TDV.Tour.Script.registerKey,"playGlobalAudioWhilePlay":TDV.Tour.Script.playGlobalAudioWhilePlay,"quizShowQuestion":TDV.Tour.Script.quizShowQuestion,"updateDeepLink":TDV.Tour.Script.updateDeepLink,"initQuiz":TDV.Tour.Script.initQuiz,"autotriggerAtStart":TDV.Tour.Script.autotriggerAtStart,"resumeGlobalAudios":TDV.Tour.Script.resumeGlobalAudios,"triggerOverlay":TDV.Tour.Script.triggerOverlay,"setPanoramaCameraWithSpot":TDV.Tour.Script.setPanoramaCameraWithSpot,"unregisterKey":TDV.Tour.Script.unregisterKey,"getKey":TDV.Tour.Script.getKey,"_initItemWithComps":TDV.Tour.Script._initItemWithComps,"setModel3DCameraWithCurrentSpot":TDV.Tour.Script.setModel3DCameraWithCurrentSpot,"updateIndexGlobalZoomImage":TDV.Tour.Script.updateIndexGlobalZoomImage,"init":TDV.Tour.Script.init,"getMediaByName":TDV.Tour.Script.getMediaByName,"updateVideoCues":TDV.Tour.Script.updateVideoCues,"setStartTimeVideo":TDV.Tour.Script.setStartTimeVideo,"setObjectsVisibilityByTags":TDV.Tour.Script.setObjectsVisibilityByTags,"fixTogglePlayPauseButton":TDV.Tour.Script.fixTogglePlayPauseButton,"getMediaByTags":TDV.Tour.Script.getMediaByTags,"_getObjectsByTags":TDV.Tour.Script._getObjectsByTags,"pauseCurrentPlayers":TDV.Tour.Script.pauseCurrentPlayers,"stopGlobalAudio":TDV.Tour.Script.stopGlobalAudio,"setEndToItemIndex":TDV.Tour.Script.setEndToItemIndex,"getFirstPlayListWithMedia":TDV.Tour.Script.getFirstPlayListWithMedia,"showPopupPanoramaVideoOverlay":TDV.Tour.Script.showPopupPanoramaVideoOverlay,"_getPlayListsWithViewer":TDV.Tour.Script._getPlayListsWithViewer,"copyToClipboard":TDV.Tour.Script.copyToClipboard,"getMediaFromPlayer":TDV.Tour.Script.getMediaFromPlayer,"enableVR":TDV.Tour.Script.enableVR,"setObjectsVisibilityByID":TDV.Tour.Script.setObjectsVisibilityByID,"copyObjRecursively":TDV.Tour.Script.copyObjRecursively,"getPlayListsWithMedia":TDV.Tour.Script.getPlayListsWithMedia,"downloadFile":TDV.Tour.Script.downloadFile,"executeFunctionWhenChange":TDV.Tour.Script.executeFunctionWhenChange,"getOverlaysByGroupname":TDV.Tour.Script.getOverlaysByGroupname,"setPlayListSelectedIndex":TDV.Tour.Script.setPlayListSelectedIndex,"getModel3DInnerObject":TDV.Tour.Script.getModel3DInnerObject,"existsKey":TDV.Tour.Script.existsKey,"setComponentsVisibilityByTags":TDV.Tour.Script.setComponentsVisibilityByTags,"setDirectionalPanoramaAudio":TDV.Tour.Script.setDirectionalPanoramaAudio,"unloadViewer":TDV.Tour.Script.unloadViewer,"quizResumeTimer":TDV.Tour.Script.quizResumeTimer,"getOverlaysByTags":TDV.Tour.Script.getOverlaysByTags,"createTweenModel3D":TDV.Tour.Script.createTweenModel3D,"showPopupMedia":TDV.Tour.Script.showPopupMedia,"executeJS":TDV.Tour.Script.executeJS,"getActiveMediaWithViewer":TDV.Tour.Script.getActiveMediaWithViewer,"getPanoramaOverlayByName":TDV.Tour.Script.getPanoramaOverlayByName,"quizShowScore":TDV.Tour.Script.quizShowScore,"playGlobalAudioWhilePlayActiveMedia":TDV.Tour.Script.playGlobalAudioWhilePlayActiveMedia,"setObjectsVisibility":TDV.Tour.Script.setObjectsVisibility,"quizShowTimeout":TDV.Tour.Script.quizShowTimeout,"playGlobalAudio":TDV.Tour.Script.playGlobalAudio,"updateMediaLabelFromPlayList":TDV.Tour.Script.updateMediaLabelFromPlayList,"stopTextToSpeech":TDV.Tour.Script.stopTextToSpeech,"getStateTextToSpeech":TDV.Tour.Script.getStateTextToSpeech,"getComponentsByTags":TDV.Tour.Script.getComponentsByTags,"pauseGlobalAudio":TDV.Tour.Script.pauseGlobalAudio,"takeScreenshot":TDV.Tour.Script.takeScreenshot,"getActivePlayerWithViewer":TDV.Tour.Script.getActivePlayerWithViewer,"createTween":TDV.Tour.Script.createTween,"setMainMediaByName":TDV.Tour.Script.setMainMediaByName,"cleanSelectedMeasurements":TDV.Tour.Script.cleanSelectedMeasurements,"getCurrentPlayerWithMedia":TDV.Tour.Script.getCurrentPlayerWithMedia,"getMediaWidth":TDV.Tour.Script.getMediaWidth,"shareSocial":TDV.Tour.Script.shareSocial,"loadFromCurrentMediaPlayList":TDV.Tour.Script.loadFromCurrentMediaPlayList,"visibleComponentsIfPlayerFlagEnabled":TDV.Tour.Script.visibleComponentsIfPlayerFlagEnabled,"setPanoramaCameraWithCurrentSpot":TDV.Tour.Script.setPanoramaCameraWithCurrentSpot,"startModel3DWithCameraSpot":TDV.Tour.Script.startModel3DWithCameraSpot,"historyGoForward":TDV.Tour.Script.historyGoForward,"restartTourWithoutInteraction":TDV.Tour.Script.restartTourWithoutInteraction,"setMeasurementsVisibility":TDV.Tour.Script.setMeasurementsVisibility,"getQuizTotalObjectiveProperty":TDV.Tour.Script.getQuizTotalObjectiveProperty,"sendAnalyticsData":TDV.Tour.Script.sendAnalyticsData,"assignObjRecursively":TDV.Tour.Script.assignObjRecursively,"isComponentVisible":TDV.Tour.Script.isComponentVisible,"toggleMeasurementsVisibility":TDV.Tour.Script.toggleMeasurementsVisibility,"setComponentVisibility":TDV.Tour.Script.setComponentVisibility,"_initTwinsViewer":TDV.Tour.Script._initTwinsViewer,"setModel3DCameraSequence":TDV.Tour.Script.setModel3DCameraSequence,"showWindow":TDV.Tour.Script.showWindow,"setCameraSameSpotAsMedia":TDV.Tour.Script.setCameraSameSpotAsMedia,"setOverlaysVisibilityByTags":TDV.Tour.Script.setOverlaysVisibilityByTags,"setModel3DCameraSpot":TDV.Tour.Script.setModel3DCameraSpot,"cleanAllMeasurements":TDV.Tour.Script.cleanAllMeasurements,"getComponentByName":TDV.Tour.Script.getComponentByName,"stopGlobalAudios":TDV.Tour.Script.stopGlobalAudios,"quizFinish":TDV.Tour.Script.quizFinish,"skip3DTransitionOnce":TDV.Tour.Script.skip3DTransitionOnce,"getAudioByTags":TDV.Tour.Script.getAudioByTags,"resumePlayers":TDV.Tour.Script.resumePlayers,"quizStart":TDV.Tour.Script.quizStart,"showComponentsWhileMouseOver":TDV.Tour.Script.showComponentsWhileMouseOver,"startPanoramaWithCamera":TDV.Tour.Script.startPanoramaWithCamera,"pauseGlobalAudios":TDV.Tour.Script.pauseGlobalAudios,"getMainViewer":TDV.Tour.Script.getMainViewer,"translate":TDV.Tour.Script.translate,"executeAudioAction":TDV.Tour.Script.executeAudioAction,"quizPauseTimer":TDV.Tour.Script.quizPauseTimer,"getActivePlayersWithViewer":TDV.Tour.Script.getActivePlayersWithViewer,"getPlayListItemByMedia":TDV.Tour.Script.getPlayListItemByMedia,"startMeasurement":TDV.Tour.Script.startMeasurement,"getPlayListItemIndexByMedia":TDV.Tour.Script.getPlayListItemIndexByMedia,"executeAudioActionByTags":TDV.Tour.Script.executeAudioActionByTags,"setMediaBehaviour":TDV.Tour.Script.setMediaBehaviour,"startPanoramaWithModel":TDV.Tour.Script.startPanoramaWithModel,"_initSplitViewer":TDV.Tour.Script._initSplitViewer,"setOverlayBehaviour":TDV.Tour.Script.setOverlayBehaviour,"showWindowBase":TDV.Tour.Script.showWindowBase,"setLocale":TDV.Tour.Script.setLocale,"htmlToPlainText":TDV.Tour.Script.htmlToPlainText,"setMeasurementUnits":TDV.Tour.Script.setMeasurementUnits,"getGlobalAudio":TDV.Tour.Script.getGlobalAudio,"openEmbeddedPDF":TDV.Tour.Script.openEmbeddedPDF,"playAudioList":TDV.Tour.Script.playAudioList,"stopMeasurement":TDV.Tour.Script.stopMeasurement},"layout":"absolute","class":"Player","minHeight":0,"minWidth":0,"gap":10,"backgroundColorRatios":[0],"watermark":false,"scrollBarColor":"#000000","height":"100%","width":"100%","defaultMenu":["fullscreen","mute","rotation"],"children":["this.MainViewer"]};
if (script['data'] == undefined)
    script['data'] = {};
script['data']['translateObjs'] = translateObjs, script['data']['createQuizConfig'] = function () {
    let a = {}, b = this['get']('data')['translateObjs'];
    for (const c in translateObjs) {
        if (!b['hasOwnProperty'](c))
            b[c] = translateObjs[c];
    }
    return a;
}, TDV['PlayerAPI']['defineScript'](script);
//# sourceMappingURL=script_device.js.map
})();
//Generated with v2026.1.0, Thu Jul 30 2026