import type {Magics} from "alpinejs";

export type AccordionType = {
    [key: string | symbol]: any;

    _buttonRef: HTMLElement | null;
    _panelRef: HTMLElement | null;
    _iconRef: HTMLElement | null;

    isExpanded: boolean;
    duration: number;

    init(): void;
    _initElements(): void;
    _toggle(): void;
    _update(): void;
} & Magics<{}>;

export const InitGallery = (images: any) => <any>{
    activeVideoType: false,
    playingVideoIndexes: [],
    images: JSON.parse(images),

    activateVideo(index) {
        const videoData = this.getVideoData(index);

        if (!videoData) {
            return;
        }

        this.activeVideoType = videoData.type;
        this.playingVideoIndexes.push(index);

        if (videoData.type === "youtube") {
            this.initYoutubeAPI(videoData, index);
        } else if (videoData.type === "vimeo") {
            this.initVimeoVideo(videoData, index);
        }
    },
    getVideoData(index) {
        const videoUrl = this.images[index] && this.images[index].videoUrl;

        if (!videoUrl) {
            return;
        }

        let id, type, youtubeRegex, vimeoRegex, useYoutubeNoCookie = false;

        if (videoUrl.match(/youtube\.com|youtu\.be|youtube-nocookie.com/)) {
            id = videoUrl.replace(/^\/(embed\/|v\/)?/, '').replace(/\/.*/, '');
            type = 'youtube';

            youtubeRegex = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
            id = videoUrl.match(youtubeRegex)[1];

            if (videoUrl.match(/youtube-nocookie.com/)) {
                useYoutubeNoCookie = true;
            }
        } else if (videoUrl.match(/vimeo\.com/)) {
            type = 'vimeo';
            vimeoRegex = new RegExp(['https?:\\/\\/(?:www\\.|player\\.)?vimeo.com\\/(?:channels\\/(?:\\w+\\/)',
                '?|groups\\/([^\\/]*)\\/videos\\/|album\\/(\\d+)\\/video\\/|video\\/|)(\\d+)(?:$|\\/|\\?)'
            ].join(''));
            id = videoUrl.match(vimeoRegex)[3];
        }

        return id ? {
            id: id, type: type, useYoutubeNoCookie: useYoutubeNoCookie
        } : false;
    },
    initYoutubeAPI(videoData, index) {
        if (!window.YT) {
            const loadYoutubeAPI = document.createElement('script');
            loadYoutubeAPI.src = 'https://www.youtube.com/iframe_api';
            loadYoutubeAPI.id = 'loadYoutubeAPI';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(loadYoutubeAPI, firstScriptTag);
        }

        const initializePlayer = () => {
            const params = {
                "autoplay": true
            };

            const host = videoData.useYoutubeNoCookie ?
                'https://www.youtube-nocookie.com' :
                'https://www.youtube.com';

            if (!this.relatedVideos) {
                params.rel = 0;
            }

            window[`youtubePlayer${index}`] = new YT.Player(`youtube-player-${index}`, {
                host: host,
                videoId: videoData.id,
                playerVars: params
            });
        };

        if (window.YT && window.YT.Player) {
            initializePlayer();
        } else {
            const previousOnYouTubeIframeAPIReady = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = function () {
                if (previousOnYouTubeIframeAPIReady) {
                    previousOnYouTubeIframeAPIReady();
                }
                initializePlayer();
            };
        }
    },

    initVimeoVideo(videoData, index) {
        let additionalParams = '&autoplay=1';
        let src = '';

        const timestamp = new Date().getTime();
        const vimeoContainer = document.getElementById(`vimeo-player-${index}`);
        const videoId = videoData.id;

        if (!vimeoContainer || !videoId) return;

        if (this.loopVideo) {
            additionalParams += '&loop=1';
        }
        src = 'https://player.vimeo.com/video/' +
            videoId + '?api=1&player_id=vimeo' +
            videoId +
            timestamp +
            additionalParams;
        vimeoContainer.innerHTML =
            `<iframe id="${'vimeo' + videoId + timestamp}"
                        src="${src}"
                        width="640" height="360"
                        webkitallowfullscreen
                        mozallowfullscreen
                        allowfullscreen
                        referrerPolicy="origin"
                        allow="autoplay"
                        class="object-center w-full h-full object-fit"
                     ></iframe>`;

        this.vimeoPlayer = vimeoContainer.childNodes[0];
    },
}
