
function getPixel(x, y, { width, data }) {
  const index = (x + y * width) * 4

  // Approximation color
  return (data[index] >> 4 & 0xF) << 20 | (data[index+1] >> 4 & 0xF) << 12 | (data[index+2] >> 4 & 0xF) << 4

  // Full color
  // return data[index] << 16 | data[index+1] << 8 | data[index+2]
}

function addRef(color, refs) {
  const index = refs.findIndex(([col]) => col === color)
  if (index > -1) {
    refs[index][1]++
  } else {
    refs.push([color, 1])
  }
}

function mixRefs (as, bs) {
  const list = as.filter((a) => bs.find(b => b.color === a.color))
  if (list.length === 0) {
    return as
  }
  return list
}

function sortColorCount (a, b) { return b.count - a.count }

const inputImg = document.getElementById('input')
inputImg.onload = function () {
  const canvas = document.getElementById("output")
  canvas.width = inputImg.width
  canvas.height = inputImg.height

  const ctx = canvas.getContext("2d");
  ctx.drawImage(inputImg, 0, 0);

  const colors = []
  
  console.time('Extract image colors')
  const imageData = ctx.getImageData(0, 0, inputImg.width, inputImg.height)
  for (let x = 1; x < imageData.width - 1; x++) {
    for (let y = 1; y < imageData.height - 1; y++) {
      const color = getPixel(x, y, imageData)
      let colorData = colors.find((data) => data.color === color)
      if (!colorData) {
        colorData = {
          color,
          count: 1,
          // refsT: [], // [color, count]
          refsR: [],
          refsB: [],
          // refsL: []
        }
        colors.push(colorData)
      } else {
        colorData.count++
      }

      // addRef(getPixel(x, y-1, imageData), colorData.refsT)
      addRef(getPixel(x+1, y, imageData), colorData.refsR)
      addRef(getPixel(x, y+1, imageData), colorData.refsB)
      // addRef(getPixel(x-1, y, imageData), colorData.refsL)
    }
  }
  console.timeEnd('Extract image colors')

  console.time('Sort image colors')
  colors.sort(sortColorCount)
  colors.forEach(colorData => {
    // colorData.refsT.sort(sortColorCount)
    colorData.refsR.sort(sortColorCount)
    colorData.refsB.sort(sortColorCount)
    // colorData.refsL.sort(sortColorCount)
  })
  console.timeEnd('Sort image colors')
  
  console.log('imageData.width:', imageData.width)

  console.time('Generate image colors')
  const dataArray = new Uint8ClampedArray(imageData.data.length)
  for (let y = 0; y < imageData.height; y++) {
    let color = -1
    for (let x = 0; x < imageData.width; x++) {
      const index = (x + y * imageData.width) * 4

      if (x === 0 && y === 0) {
        color = colors[0].color
      } else {

        const colorLeft = x > 0 ? getPixel(x - 1, y, { width: imageData.width, data: dataArray }) : -1
        const colorTop = y > 0 ? getPixel(x, y - 1, { width: imageData.width, data: dataArray }) : -1

        try {
          const colorList = colorTop > -1 && colorLeft > -1 ?
            mixRefs(
              colors.find(colorData => colorData.color === colorTop).refsB,
              colors.find(colorData => colorData.color === colorLeft).refsR
            ) :
            colorTop > -1 ? colors.find(colorData => colorData.color === colorTop).refsB :
            colorLeft > -1 ? colors.find(colorData => colorData.color === colorLeft).refsR :
            [colors[Math.floor(Math.random() * colors.length)]]
  
          const i = Math.floor(Math.random() * colorList.length)
          color = colorList[i][0]

          if (x === 1) {
            console.log('x = 1')
            console.log('colorList:', colorList, 'i:', i, 'colorTop:', colorTop, 'colorLeft:', colorLeft, 'color:', colorList[i].color)
          }

          // if (color === 0) {
          //   console.log('Color 0')
          //   console.log('x:', x, 'y:', y, 'i:', i, colors.map(c => c.color))
          // }

        } catch (err) {
          console.log('Color top 0')
          console.log('x:', x, 'y:', y, 'current index:', index, 'colorLeft:', colorLeft, 'colorTop:', colorTop, 'left index:', ((x - 1) + y * imageData.width) * 4, 'top index:', (x + (y - 1) * imageData.width) * 4 , colors.map(c => c.color), dataArray)
          throw err
        }
      }


      // Approximation color
      // dataArray[index] = (color >> 8) & 0xF
      // dataArray[index + 1] = (color >> 4) & 0xF
      // dataArray[index + 2] = (color) & 0xF
      // dataArray[index + 3] = 0xFF


      // Full color

      if (index === 2) {
        console.log('save', 'index:', index, 'color:', color, 'r:', (color >> 16) & 0xFF)
      }

      dataArray[index] = (color >> 16) & 0xFF
      dataArray[index + 1] = (color >> 8) & 0xFF
      dataArray[index + 2] = (color) & 0xFF
      dataArray[index + 3] = 0xFF
    }
  }
  console.timeEnd('Generate image colors')

  console.log(dataArray)

  ctx.putImageData(new ImageData(dataArray, imageData.width), 0, 0)
}

// function addNewBlock(dataArray, index, width, height) {

// }

