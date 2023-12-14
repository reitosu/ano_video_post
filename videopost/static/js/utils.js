const { ref, computed, toRef, toValue, watch } = Vue;
export const
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

    sharing = async (data) => {
        if (!navigator.share) {
            throw new Error('sharing is not supported.')
        }
        else {
            await navigator.share(data)
        }
    }