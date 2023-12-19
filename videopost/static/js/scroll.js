const { createApp, ref, reactive, computed, onMounted } = Vue;
const { useDebounceFn } = VueUse;
import { fetchVideos } from './utils.js'


const infiniteScroll = createApp({
  setup() {
    const loadElement = ref()
    const dataList = computed(() => {
      if (loadElement.value) {
        const fieldsList = JSON.parse(loadElement.value.getAttribute("data-video"))
          .map(model => {
            const fields = model.fields
            return fields
          })
        console.log(fieldsList)
        return fieldsList
      }
      else {
        return undefined
      }
    })

    const blobVideos = reactive([])

    const get_pagenation = (page) => {
      return axios.get('/videopost/pagenatevideo/', { params: { "page": page } })
        .then(data => {
          if (data.data.results) {
            console.log(data)
            console.log(JSON.parse(data.data.results))
            return JSON.parse(data.data.results)
          }
          else {
            return []
          }
        })
        .catch(error => console.log('ページの取得に失敗しました: ', error))
    }

    onMounted(async () => {
      console.log(await fetchVideos(dataList.value))
      blobVideos.push(...(await fetchVideos(dataList.value)).map(value => { return value.value }))
      axios.defaults.xsrfCookieName = 'csrftoken'
      axios.defaults.xsrfHeaderName = "X-CSRFTOKEN"
      console.log(await get_pagenation(8))
      onSwipe()
      window.addEventListener("wheel", onWheel)
      console.log(dataList.value)
    });


    const start_Window = ref(0)


    const tutorialFlag = ref(true)
    const onTutorialClick = () => {

      
      tutorialFlag.value = false;
    }

    const container = ref()
    const videos = ref([])
    const videosRef = (element) => {
      console.log(videos.value)
      console.log(element)
      videos.value.push(element)
    }
    const currentVideo = ref(0)

    const wheelDebounce = useDebounceFn((event) => {
      new Promise(resolve => {
        window.removeEventListener("wheel", onWheel)
        console.log("wheel")
        const direction = event.deltaY
        if (direction > 0 && currentVideo.value < videos.value.length - 1) {
          currentVideo.value++;
        }
        else if (direction < 0 && currentVideo.value > 0) {
          currentVideo.value--;
        }

        console.log(currentVideo.value)
        console.log(videos.value[currentVideo.value])
        console.log(videos.value[currentVideo.value].offsetTop)
        console.log(container.value.scrollTop)
        console.log(videos.value[currentVideo.value].offsetTop + container.value.scrollTop)
        container.value.scrollTo({
          top: videos.value[currentVideo.value].offsetTop,
          behavior: "smooth",
        });
        resolve(direction)
      })
        .then(value => { window.addEventListener("wheel", onWheel) })
    }, 1)

    const onWheel = (event) => {
      new Promise(async resolve => {
        window.removeEventListener("wheel", onWheel)
        console.log("wheel")
        console.log("delta" + event.deltaY)
        const direction = event.deltaY
        if (direction > 0 && currentVideo.value < videos.value.length - 1) {
          currentVideo.value++;
        }
        else if (direction < 0 && currentVideo.value > 0) {
          currentVideo.value--;
        }

        console.log(currentVideo.value)
        console.log(videos.value[currentVideo.value])
        console.log(videos.value[currentVideo.value].offsetTop)
        console.log(container.value.scrollTop)
        console.log(videos.value[currentVideo.value].offsetTop + container.value.scrollTop)
        await container.value.scrollTo({
          top: videos.value[currentVideo.value].offsetTop,
          behavior: "smooth",
        });
        resolve()
      })
        .then(() => {
          console.log("add")
          setTimeout(() => {
            window.addEventListener("wheel", onWheel)
          }, 600)
        })
    }

    const page = ref(2)
    const ifLoad = () => {
      console.log("scroll")
      console.log(Math.abs(videos.value[currentVideo.value].offsetTop))
      console.log(Math.abs(videos.value[videos.value.length - 1].offsetTop))
      if (Math.abs(videos.value[currentVideo.value].offsetTop) == Math.abs(videos.value[videos.value.length - 1].offsetTop)) {
        loadVideos(page.value)
        page.value++
      }
    }

    const loadVideos = async () => {
      console.log("load")
      console.log(page.value)
      const data = await get_pagenation(8)
      if (data) {
        dataList.value.push(data)
        blobVideos.push(...(await fetchVideos(data)).map(value => { return value.value }))
      }
      console.log(data)
      console.log(dataList.value)
      // axios({
      //   method: 'GET',
      //   url: '?page=' + page.value,
      //   responseType: '',
      // })
      //   .then(data => {
      //     console.log("success")
      //     console.log(data.request.response)
      //     const fragment = document.createRange().createContextualFragment(data.request.response);
      //     console.log(fragment.querySelectorAll('.infinite-item'))
      //     fragment.querySelectorAll('.infinite-item').forEach(node => {
      //       container.value.append(node)
      //     })
      //     videos.value = document.querySelectorAll(".infinite-item")
      //     console.log(videos.value)
      //   })
      //   .catch(error => console.log('ページの取得に失敗しました: ', error))
    }

    const menu = ref()
    const movementRatio = ref(100)
    const menuMoveFrag = ref("close")
    const MenuOpenlimit = 0

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
      dataList,
      blobVideos,
      toggle,
      container,
      videosRef,
      onWheel,
      ifLoad,
      menu,
    }
  }
});
infiniteScroll.config.compilerOptions.delimiters = ['[[', ']]'];
infiniteScroll.mount('#scroll')