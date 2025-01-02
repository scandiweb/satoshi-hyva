export type VideoData = {
  id: string;
  type: "youtube" | "vimeo";
  useYoutubeNoCookie?: boolean;
};

export type ImageData = {
  caption: string;
  full: string;
  img: string;
  isMain: boolean;
  position: string;
  thumb: string;
  type: string;
  videoUrl: string | null;
};

export type GalleryType = {
  activeVideoType: string | false;
  initialImages: ImageData[];
  images: ImageData[];
  appendOnReceiveImages: boolean;
  loopVideo: boolean;
  vimeoPlayer: any;
  eventListeners: Record<string, Function>;

  activateVideo(position: number): void;
  getVideoData(position: number): VideoData | false;
  initYoutubeAPI(videoData: VideoData, position: number): void;
  initVimeoVideo(videoData: VideoData, position: number): void;
  receiveImages(images: ImageData[]): void;
};

export const Gallery = (
  images: string,
  appendOnReceiveImages: boolean,
  loopVideo: boolean
) =>
  <GalleryType>{
    activeVideoType: false,
    initialImages: JSON.parse(images),
    images: JSON.parse(images),
    appendOnReceiveImages,
    loopVideo,
    vimeoPlayer: null,
    eventListeners: {
      ["@update-gallery.window"](event: CustomEvent) {
        const { productId, images } = event.detail || {};
        if (productId === this.productId) {
          this.receiveImages(images);
        }
      },
      ["@reset-gallery.window"](event: CustomEvent) {
        const { productId } = event.detail || {};
        if (productId === this.productId) {
          this.images = this.initialImages;
        }
      },
    },

    activateVideo(position: number) {
      const videoData = this.getVideoData(position);

      if (!videoData) {
        return;
      }

      this.activeVideoType = videoData.type;

      if (videoData.type === "youtube") {
        this.initYoutubeAPI(videoData, position);
      } else if (videoData.type === "vimeo") {
        this.initVimeoVideo(videoData, position);
      }
    },

    getVideoData(position: number) {
      const image = this.images.find(
        (image) => Number(image.position) == position
      );
      const videoUrl = image ? image.videoUrl : false;

      if (!videoUrl) {
        return false;
      }

      let id,
        type,
        youtubeRegex,
        vimeoRegex,
        useYoutubeNoCookie = false;

      if (videoUrl.match(/youtube\.com|youtu\.be|youtube-nocookie.com/)) {
        id = videoUrl.replace(/^\/(embed\/|v\/)?/, "").replace(/\/.*/, "");
        type = "youtube";

        youtubeRegex =
          /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
        id = videoUrl.match(youtubeRegex)?.[1];

        if (videoUrl.match(/youtube-nocookie.com/)) {
          useYoutubeNoCookie = true;
        }
      } else if (videoUrl.match(/vimeo\.com/)) {
        type = "vimeo";
        vimeoRegex = new RegExp(
          [
            "https?:\\/\\/(?:www\\.|player\\.)?vimeo.com\\/(?:channels\\/(?:\\w+\\/)",
            "?|groups\\/([^\\/]*)\\/videos\\/|album\\/(\\d+)\\/video\\/|video\\/|)(\\d+)(?:$|\\/|\\?)",
          ].join("")
        );
        id = videoUrl.match(vimeoRegex)?.[3];
      }

      return id && type
        ? {
            id: id,
            type: type,
            useYoutubeNoCookie: useYoutubeNoCookie,
          }
        : false;
    },

    initYoutubeAPI(videoData: VideoData, position: number) {
      const isMobile = Alpine.store('main').isMobile;

      if (!window?.YT) {
        const loadYoutubeAPI = document.createElement("script");
        loadYoutubeAPI.src = "https://www.youtube.com/iframe_api";
        loadYoutubeAPI.id = "loadYoutubeAPI";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(loadYoutubeAPI, firstScriptTag);
      }

      const initializePlayer = () => {
        const params = {
          autoplay: true,
        };

        const host = videoData.useYoutubeNoCookie
          ? "https://www.youtube-nocookie.com"
          : "https://www.youtube.com";

        const ytPlayer = window.YT as {
          Player: new (elementId: string, options: any) => any;
        };
        window[`youtubePlayer-${position}`] = new ytPlayer.Player(
          `${isMobile ? 'mobile' : 'desktop'}-youtube-player-${position}`,
          {
            host: host,
            videoId: videoData.id,
            playerVars: params,
          }
        );
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

    initVimeoVideo(videoData: VideoData, position: number) {
      const isMobile = Alpine.store('main').isMobile;
      let additionalParams = "&autoplay=1";
      let src = "";

      const timestamp = new Date().getTime();
      const vimeoContainer = document.getElementById(
        `${isMobile ? 'mobile' : 'desktop'}-vimeo-player-${position}`
      );
      const videoId = videoData.id;

      if (!vimeoContainer || !videoId) return;

      if (this.loopVideo) {
        additionalParams += "&loop=1";
      }
      src =
        "https://player.vimeo.com/video/" +
        videoId +
        "?api=1&player_id=vimeo" +
        videoId +
        timestamp +
        additionalParams;
      vimeoContainer.innerHTML = `<iframe id="${"vimeo" + videoId + timestamp}"
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

    receiveImages(images: ImageData[]) {
      if (this.appendOnReceiveImages) {
        const newImages = images.filter(
          (img) => !this.initialImages.find((image) => image.img === img.img)
        );

        if (newImages.length) {
          this.images = [...newImages, ...this.initialImages];
        } else {
          this.images = this.initialImages;
        }
      } else {
        this.images = images;
      }
    },
  };
