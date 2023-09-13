const { createApp, ref, reactive, watch, computed, onMounted, onBeforeUnmount, nextTick } = Vue;
const { useDebounceFn } = VueUse;

const infiniteScroll = createApp({
  setup() {
    onMounted(() => {
      axios.defaults.xsrfCookieName = 'csrftoken'
      axios.defaults.xsrfHeaderName = "X-CSRFTOKEN"
      videos.value = document.querySelectorAll(".infinite-item")
      onLeftSwipe()
    });

    const container = ref()
    const videos = ref()
    const currentVideo = ref(0)
    const wheelDebounce = useDebounceFn((event) => {
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
      console.log(videos.value[currentVideo.value].offsetTop+container.value.scrollTop)
      container.value.scrollTo({
        top: videos.value[currentVideo.value].offsetTop,
        behavior: "smooth",
      });
    }, 200)

    const onWheel = (event) => {
      wheelDebounce(event)
    }

    const page = ref(2)
    const ifLoad = () => {
      console.log("scroll")
      console.log(Math.abs(videos.value[currentVideo.value].offsetTop))
      console.log(Math.abs(videos.value[videos.value.length-1].offsetTop))
      if (Math.abs(videos.value[currentVideo.value].offsetTop) == Math.abs(videos.value[videos.value.length-1].offsetTop)) {
        loadVideos(page.value)
        page.value++
      }
    }

    const loadVideos = () => {
      console.log("load")
      console.log(page.value)
      axios({
        method: 'GET',
        url: '?page='+page.value,
        responseType: '',
      })
      .then(data => {
        console.log("success")
        console.log(data.request.response)
        const fragment = document.createRange().createContextualFragment(data.request.response);
        console.log(fragment.querySelectorAll('.infinite-item'))
        fragment.querySelectorAll('.infinite-item').forEach(node => {
          container.value.append(node)
        })
        videos.value = document.querySelectorAll(".infinite-item")
        console.log(videos.value)
      })
      .catch(error => console.log('ページの取得に失敗しました: ', error))
    }

    const menu = ref()
    const movementRatio = ref(100)
    const menuMoveFrag = ref("close")
  
    const onLeftSwipe = () => {
      const onTouchStart = (event) => {
        const screenSize = screen.availWidth
        const ScreenHeight = screen.availHeight
        const moveDistance = screenSize/8
        const openDistance = 100-(screenSize/4/screenSize*100)
        const startX = event.touches[0].pageX
        const startY = event.touches[0].pageY

        const onTouchMove = (event) => {
          const moveX = event.touches[0].pageX
          const moveY = event.touches[0].pageY
          const movement = moveX - startX
          console.log(startX,moveX,movement)
          console.log(menu.value.offsetLeft,screenSize)
          console.log(100-(-movement/screenSize*100))
          console.log(openDistance,menu.value.style.left)
          movementRatio.value = 100-(-movement/screenSize*100)
          console.log(Math.abs(movement),moveDistance)
          if (Math.abs(movement) >= moveDistance && ScreenHeight/4 >= moveY - startY) {
            if (movement < 0 && parseFloat(menu.value.style.left) <= openDistance) {
              console.log("open")
              menuMoveFrag.value = "open"
              menu.value.animate([
                {left: movementRatio.value+"%"},
                {left: 50+"%"}
              ], 100)
              setTimeout(() => {
                menu.value.style.left = 50+"%"
              },100)
            } 
            else if (movement > 0 && parseFloat(menu.value.style.left) >= openDistance) {
              console.log("close")
              console.log(movementRatio.value-50)
              menuMoveFrag.value = "close"
              menu.value.animate([
                {left: movementRatio.value-50+"%"},
                {left: 110+"%"}
              ], 100)
              setTimeout(() => {
                menu.value.style.left = 100+"%"
              },100)
            }
            else {
              menuMoveFrag.value = "else"
              menu.value.style.left = movementRatio.value <= 50 ? '50%' : movementRatio.value+"%";
            }
          }
        }

        const onTouchEnd = () => {
          if (parseFloat(menu.value.style.left) != 100 && parseFloat(menu.value.style.left) != 50 && menuMoveFrag.value == "else") {
            console.log("end")
            menuMoveFrag.value = "close"
            menu.value.animate([
              {left: movementRatio.value+"%"},
              {left: 110+"%"}
            ], 100)
            setTimeout(() => {
              menu.value.style.left = 100+"%";
            },100)
          }
          window.removeEventListener("touchmove", onTouchMove)
          window.removeEventListener("touchend", onTouchEnd)
        }

        window.addEventListener("touchmove", onTouchMove)
        window.addEventListener("touchend", onTouchEnd)
      }
      window.addEventListener("touchstart", onTouchStart)
    }

    return {
      container,
      videos,
      onWheel,
      ifLoad,
      menu,
    }
  }
});
infiniteScroll.config.compilerOptions.delimiters = ['[[', ']]'];
infiniteScroll.mount('#scroll')
