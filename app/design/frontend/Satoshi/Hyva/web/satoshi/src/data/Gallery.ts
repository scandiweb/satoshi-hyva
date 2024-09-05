export type VideoData = {
    id: string;
    type: 'youtube' | 'vimeo';
    useYoutubeNoCookie?: boolean;
}

export const Gallery = (images: any) => <any>{
    activeVideoType: false,
    playingVideoIndexes: [],
    images: JSON.parse(images),

    activateVideo(index: number) {
        console.log(index)
        console.log(this.images);
        const videoData: VideoData | false = this.getVideoData(index);

        if (!videoData) {
            return;
        }

        this.activeVideoType = videoData.type;
        this.playingVideoIndexes.push(index);

        if (videoData.type === 'youtube') {
            this.initYoutubeAPI(videoData, index);
        } else if (videoData.type === 'vimeo') {
            this.initVimeoVideo(videoData, index);
        }
    },
    getVideoData(index: number): VideoData | false {
        const videoUrl = this.images[index] && this.images[index].videoUrl;

        if (!videoUrl) {
            return false;
        }

        let id: string | undefined;
        let type: 'youtube' | 'vimeo' | undefined;
        let youtubeRegex: RegExp | undefined;
        let vimeoRegex: RegExp | undefined;
        let useYoutubeNoCookie = false;

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

        return id && type ? {
            id: id,
            type: type,
            useYoutubeNoCookie: useYoutubeNoCookie
        } : false;
    },
    initYoutubeAPI(videoData: VideoData, index: number) {
        if (!window?.YT) {
            const loadYoutubeAPI = document.createElement('script');
            loadYoutubeAPI.src = 'https://www.youtube.com/iframe_api';
            loadYoutubeAPI.id = 'loadYoutubeAPI';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(loadYoutubeAPI, firstScriptTag);
        }

        const initializePlayer = () => {
            const params = {
                "autoplay": true
            };

            const host = videoData.useYoutubeNoCookie ?
                'https://www.youtube-nocookie.com' :
                'https://www.youtube.com';

            const ytPlayer = window.YT as { Player: new (elementId: string, options: any) => any };
            window[`youtubePlayer${index}`] = new ytPlayer.Player(`youtube-player-${index}`, {
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

    initVimeoVideo(videoData: VideoData, index: number) {
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
