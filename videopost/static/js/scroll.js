const { createApp, ref, reactive, computed, onMounted, watch, watchEffect, nextTick } = Vue;
const { useDebounceFn, useElementVisibility, useEventListener } = VueUse;
import { fetchVideo, isSmartPhone, retryable, validateCloudinaryUrl } from './utils.js'

const pagenationNumber = 5

const infiniteScroll = createApp({
  setup() {
    const
      tutorialFlag = ref(true),
      onTutorialClick = () => {
        tutorialFlag.value = false;
        currentVideoElement.value.play()
      }

    const
      loadElement = ref(undefined),
      searchTags = computed(() => {
        if (loadElement.value) {
          return loadElement.value.getAttribute("data-tags")
        }
        return undefined
      }),
      shareVideo = computed(() => {
        if (loadElement.value) {
          return loadElement.value.getAttribute("data-video")
        }
        return undefined
      }),
      dataList = ref([]),
      blobVideos = reactive([]),

      addVideos = async () => {
        const page = (dataList.value.length / pagenationNumber) + 1
        console.log(page)
        const videoList = await getPagenation(page, searchTags.value, shareVideo.value)
        dataList.value.push(...videoList)
        videoList.forEach(async video => {
          if (isSmartPhone()) {
            blobVideos.push(validateCloudinaryUrl(video.video))
          }
          else {
            const url = await retryable(3, fetchVideo, video.video)
            blobVideos.push(url)
          }
        })
        setTimeout(() => {
          const videoElementList = Array.from(document.querySelectorAll(".infinite-item > video"))
          videoElementList.forEach(ele => {
            if (!(videoElementVisibilities.map(ele => { return ele.element }).includes(ele))) {
              ele.load()
              ele.addEventListener("loadeddata", event => console.log(event))
              videoElementVisibilities.push({ element: ele, visibility: useElementVisibility(ele) })
              watch(videoElementVisibilities.slice(-1)[0], scrollPlay)
            }
          })
          console.log(videoElementVisibilities)
        }, 1000)
      },

      getPagenation = (page, tags = [], videoName = "") => {
        return axios.get('/videopost/pagenatevideo/', { params: { "page": page, "tags": tags, "videoName": videoName } })
          .then(data => {
            if (data.data.results) {
              console.log(data)
              console.log(JSON.parse(data.data.results))
              return JSON.parse(data.data.results).map(model => {
                return model.fields
              })
            }
            else {
              return []
            }
          })
          .catch(error => console.log('ページの取得に失敗しました: ', error))
      }

    onMounted(async () => {
      axios.defaults.xsrfCookieName = 'csrftoken'
      axios.defaults.xsrfHeaderName = "X-CSRFTOKEN"
      await addVideos()
      currentVideoElement.value = document.querySelector(".infinite-item > video")
      console.log(currentVideoElement.value)
      console.log(videoElementVisibilities)
      console.log(dataList.value)
    });

    const
      container = ref(),
      videoElementVisibilities = reactive([]),
      currentVideoElement = ref(undefined),
      scrollPlay = (value) => {
        console.log(value.element)
        const element = value.element
        if (value.visibility) {
          element.play()
          currentVideoElement.value = element
          if (element.src === blobVideos.at(-2)) {
            console.log("load")
            addVideos()
          }
        }
        else element.pause()
      }

    const
      clickTimer = ref(undefined),
      togglePlayAndGood = event => {
        if (!clickTimer.value) {
          clickTimer.value = setTimeout(() => {
            clickTimer.value = clearTimeout(clickTimer.value)
            console.log(clickTimer.value)
            const videoElement = event.target
            videoElement.paused ? videoElement.play() : videoElement.pause()
          }, 250)
        }
        else {
          clickTimer.value = clearTimeout(clickTimer.value)
          console.log(clickTimer.value)
          const videoElement = event.target
          console.log(event)
          // TODO: データーべースのいいねの数を増やすこと

        }
      }

    const
      menu = ref(),
      menuRight = ref(0),
      swipeDirection = ref(true),
      menuOpacity = ref(0),
      movementRatio = ref(100),
      menuOpenFrag = ref(true),
      menuOpenlimit = 75,
      transitionFlag = ref(true),
      menuTimer = ref(undefined),

      menuOpen = () => {
        menuOpacity.value = 1
        menuOpenFrag.value = false
        menuRight.value = 75
      },

      menuClose = () => {
        menuOpacity.value = 0
        menuOpenFrag.value = true
        menuRight.value = 0
      },

      setMenuTimer = () => {
        if (!menuTimer.value) {
          menuTimer.value = setTimeout(() => {
            transitionFlag.value = false
          }, 400)
        }
      },

      clearMenuTimer = () => {
        menuTimer.value = clearTimeout(menuTimer.value)
      }

    if (isSmartPhone()) {
      useEventListener(window, "touchstart", event => {
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        const moveDistance = windowWidth / 8
        const startX = event.touches[0].clientX
        const startY = event.touches[0].clientY
        console.log(event)
        console.log(startX, windowWidth / 4)
        console.log(!menuOpenFrag.value, startX > windowWidth / 4)
        if ((!menuOpenFrag.value || startX > windowWidth / 4) && !tutorialFlag.value) {
          const removeTouchMove = useEventListener(window, "touchmove", event => {
            const moveAmountY = Math.abs(startY - event.touches[0].clientY)
            if (moveAmountY > 50) {
              swipeDirection.value = false
            }
            console.log(swipeDirection.value)
            if (swipeDirection.value) {
              const moveX = event.touches[0].clientX
              const movementRatio = Math.min(100 - (moveX / windowWidth * 100), menuOpenlimit)
              const movementX = startX - moveX
              console.log(moveX)
              console.log(movementRatio)
              console.log(movementX, moveDistance)
              if (menuOpenFrag.value) {
                if (movementX >= moveDistance) {
                  setMenuTimer()
                  menuOpacity.value = 1
                  menuRight.value = movementRatio
                }
              } else {
                if (movementX < -moveDistance) {
                  setMenuTimer()
                  menuOpacity.value = 1
                  menuRight.value = movementRatio
                }
              }
            }
            else { transitionFlag.value = true, menuClose() }
          })
          const removeTouchUp = useEventListener(window, "touchend", event => {
            if (swipeDirection.value) {
              const endX = event.changedTouches[0].clientX
              const movedX = startX - event.changedTouches[0].clientX
              clearMenuTimer()
              transitionFlag.value = true
              if (endX < windowWidth / 4 && Math.abs(movedX) < 5) {
                console.log("tap close")
                menuClose()
              } else {
                if (menuOpenFrag.value) {
                  if (movedX >= moveDistance) {
                    console.log("open")
                    menuOpen()
                  } else {
                    console.log("closed")
                    menuClose()
                  }
                } else {
                  if (movedX > -moveDistance) {
                    console.log("opened")
                    menuOpen()
                  } else {
                    console.log("close")
                    menuClose()
                  }
                }
              }
            } else {
              swipeDirection.value = true
              console.log(swipeDirection.value)
            }
            console.log(event, "up")
            removeTouchMove()
            removeTouchUp()
            removeTouchCansel()

          })
          const removeTouchCansel = useEventListener(window, "touchcansel", event => {
            console.log("cansel", event)
          })
        }
      })
    }

    const toggle = () => {
      if (menu.value.style.left == 50 + "%") {
        menu.value.style.left = 100 + "%"
      } else {
        menu.value.style.left = 50 + "%"
      }
    }

    return {
      tutorialFlag,
      onTutorialClick,
      loadElement,
      dataList,
      blobVideos,
      toggle,
      container,
      togglePlayAndGood,
      menu,
      menuRight,
      menuOpacity,
      transitionFlag,
    }
  }
});
infiniteScroll.config.compilerOptions.delimiters = ['[[', ']]'];
infiniteScroll.mount('#scroll')
