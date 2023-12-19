const { createApp, ref, reactive, computed, onMounted, watch, watchEffect, nextTick } = Vue;
const { useDebounceFn, useElementVisibility, useEventListener } = VueUse;
import { fetchVideo } from './utils.js'

const pagenationNumber = 5

const infiniteScroll = createApp({
  setup() {
    const
      dataList = ref([]),
      blobVideos = reactive([]),

      addVideos = async () => {
        const page = (dataList.value.length / pagenationNumber) + 1
        console.log(page)
        const videoList = await getPagenation(page)
        dataList.value.push(...videoList)
        videoList.forEach(async video => {

          const url = await fetchVideo(video.video)
            .catch(error => console.log(error))
          blobVideos.push(url)
        })
        setTimeout(() => {
          const videoElementList = Array.from(document.querySelectorAll(".infinite-item > video"))
          videoElementList.forEach(ele => {
            if (!(videoElementVisibilities.map(ele => { return ele.element }).includes(ele))) {
              videoElementVisibilities.push({ element: ele, visibility: useElementVisibility(ele) })
            }
          })
          console.log(videoElementVisibilities)
        }, 1000)
      },

      getPagenation = (page) => {
        return axios.get('/videopost/pagenatevideo/', { params: { "page": page } })
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
      onSwipe()
      await addVideos()
      console.log(videoElementVisibilities)
      console.log(dataList.value)
    });


    const start_Window = ref(0)


    const tutorialFlag = ref(true)
    const onTutorialClick = () => {
      tutorialFlag.value = false;
    }

    const container = ref()
    const currentVideoElement = ref(undefined)
    const videoElementVisibilities = reactive([])

    useEventListener(container, "scrollend", () => {
      console.log(videoElementVisibilities)
      videoElementVisibilities.some(ele => {
        if (ele.visibility) {
          console.log(ele.element)
          console.log(blobVideos.at(-2), ele.element.src)
          if (ele.element.src === blobVideos.at(-2)) {
            console.log("load")
            addVideos()
          }
          currentVideoElement.value = ele.element
          return true;
        }
      })
      console.log(currentVideoElement.value)
      console.log(videoElementVisibilities)
    })

    const menu = ref()
    const movementRatio = ref(100)
    const menuMoveFrag = ref("close")
<<<<<<< HEAD
    const MenuOpenlimit = 0
=======
    const MenuOpenlimit = 50
>>>>>>> d924df4938e1247215462628e9745f3656fbcda8

    const onSwipe = () => {
      const onTouchStart = (event) => {
        const screenSize = screen.availWidth
        const ScreenHeight = screen.availHeight
        const moveDistance = screenSize / 8
        const openDistance = 100 - (screenSize / 4 / screenSize * 100)
        const startX = event.touches[0].pageX
        const startY = event.touches[0].pageY

        const onTouchMove = (event) => {
          const moveX = event.touches[0].pageX
          const moveY = event.touches[0].pageY
          const movement = moveX - startX
          console.log(startX, moveX, movement)
          console.log(menu.value.offsetLeft, screenSize)
          console.log(100 - (-movement / screenSize * 100))
          console.log(openDistance, menu.value.style.left)
          movementRatio.value = Math.max(100 - (-movement / screenSize * 100), MenuOpenlimit)
          console.log(Math.abs(movement), moveDistance)
          if (Math.abs(movement) >= moveDistance && ScreenHeight / 4 >= moveY - startY) {
            if (movement < 0 && parseFloat(menu.value.style.left) <= openDistance) {
              console.log("open")
              menuMoveFrag.value = "open"
              menu.value.animate([
                { left: movementRatio.value + "%" },
                { left: 25 + "%" }
              ], 100)
              setTimeout(() => {
                menu.value.style.left = 25 + "%"
              }, 100)
            }
            else if (movement > 0 && parseFloat(menu.value.style.left) >= openDistance) {
              console.log("close")
              console.log(movementRatio.value - 50)
              menuMoveFrag.value = "close"
              menu.value.animate([
                { left: movementRatio.value - 50 + "%" },
                { left: 110 + "%" }
              ], 100)
              setTimeout(() => {
                menu.value.style.left = 100 + "%"
              }, 100)
            }
            else {
              menuMoveFrag.value = "else"
              menu.value.style.left = movementRatio.value <= 50 ? '50%' : movementRatio.value + "%";
            }
          }
        }

        const onTouchEnd = () => {
          if (parseFloat(menu.value.style.left) != 100 && parseFloat(menu.value.style.left) != 50 && menuMoveFrag.value == "else") {
            console.log("end")
            menuMoveFrag.value = "close"
            menu.value.animate([
              { left: movementRatio.value + "%" },
              { left: 110 + "%" }
            ], 100)
            setTimeout(() => {
              menu.value.style.left = 100 + "%";
            }, 100)
          }
          window.removeEventListener("touchmove", onTouchMove)
          window.removeEventListener("touchend", onTouchEnd)
        }

        window.addEventListener("touchmove", onTouchMove)
        window.addEventListener("touchend", onTouchEnd)
      }
      window.addEventListener("touchstart", onTouchStart)
    }

    const toggle = () => {
      if (menu.value.style.left == 50 + "%") {
        menu.value.style.left = 100 + "%"
      } else {
        menu.value.style.left = 50 + "%"
      }
    }

    return {
      start_Window,
      tutorialFlag,
      onTutorialClick,
      fetchVideos,
      loadElement,
      tutorialFlag,
      onTutorialClick,
      dataList,
      blobVideos,
      toggle,
      container,
      ifLoad,
      menu,
    }
  }
});
infiniteScroll.config.compilerOptions.delimiters = ['[[', ']]'];
infiniteScroll.mount('#scroll')