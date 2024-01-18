const { createApp, ref, reactive, watch, computed, onMounted, onBeforeUnmount, nextTick } = Vue;
const { useIntervalFn, useMediaControls } = VueUse;
import { useModal } from './modalComponent.js'
import { useFuse } from './fuseComponent.js'

const noscroll = (e) => {
    e.preventDefault()
}

const roundDecimalPlace = (num, base) => {
    const rounded = Math.floor(num * base) / base
    return Number.isInteger(rounded) ? rounded + ".0" : rounded;
}

const check = createApp({
    setup() {
        const saveDraft = () => {
            const csrf = document.querySelector('input[name="csrfmiddlewaretoken"]').value
            console.log(videoSrc.value,)
            const data = new FormData();
            data.append('csrfmiddlewaretoken', csrf)
            data.append('draft', JSON.stringify({ tags: tags.value, video: videoSrc.value, position: { timelineWidth: timelineWidth.value, materialLeft: materialLeft.value, materialWidth: materialWidth.value } }))
            navigator.sendBeacon("/videopost/saveDraft/", data)
        }

        const loadDraft = (event) => {
            console.log(event)
            if (event.detail.result.select === "復元") {
                console.log(draftData.value)
                const beforeWidth = draftData.value.position.timelineWidth
                tags.value = draftData.value.tags
                videoSrc.value = draftData.value.video
                let ratio = 1
                if (timelineWidth.value != beforeWidth) {
                    ratio = timelineWidth.value / beforeWidth
                }
                materialLeft.value = draftData.value.position.materialLeft * ratio
                materialWidth.value = draftData.value.position.materialWidth * ratio
                if (materialLeft.value > 5) {
                    currentTimePosition.value = ((materialLeft.value - 5) / timelineWidth.value) * 100
                }
            }
        }

        const
            draftElement = ref(undefined),
            draftData = computed(() => {
                if (draftElement.value) {
                    console.log(JSON.parse(draftElement.value.getAttribute("data-draft")))
                    return JSON.parse(draftElement.value.getAttribute("data-draft"))
                }
                else return undefined
            })
        const { openModal } = useModal({ title: "注意", message: "下書きがあります。", button: ["復元", "閉じる"] })

        onMounted(() => {
            window.addEventListener('beforeunload', saveDraft)
            document.addEventListener('touchmove', noscroll, { passive: false });
            document.addEventListener('wheel', noscroll, { passive: false });
            axios.defaults.xsrfCookieName = 'csrftoken'
            axios.defaults.xsrfHeaderName = "X-CSRFTOKEN"
            console.log(document.querySelector("#draft").getAttribute("data-draft"))
            const width = timelineElement.value.clientWidth
            timelineWidth.value = width
            if (draftData.value.video) {
                openModal()
                document.addEventListener("result", loadDraft)
            }
            // draft.value = JSON.parse(document.querySelector("#draft").getAttribute("data-draft"))
            // console.log(draft.value)
            // if (draft.value.video) {
            //     openModal()
            //     document.addEventListener("result", loadDraft)
            // }
            pause()
        });

        const tags = ref([])
        const tagsWidth = ref(100)
        const inputFlag = ref(false)

        const tagDelete = (event) => {
            const tagText = event.target.parentElement.textContent
            const index = tags.value.indexOf(tagText.replace(" ×", ""))
            tags.value.splice(index, 1)
        }

        const
            videoPreview = ref(),
            videoSrc = ref(),
            videoControls = ref({ ...useMediaControls(videoPreview, { src: videoSrc }) }),
            duration = computed(() => { return videoControls.value.duration }),
            displayCurrentTime = reactive({ "current": "0.0", "duration": "0.0" }),
            roundBase = ref(10)

        const selectVideo = (event) => {
            console.log(event.target.files[0])
            const selected = event.target.files[0]
            const formData = new FormData();
            formData.append('videoData', selected, 'video.mp4');
            axios({
                method: 'POST',
                url: '/videopost/vpost/',
                data: formData,
                responseType: 'json',
            })
                .then(async response => {
                    console.log('sucsess')
                    const path = response.data.path
                    videoSrc.value = path + '?t=' + Date.now()
                    materialWidth.value = timelineWidth.value
                    console.log(videoControls.value)
                }).catch(error => console.log('動画ファイルの読み込みに失敗しました。: ', error))
        }

        const loadVideo = () => {
            const duration = videoPreview.value.duration
            console.log(duration)
            displayCurrentTime.duration = roundDecimalPlace(duration, roundBase.value)
            intervalList.value = createInterval(duration)
        }

        const maxTime = computed(() => {
            return displayCurrentTime.duration * (materialLeft.value + materialWidth.value - timelineLeft.value) / timelineWidth.value
        })
        const minTime = computed(() => {
            return displayCurrentTime.duration * (materialLeft.value - timelineLeft.value) / timelineWidth.value
        })
        const { pause, resume, isActive: playFlag } = useIntervalFn(() => {
            if ((materialLeft.value + materialWidth.value - timelineLeft.value) / timelineWidth.value * 100 <= currentTimePosition.value) pauseVideo()
            currentTimePosition.value = videoPreview.value.currentTime / displayCurrentTime.duration * 100
            displayCurrentTime.current = currentTime.value
        }, 1)

        const playVideo = () => {
            if (videoPreview.value.readyState >= 1) {
                console.log(videoPreview.value.currentTime + 0.1, maxTime.value, currentTime.value)
                const result = new Promise(function (resolve) {
                    if (videoPreview.value.currentTime + 0.1 >= maxTime.value) {
                        videoPreview.value.currentTime = minTime.value
                        currentTimePosition.value = minTime.value
                    }
                    resolve("success")
                })
                result.then(res => {
                    console.log(res)
                    resume()
                    videoPreview.value.play()
                })
            }
        }
        const pauseVideo = () => {
            pause()
            videoPreview.value.pause()
        }

        const timeSettings = reactive({
            videoLength: 12,
            interval: 1,
        })

        const createInterval = (len, interval = 1) => {
            const list = Array(parseInt(len) + 1)
            for (var i = 0; i <= len; i += interval) {
                var seconds = Math.floor(i % 60);
                var position = (i / len) * 100;
                list[i] = ({ 'left': position + '%', "displayTime": (seconds < 10 ? '0' : '') + seconds })
            }
            return list
        }

        const timelineElement = ref()
        const intervalList = ref(createInterval(timeSettings.videoLength))
        const currentTimePosition = ref(0)
        const timelineWidth = ref(97 + '%')
        const timelineLeft = ref(5)

        const maxWidth = computed(() => {
            return (materialLeft.value - timelineLeft.value + materialWidth.value) / timelineWidth.value * 100
        })
        const minWidth = computed(() => {
            return (materialLeft.value - timelineLeft.value) / timelineWidth.value * 100
        })
        const restrictCurrent = (position) => {
            return position >= maxWidth.value ? maxWidth.value : position <= minWidth.value ? minWidth.value : position;
        }

        const currentTime = computed(() => {
            return roundDecimalPlace((currentTimePosition.value / 100) * displayCurrentTime.duration, roundBase.value)
        })

        const moveCurrent = (event) => {
            console.log("click")
            const onMouseMove = (event) => {
                let clickPosition = ((event.pageX - timelineElement.value.offsetLeft) / timelineWidth.value) * 100;
                clickPosition = restrictCurrent(clickPosition);
                currentTimePosition.value = clickPosition
                console.log(currentTime.value)
                videoPreview.value.currentTime = currentTime.value
                displayCurrentTime.current = currentTime.value
            }
            const onMouseUp = () => {
                window.removeEventListener("mousemove", onMouseMove)
                window.removeEventListener("mouseup", onMouseUp)
            }
            const clickPosition = ((event.pageX - timelineElement.value.offsetLeft) / timelineWidth.value) * 100;
            currentTimePosition.value = restrictCurrent(clickPosition);
            videoPreview.value.currentTime = currentTime.value
            window.addEventListener("mousemove", onMouseMove)
            window.addEventListener("mouseup", onMouseUp)
        }

        const material = ref()
        const materialWidth = ref(0)
        const materialLeft = ref(5)
        const leftHandle = ref()
        const rightHandle = ref()
        const handleLefts = reactive({ l: null, r: null })
        const movement = reactive({ direction: "", x: 0 })
        const watchStop = ref()

        const move = (event) => {
            const onMouseMove = (event) => {
                const moveX = event.pageX + startX
                const timelineRight = timelineLeft.value + timelineWidth.value
                materialLeft.value = moveX <= timelineLeft.value ? timelineLeft.value : moveX + materialWidth.value >= timelineRight ? timelineRight - materialWidth.value : moveX;
                const materialLeftRatio = ((materialLeft.value - 5) / timelineWidth.value) * 100
                const materialRightRatio = ((materialLeft.value + materialWidth.value - 5) / timelineWidth.value) * 100
                console.log(currentTimePosition.value, materialLeftRatio, materialRightRatio)
                if (currentTimePosition.value <= materialLeftRatio) {
                    currentTimePosition.value = materialLeftRatio
                    console.log(currentTime.value)
                    videoPreview.value.currentTime = currentTime.value
                    displayCurrentTime.current = currentTime.value
                }
                else if (currentTimePosition.value >= materialRightRatio) {
                    currentTimePosition.value = materialRightRatio
                    videoPreview.value.currentTime = currentTime.value
                    displayCurrentTime.current = currentTime.value
                }
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
            watchStop.value = watch(() => ({ ...movement }), observeResize)
            window.addEventListener("mousemove", onMouseMove)
            window.addEventListener("mouseup", onMouseUp)
        }

        const observeResize = (next, pre) => {
            const amountX = next.x - pre.x
            const timelineRight = timelineLeft.value + timelineWidth.value
            const current = (currentTimePosition.value / 100) * timelineWidth.value
            if (next.direction == "l" && timelineLeft.value <= materialLeft.value + amountX && materialWidth.value - amountX >= 0) {
                if (materialWidth.value - amountX >= timelineWidth.value / parseFloat(displayCurrentTime.duration)) {
                    materialWidth.value -= amountX
                    materialLeft.value += amountX
                }
                if (current <= materialLeft.value || current >= materialLeft.value + materialWidth.value) {
                    currentTimePosition.value = ((materialLeft.value - timelineLeft.value) / timelineWidth.value) * 100
                    videoPreview.value.currentTime = currentTime.value
                    displayCurrentTime.current = currentTime.value
                }
            }
            else if (next.direction == "r" && timelineRight >= materialLeft.value + materialWidth.value + amountX) {
                materialWidth.value += materialWidth.value + amountX >= timelineWidth.value / parseFloat(displayCurrentTime.duration) ? amountX : 0;
                if (current >= materialLeft.value + materialWidth.value) {
                    currentTimePosition.value = ((materialLeft.value - timelineLeft.value + materialWidth.value) / timelineWidth.value) * 100
                    videoPreview.value.currentTime = currentTime.value
                    displayCurrentTime.current = currentTime.value
                }
            }
        }

        const inputTagContainer = ref()
        const tagInputElement = ref()
        const inputTag = ref("")
        const historys = reactive([])
        const tagDatas = reactive([])

        const getTagDatas = () => {
            axios({
                url: '/videopost/getTags/',
                responseType: 'json',
            })
                .then(async response => {
                    console.log('sucsess')
                    tagDatas.push(...response.data.tags)
                }).catch(error => console.log('タグデータの取得に失敗しました。: ', error))
        }

        const predict = (event) => {
            tagInputElement.value.focus({ preventScroll: true })
            inputTag.value = event.target.textContent
        }

        const addTag = () => {
            historys.unshift(inputTag.value)
            tags.value.push(inputTag.value)
            inputTag.value = ""
        }

        const { results } = useFuse(inputTag, tagDatas)

        const { openModal: trimModal } = useModal({ title: "注意", message: "12秒以内にしてください。", button: "OK" })
        const { openModal: loadModal, closeModal } = useModal({ title: "ロード", message: "動画の準備中です。", button: "" })

        const trim = () => {
            const startTime = (materialLeft.value - timelineLeft.value) / timelineWidth.value * parseFloat(displayCurrentTime.duration)
            const trimTime = materialWidth.value / timelineWidth.value * parseFloat(displayCurrentTime.duration)
            console.log(trimTime)
            if (trimTime <= 12) {
                console.log("in the 12sec.")
                loadModal()
                const endTime = startTime + trimTime
                const formData = new FormData()
                formData.append('videoPath', videoSrc.value)
                formData.append('startTime', roundDecimalPlace(startTime, roundBase.value));
                formData.append('endTime', roundDecimalPlace(endTime, roundBase.value));
                formData.append('trimTime', roundDecimalPlace(trimTime, roundBase.value))
                axios({
                    method: 'POST',
                    url: '/videopost/trim/',
                    responseType: 'json',
                    data: formData,
                })
                    .then(async response => {
                        console.log('sucsess')
                        console.log(response.data.path)
                        const path = response.data.path
                        lastCheckVideo.value.src = path
                        closeModal()
                        if (tagDatas.length === 0) getTagDatas();
                    }).catch(error => console.log('動画のアップロードに失敗しました。: ', error))
                togglelastcheck()
            }
            else {
                trimModal()
            }
            console.log(roundDecimalPlace(startTime, roundBase.value), roundDecimalPlace(startTime + trimTime, roundBase.value))
        }

        const post = () => {
            const formData = new FormData()
            formData.append("path", lastCheckVideo.value.src)
            formData.append("isDeleteOneDay", isDeleteOneDay.value)
            formData.append("userId", localStorage.getItem("userId"))
            formData.append("tags", tags.value)
            axios({
                method: 'POST',
                url: '/videopost/posting/',
                responseType: 'json',
                data: formData,
            })
                .then(async response => {
                    console.log('sucsess')
                    console.log(response)
                }).catch(error => console.log('動画のアップロードに失敗しました。: ', error))
        }

        const lastCheckVideo = ref()
        const togglelastcheck = () => {
            const element = document.querySelector("#lastcheck")
            console.log(element.style.left)
            if (element.style.left == '0px') {
                console.log("close")
                element.style.left = "100%"
            }
            else {
                console.log("open")
                element.style.left = 0
            }
        }

        const isDeleteOneDay = ref(false)


        return {
            togglelastcheck,
            results,
            loadDraft,
            draftElement,
            tags,
            tagsWidth,
            tagDelete,
            inputFlag,
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
            inputTagContainer,
            tagInputElement,
            inputTag,
            historys,
            predict,
            addTag,
            trim,
            post,
            lastCheckVideo,
            isDeleteOneDay,
        }
    }
});
check.config.compilerOptions.delimiters = ['[[', ']]'];
check.mount('#check')
