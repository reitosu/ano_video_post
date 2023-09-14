const { createApp, ref, reactive, watch, computed, onMounted, onBeforeUnmount, nextTick } = Vue;
const { useIntervalFn } = VueUse;
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js'
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
            if (event.detail.result === "復元") {
                console.log(draft.value)
                const beforeWidth = draft.value.position.timelineWidth
                tags.value = draft.value.tags
                videoSrc.value = draft.value.video
                if (timelineWidth.value != beforeWidth) {
                    const ratio = timelineWidth.value / beforeWidth
                    materialLeft.value = draft.value.position.materialLeft * ratio
                    materialWidth.value = draft.value.position.materialWidth * ratio
                }
            }
        }

        const draft = ref()
        const { openModal } = useModal({ title: "注意", message: "下書きがあります。", button: ["復元", "閉じる"] })

        onMounted(() => {
            window.addEventListener('beforeunload', saveDraft)
            document.addEventListener('touchmove', noscroll, { passive: false });
            document.addEventListener('wheel', noscroll, { passive: false });
            axios.defaults.xsrfCookieName = 'csrftoken'
            axios.defaults.xsrfHeaderName = "X-CSRFTOKEN"
            draft.value = JSON.parse(document.querySelector("#draft").getAttribute("data-draft"))
            console.log(draft.value)
            const width = timelineElement.value.clientWidth
            timelineWidth.value = width
            materialWidth.value = width
            if (draft.value.video) {
                openModal()
                document.addEventListener("result", loadDraft)
            }
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

        const videoPreview = ref()
        const videoSrc = ref()
        const displayCurrentTime = reactive({ "current": "0.0", "duration": "0.0" })
        const roundBase = ref(10)

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
                    videoSrc.value = path
                }).catch(error => console.log('動画ファイルの読み込みに失敗しました。: ', error))
        }

        const loadVideo = () => {
            const duration = videoPreview.value.duration
            console.log(duration)
            displayCurrentTime.duration = roundDecimalPlace(duration, roundBase.value)
            intervalList.value = createInterval(duration)
        }

        const { pause, resume, isActive: playFlag } = useIntervalFn(() => {
            const current = roundDecimalPlace(videoPreview.value.currentTime, roundBase.value)
            displayCurrentTime.current = current
            currentTimePosition.value = videoPreview.value.currentTime / displayCurrentTime.duration * 100
        }, 1)

        const playVideo = () => {
            if (videoPreview.value.readyState >= 1) {
                resume()
                videoPreview.value.play()
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

        const moveCurrent = (event) => {
            console.log("click")
            const onMouseMove = (event) => {
                let clickPosition = ((event.pageX - timelineElement.value.offsetLeft) / timelineWidth.value) * 100;
                const max = (materialLeft.value - timelineLeft.value + materialWidth.value) / timelineWidth.value * 100
                const min = (materialLeft.value - timelineLeft.value) / timelineWidth.value * 100
                clickPosition = clickPosition >= max ? max : clickPosition <= min ? min : clickPosition;
                currentTimePosition.value = clickPosition
                const currentTime = (clickPosition / 100) * displayCurrentTime.duration
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
        const handleLefts = reactive({ l: null, r: null })
        const movement = reactive({ direction: "", x: 0 })
        const watchStop = ref()

        const move = (event) => {
            const onMouseMove = (event) => {
                const moveX = event.pageX + startX
                const timelineRight = timelineLeft.value + timelineWidth.value
                materialLeft.value = moveX <= timelineLeft.value ? timelineLeft.value : moveX + materialWidth.value >= timelineRight ? timelineRight - materialWidth.value : moveX;
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
                materialWidth.value -= amountX
                materialLeft.value += amountX
                if (current <= materialLeft.value) {
                    currentTimePosition.value = ((materialLeft.value - timelineLeft.value) / timelineWidth.value) * 100
                }
            }
            else if (next.direction == "r" && timelineRight >= materialLeft.value + materialWidth.value + amountX) {
                materialWidth.value += amountX
                if (current >= materialLeft.value + materialWidth.value) {
                    currentTimePosition.value = ((materialLeft.value - timelineLeft.value + materialWidth.value) / timelineWidth.value) * 100
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

        const slideUp = (element) => {
            if (tagDatas.length === 0) getTagDatas();
            tagInputElement.value.focus({ preventScroll: true })
            element.style.transform = "translateY(0%)"
        }

        const slideDown = (element) => {
            element.style.transform = "translateY(100%)"
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

        return {
            results,
            loadDraft,
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
            slideUp,
            slideDown,
            predict,
            addTag,
        }
    }
});
check.config.compilerOptions.delimiters = ['[[', ']]'];
check.mount('#check')
