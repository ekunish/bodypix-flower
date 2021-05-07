const main = async () => {
    const resolution = {w: 1080, h: 720};
    const canvasSize = {w: 1080, h: 720};

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
            width: {ideal: resolution.w},
            height: {ideal: resolution.h}
        }
    }).then((stream) => {
        video.srcObject = stream;
    });

    const output = document.getElementById('output');
    output.width = canvasSize.w;
    output.height = canvasSize.h;

    const ctx = output.getContext("2d");

    let flowers = new Array()
    let idNum = 0

    const hana = new Image();
    hana.src = "images/hana.png";

    const whiteGarbera = new Image();
    whiteGarbera.src = "images/whiteGarbera.png";

    video.addEventListener('loadeddata', async () => {
        setInterval(async () => {

            const bodies = await net.segmentMultiPerson(video);

            bodies && bodies.map((body) => {
                const leftEye = body.pose.keypoints[1]
                const rightEye = body.pose.keypoints[2]
                if (leftEye.score > 0.6 && rightEye.score > 0.6) {
                    const nose = body.pose.keypoints[0]
                    const scale = Math.abs(leftEye.position.x - rightEye.position.x)
                    const pause = Date.now()

                    let id = 1
                    let idExist = false
                    flowers.length > 1 &&
                        flowers.map((f) => {
                            const dist = Math.sqrt(Math.pow((nose.position.x - f.x), 2) + Math.pow((nose.position.y - f.y), 2));
                            // console.log(`nose.x: ${nose.position.x}`)
                            // console.log(`f.x: ${f.x}`)
                            // console.log(`dist: ${dist}`)
                            // console.log(`f.scale: ${f.scale}`)
                            if (dist < f.scale * 3) {
                                id = f.id
                                idExist = true
                            }
                        })
                    if (flowers.length > 1 && !idExist) {
                        id = idNum
                        idNum += 1
                    }

                    const flower = {
                        x: nose.position.x,
                        y: nose.position.y,
                        scale: scale,
                        time: pause,
                        id: id
                    }
                    flowers.push(flower);
                }
            });


            // clear
            ctx.clearRect(0, 0, 1080, 720);

            // draw
            console.log(flowers)
            flowers.map((f) => {
                if (f.id % 2 != 0) {
                    ctx.drawImage(hana, output.width - f.x - f.scale / 2, f.y - f.scale / 2, f.scale, f.scale)
                }else{
                    ctx.drawImage(whiteGarbera, output.width - f.x - f.scale / 2, f.y - f.scale / 2, f.scale, f.scale)
                }
            })

            // renew
            const now = Date.now()
            flowers.map((f, idx) => {
                if (now - f.time > 2000) {
                    flowers.splice(idx, 1)
                }
            })

        }, 200)

    })
}
main();
