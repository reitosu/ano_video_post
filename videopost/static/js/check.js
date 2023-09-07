const { createApp, ref, reactive, watch, computed, onMounted, onBeforeUnmount, nextTick } = Vue;
const { useDebounceFn, useIntervalFn } = VueUse;

const roundDecimalPlace = (num, base) => {
    const rounded = Math.floor(num * base) / base
    return Number.isInteger(rounded) ? rounded+".0" : rounded ;
}

const check = createApp({
  setup() {
    onMounted(() => {
      axios.defaults.xsrfCookieName = 'csrftoken'
      axios.defaults.xsrfHeaderName = "X-CSRFTOKEN"
      const width = timelineElement.value.clientWidth
      timelineWidth.value = width
      materialWidth.value = width
      pause()
    });

    const videoPreview = ref()
    const videoSrc = ref()
    const displayCurrentTime = reactive({"current":0, "duration":0})
    const roundBase = ref(10)

    const selectVideo = (event) => {
        console.log(event.target.files[0])
        const selected = event.target.files[0]
        videoSrc.value = URL.createObjectURL(selected)
    }

    const loadVideo = () => {
        const duration = videoPreview.value.duration
        console.log(duration)
        displayCurrentTime.duration = roundDecimalPlace(duration, roundBase.value)
        intervalList.value = createInterval(duration)
    }

    const { pause, resume, isActive:playFlag } = useIntervalFn(() => {
        const current = roundDecimalPlace(videoPreview.value.currentTime, roundBase.value)
        displayCurrentTime.current = current
        currentTimePosition.value = videoPreview.value.currentTime / displayCurrentTime.duration * 100
      }, 1)

    const playVideo = () => {
        resume()
        videoPreview.value.play()
    }
    const pauseVideo = () => {
        pause()
        videoPreview.value.pause()
    }

    const timeSettings = reactive({
        videoLength: 12,
        interval: 1,
    })

    const createInterval = (len,interval=1) => {
        const list = Array(parseInt(len)+1) 
        for (var i = 0; i <= len; i += interval) {
            var seconds = Math.floor(i % 60);
            var position = (i / len) * 100;
            list[i] = ({'left': position + '%' , "displayTime": (seconds < 10 ? '0' : '') + seconds})
        }
        return list
    }
    
    const timelineElement = ref()
    const intervalList = ref(createInterval(timeSettings.videoLength))
    const currentTimePosition = ref(0)
    const timelineWidth = ref(97+'%')
    const timelineLeft = ref(5)

    const moveCurrent = (event) => {
        console.log("click")
        const onMouseMove = (event) => {
            let clickPosition = ((event.pageX - timelineElement.value.offsetLeft) / timelineWidth.value) * 100;
            clickPosition = clickPosition >= 100 ? 100 : clickPosition <= 0 ? 0 : clickPosition ;
            currentTimePosition.value = clickPosition
            const currentTime = (clickPosition/100) * displayCurrentTime.duration
            displayCurrentTime.current = roundDecimalPlace(currentTime, roundBase.value)
            videoPreview.value.currentTime = currentTime
        }
        const onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mouseup", onMouseUp)
        }
        const clickPosition = ((event.pageX - timelineElement.value.offsetLeft) / timelineWidth.value) * 100;
        currentTimePosition.value = clickPosition >= 100 ? 100 : clickPosition <= 0 ? 0 : clickPosition;
        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseup", onMouseUp)
    }
    
    const material = ref()
    const materialWidth = ref()
    const materialLeft = ref(5)
    const leftHandle = ref()
    const rightHandle = ref()
    const handleLefts = reactive({l:null,r:null})
    const movement = reactive({direction:"", x:0})
    const watchStop = ref()

    const move = (event) => {
        const onMouseMove = (event) => {
            const moveX = event.pageX + startX
            const timelineRight = timelineLeft.value+timelineWidth.value
            materialLeft.value = moveX <= timelineLeft.value ? timelineLeft.value : moveX+materialWidth.value >= timelineRight ? timelineRight-materialWidth.value : moveX ;
        }
        const onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mousedown", onMouseUp)
        }
        const startX = materialLeft.value - event.pageX

        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseup", onMouseUp)
    }

    const resize = (event) => {
        const onMouseMove = (event) => {
            const moveX = event.pageX
            movement.x = moveX
        }
        const onMouseUp = () => {
            watchStop.value()
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mousedown", onMouseUp)
        }
        const direction = event.target.id.charAt(0)
        const startX = event.pageX
        movement.direction = direction
        movement.x = startX
        watchStop.value = watch(() => ({...movement}), observeResize)
        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseup", onMouseUp)
    }
    
    const observeResize = (next,pre) => {
        const amountX = next.x - pre.x
        const timelineRight = timelineLeft.value + timelineWidth.value
        if (next.direction == "l" && timelineLeft.value <= materialLeft.value + amountX && materialWidth.value - amountX >= 0) {
            materialWidth.value -= amountX
            materialLeft.value += amountX
        }
        else if (next.direction == "r" && timelineRight >= materialLeft.value + materialWidth.value + amountX) {
            materialWidth.value += amountX
        }
    }

    return {
        videoPreview,
        videoSrc,
        displayCurrentTime,
        selectVideo,
        loadVideo,
        playFlag,
        pause,
        playVideo,
        pauseVideo,
        timelineElement,
        intervalList,
        currentTimePosition,
        timelineWidth, 
        timelineLeft,
        moveCurrent,
        material,
        materialWidth,
        materialLeft,
        leftHandle,
        rightHandle,
        handleLefts,
        move,
        resize,
    }
  }
});
check.config.compilerOptions.delimiters = ['[[', ']]'];
check.mount('#check')
