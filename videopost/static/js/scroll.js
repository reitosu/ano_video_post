const container = document.getElementById('container');
        const videos = document.querySelectorAll('.infinite-item');

        let currentVideo = 0;
        let timeout;

        function scrollToNextVideo() {
            if (currentVideo === videos.length - 1) {
                currentVideo = 0;
            } else {
                currentVideo++;
            }

            const nextVideo = videos[currentVideo];
            container.scrollTo({
                top: nextVideo.offsetTop,
                behavior: 'smooth'
            });

            clearTimeout(timeout);
            timeout = setTimeout(scrollToNextVideo, 5000); // 5秒ごとに次のビデオにスクロール
        }

        timeout = setTimeout(scrollToNextVideo, 5000); // 最初のスクロールを開始

        // スクロール中にマウスを動かすとスクロールを停止
        container.addEventListener('mousemove', () => {
            clearTimeout(timeout);
        });

        // マウスが動かされなくなったらスクロール再開
        container.addEventListener('mouseleave', () => {
            timeout = setTimeout(scrollToNextVideo, 5000);
        });