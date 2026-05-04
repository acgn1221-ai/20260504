let video; // Renamed from 'capture' to 'video' for consistency with ml5 example
let faceMesh;
let faces = [];

function preload() {
  // Initialize FaceMesh model with a maximum of one face.
  // 'flipped: false' because the video input from createCapture will NOT be flipped initially.
  // The mirroring will be applied by p5.js's transformation matrix in draw().
  faceMesh = ml5.faceMesh({ maxFaces: 1, flipped: false });
}

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  // Do NOT use { flipped: true } here, as we will apply mirroring via p5.js's transformation matrix.
  video = createCapture(VIDEO);
  // 隱藏預設產生的 HTML video 元素，只在 canvas 內繪製
  video.hide();

  // Start detecting faces
  // The 'gotFaces' callback will be called when faces are detected.
  faceMesh.detectStart(video, gotFaces);
}

// Callback function for when face data is received from ml5.js
function gotFaces(results) {
  faces = results;
}

// Function called when the mouse is pressed
function mousePressed() {
  // Log detected face data to the console
  console.log(faces);
}

function windowResized() {
  // 當視窗大小改變時，重新調整畫布
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  // 設定背景顏色為 e7c6ff
  background('#e7c6ff');

  // 計算顯示寬高 (全螢幕的 50%)
  let displayWidth = windowWidth * 0.5;
  let displayHeight = windowHeight * 0.5;
  // 計算置中座標
  let x = (windowWidth - displayWidth) / 2;
  let y = (windowHeight - displayHeight) / 2;

  push();
  // 實作左右顛倒：平移到目標區域的右緣，並水平縮放 -1。
  // 這裡的 translate(x + displayWidth, y) 是為了讓 scale(-1, 1) 作用後，
  // 影像的左上角 (0,0) 仍然對應到畫布上的 (x,y) 區域的左上角。
  // 也就是說，影像會從 (x,y) 繪製到 (x+displayWidth, y+displayHeight)，但內容是左右顛倒的。
  translate(x + displayWidth, y);
  scale(-1, 1);
  image(video, 0, 0, displayWidth, displayHeight);
  pop();

  // 確保至少偵測到一張臉
  if (faces.length > 0) {
    let face = faces[0];

    // 在偵測到的臉部上繪製關鍵點
    for (let i = 0; i < face.keypoints.length; i++) {
      let keypoint = face.keypoints[i];
      // ml5.js 返回的座標是基於原始未翻轉的影像。
      // 為了在翻轉後的影像上正確繪製，我們需要將 x 座標進行反向映射。
      // 原始影像的 x 座標 (0 到 video.width) 映射到顯示區域的 (x 到 x+displayWidth)。
      // 由於顯示區域是翻轉的，所以 keypoint.x = 0 應該在顯示區域的右側，keypoint.x = video.width 應該在左側。
      let scaledX = x + displayWidth - (keypoint.x * (displayWidth / video.width));
      let scaledY = y + keypoint.y * (displayHeight / video.height);

      stroke(255, 255, 0); // 黃色
      strokeWeight(2);
      point(scaledX, scaledY);
    }
  }
}
