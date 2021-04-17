const main = async () => {
    const resolution = { w: 1080, h: 720 };
    const canvasSize = { w: 1080, h: 720 };

    const net = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2
    });

    const video = document.getElementById('player');
    video.autoplay = true;
    navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            width: { ideal: resolution.w },
            height: { ideal: resolution.h }
        }
    }).then(function (stream) {
        video.srcObject = stream;
    });

    const output = document.getElementById('output');
    output.width = canvasSize.w;
    output.height = canvasSize.h;

    const ctx = output.getContext("2d");

    const flowers = new Array()

    const hana = new Image();
    hana.src = "images/hana.png";

    video.addEventListener('loadeddata', async() => {
        setInterval(async () => {
            const bodies = await net.segmentMultiPerson(video);
            bodies && bodies.map((body) => {
                const leftEye = body.pose.keypoints[1]
                const rightEye = body.pose.keypoints[2]
                if (leftEye.score > 0.6 && rightEye.score > 0.6) {
                    const nose = body.pose.keypoints[0]
                    const scale = Math.abs(leftEye.position.x - rightEye.position.x)
                    const pause = Date.now()
                    const flower = {
                        x: output.width - nose.position.x - scale / 2,
                        y: nose.position.y - scale / 2,
                        scale: scale,
                        time: pause
                    }
                    flowers.push(flower);
                }
            });

            ctx.clearRect(0, 0, 1080, 720);
            const stop = Date.now()
            const drawFlowers = flowers

            flowers.map((f, idx) => {
                if (stop - f.time > 2000) {
                    flowers.splice(idx, 1)
                }
            })

            drawFlowers.map((f) => {
                ctx.drawImage(hana, f.x, f.y, f.scale, f.scale)
            })
        }, 100)

    })
}
main();
