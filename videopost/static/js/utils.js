const { ref, computed, toRef, toValue, watch } = Vue;
const { useEventListener } = VueUse;
export const
    isSmartPhone = () => {
        if (window.matchMedia && window.matchMedia('(max-device-width: 640px)').matches) {
            return true;
        } else {
            return false;
        }
    },

    validateCloudinaryUrl = (video) => {
        if (!video.endsWith(".mp4")) {
            video += ".mp4"
        }
        if (video.split("/").length == 1) {
            return 'https://res.cloudinary.com/dhlsaygev/video/upload/' + video
        }
        else {
            return 'https://res.cloudinary.com/dhlsaygev/' + video
        }
    },

    fetchVideo = async video => {
        const response = await fetch(validateCloudinaryUrl(video))
        const blob = await new Response(response.body).blob()
        const blobUrl = URL.createObjectURL(blob)
        return blobUrl
    },

    fetchVideos = async (videoList) => {
        const promiseList = []
        console.log(videoList)
        videoList.forEach(video => {
            promiseList.push(fetch(validateCloudinaryUrl(video.video)).then(async res => {
                const blob = await new Response(res.body).blob();
                const blobUrl = URL.createObjectURL(blob)
                return blobUrl
            }))
        })
        const result = await Promise.allSettled(promiseList)
        return result
    },

    restrictContextMenu = () => {
        return useEventListener(document, 'contextmenu', event => {
            event.preventDefault()
        })
    },
    restrictDownload = () => {
        return useEventListener(document, 'click', (event) => {
            var target = event.target;
            if (target.tagName.toLowerCase() === 'a' && target.getAttribute("download") !== null) {
                event.preventDefault();
                console.log(target.getAttribute("download"))
                alert('ダウンロードは禁止されています。');
            }
        })
    },
    restrictAddVideoElement = (videoList) => {
        const approveVideoList = toRef(videoList)
        const res = ref()
        useEventListener(document, 'click', () => {
            console.log("click")
            const videos = Array.from(document.querySelectorAll("video"))
            if (videos.length !== approveVideoList.value.length) {
                const result = videos.filter(ele => !approveVideoList.value.includes(ele));
                result.forEach(ele => {
                    console.log("remove", ele)
                    ele.remove()
                })
                res.value = result
            }
        })
        return res
    },
    restrictAddAttribute = (target) => {
        const
            observerOptions = { childList: false, attributes: true },
            videoAttributeObserver = new MutationObserver((mutationList, observer) => {
                mutationList.forEach(mutation => {
                    console.log(mutation)
                    const attrName = mutation.attributeName
                    if (mutation.type === "attributes" && !["class", "id", "src", "loop", "autoplay"].includes(attrName)) {
                        mutation.target.removeAttribute(attrName)
                    }
                })
            })
        const targetList = Array.isArray(toRef(target).value) ? toRef(target) : toRef([target.value]);
        watch(() => ({ ...targetList.value }), (next, pre) => {
            const nextList = Object.values(next)
            const preList = Object.values(pre)
            const differentList = nextList.filter(ele => !preList.includes(ele))
            if (differentList) {
                differentList.forEach(ele => {
                    videoAttributeObserver.observe(ele, observerOptions)
                })
            }
        }, { deep: true })
    },
    restrictAll = (videoList) => {
        restrictAddAttribute(videoList)
        restrictAddVideoElement(videoList)
        restrictContextMenu()
        restrictDownload()
    }