const container=document.getElementById('container')
const grid=document.getElementById('grid')
const cover=document.getElementById('cover')
const startBtn=document.getElementById('play')
const scoreSpan=document.getElementById('score')
const scorePlus=document.getElementById('plus')
const gameover=document.getElementById('gameover')

//create the game grid
for (let row=0; row<4; row++){
  for (let col=0; col<4; col++){
    const square=document.createElement('div')
    const number=document.createElement('h1')
    square.appendChild(number)
    square.classList.add('square')
    grid.appendChild(square)

    const squareCover=square.cloneNode(true)
    cover.appendChild(squareCover)
  }
}
const squares=grid.querySelectorAll('.square')
const numbers=grid.querySelectorAll('.square h1')
const squareCovers=cover.querySelectorAll('.square')
const numberCovers=cover.querySelectorAll('.square h1')
let data=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
let score=0
let stepTimer //track if step/animation is undergoing
let step=96 //box size in px(how much to move)
let bigFontSize=41  //measure for grow letters effect
if (window.innerWidth<400) {
  step=squares[0].offsetWidth+6
  if (window.innerWidth<300) bigFontSize=28
  else bigFontSize=36
}
window.onresize=()=>{
  if (window.innerWidth<400) {
    step=squares[0].offsetWidth+6
    if (window.innerWidth<300) bigFontSize=28
    else bigFontSize=36
  }
  else {
    step=96
    bigFontSize=41
  }
}
let delay=200 //step/animation timer length in milliseconds
let elementsToUpdate=[] //queue for elements to be updated per step
let elementsToGrow=[] //elements that are result of combination

function emptySpots(){
  return data.reduce((empty, n, i)=>n===0 ? empty.concat(i) : empty, [])
}

function rollTwoOrFour(){
  const roll=Math.random()
  if (roll>0.9) return 4
  return 2
}

function dataSets(direction){
  let sets=[]
  let counter=[0, 1, 2, 3]
  if (direction==='left' || direction==='up') counter=[3, 2, 1, 0]
  for (let i=0; i<4; i++){
    let a=i
    if (direction==='left' || direction==='right') a*=4
    let indices=counter.map(n=>{
      let b=n
      if (direction==='down' || direction==='up') b*=4
      return a+b
    })
    const numbers=indices.map(index=>data[index])
    sets.push({numbers, indices})
  }
  return sets
}


function hasConsecutive(){
  let rows=dataSets('right')
  let cols=dataSets('down')
  for (let i=0; i<4; i++){
    for (let e=0; e<3; e++){
      if(rows[i].numbers[e]===rows[i].numbers[e+1] || cols[i].numbers[e]===cols[i].numbers[e+1]) return true
    }
  }
  return false
}

function updateSquare(n, position, cover=false){
  let square
  let number
  if (cover) {
    square=squareCovers[position]
    number=numberCovers[position]
  } else {
    square=squares[position]
    number=numbers[position]
  }
  square.className='square'
  if (!n) {
    number.textContent=''
  } else {
    square.classList.add('n'+n)
    number.textContent=n
  }
}

function gameOver(){
  document.removeEventListener('keydown', control)
  container.removeEventListener('touchstart', handleTouchStart);
  container.removeEventListener('touchmove', handleTouchMove);
  
  console.log('GAME OVER')
  container.classList.add('gameover')
  gameover.style.display='initial'
}

//rolls a new number and puts on an empty(random) spot
function rollRandomEmptySpot(){
  const empty=emptySpots()
  if (!empty.length) return
  const randomSquare=Math.floor(Math.random()*empty.length)
  const twoOrFour=rollTwoOrFour()
  const index=empty[randomSquare]
  data[index]=twoOrFour
  updateSquare(twoOrFour, index)
  updateSquare(twoOrFour, index, true)
  if (empty.length===1 && !hasConsecutive()) gameOver()
}

//checks if a set of four numbers can be shifted
function canChangeSet(set, reverse=false){
  const lastSetIndex=set.length-1
  if (reverse && set[lastSetIndex]===0) {
    return canChangeSet(set.slice(0,lastSetIndex), reverse)
  }
  if (!reverse && set[0]===0) {
    return canChangeSet(set.slice(1))
  }
  if (set.includes(0)) {
    return true
  }
  if (!reverse){
    for (let i=0; i<lastSetIndex; i++){
      if (set[i]===set[i+1]) return true
    }
  } else {
    for (let i=lastSetIndex; i>0; i--){
      if (set[i]===set[i-1]) return true
    }
  }
  return false
}

function moveSquare(direction, index, steps){
  let squareCover=squareCovers[index]
  squareCover.style.opacity=1
  squareCover.style.zIndex=steps+1
  squareCover.style.transition='transform '+delay/1000+'s'
  switch (direction){
    case 'left':
      squareCover.style.transform=`translateX(-${step*steps}px)`
      break
    case 'right':
      squareCover.style.transform=`translateX(${step*steps}px)`
      break
    case 'up':
      squareCover.style.transform=`translateY(-${step*steps}px)`
      break
    case 'down':
      squareCover.style.transform=`translateY(${step*steps}px)`
  }
}

function finishBoardUpdate(){
  stepTimer=false
  elementsToUpdate.forEach(([number, index, newIndex])=>{

    squareCovers[index].removeAttribute('style')

    updateSquare(number, newIndex)
    updateSquare(number, newIndex, true)
    updateSquare(0, index, true)
    if (elementsToGrow.includes(newIndex)) {
      let currentSize=bigFontSize
      if (number>1000 && bigFontSize!==28) {
        if (bigFontSize===41) currentSize=36
        else currentSize=32
      }
      numbers[newIndex].style.transition='none'
      numbers[newIndex].style.fontSize=currentSize+'px'
    }
  })
  elementsToUpdate=[]
  grid.offsetHeight //triggers document reflow to display style changes
  elementsToGrow.forEach(index=>{
    let number=numbers[index]
    number.removeAttribute('style')
    number.style.transition='font-size 0.4s'
    number.ontransitionend=()=>number.removeAttribute('style')
  })
  elementsToGrow=[] 
  rollRandomEmptySpot()
}

function updateScore(n){

  const getClassNumber=(n)=>{
    for (let i=2; i<10000; i*=2){
      if (n===i) return i
      if (n<i) return i/2
    }
  }
  scorePlus.className='n'+getClassNumber(n)
  scorePlus.textContent='+'+n
  scorePlus.style.transition='none'
  scorePlus.style.opacity=1
  grid.offsetHeight //triggers document reflow to display style changes
  score+=n
  scoreSpan.textContent=score
  scorePlus.style.transition='opacity 0.5s ease-in 0.3s'
  scorePlus.style.opacity=0
  scorePlus.ontransitionend=()=>scorePlus.removeAttribute('style')
}

function shiftDirection(direction){
  
  if (stepTimer) {
    clearTimeout(stepTimer)
    finishBoardUpdate()
  }
  
  let sets=dataSets(direction)
  let change=false

  for (let i=0; i<sets.length; i++){
    if (canChangeSet(sets[i].numbers)) {
      change=true
      break
    }
  }
  if (!change) return

  let scoreToAdd=0
  sets.forEach(({numbers: set, indices})=>{
    if (canChangeSet(set)){
      let steps=0
      let last=0

      for (let i=set.length-1; i>=0; i--){
        let number=set[i]
        let index=indices[i]
        if (!number) {
          steps++
        } else {
          if (number===last) {
            last=0
            steps++
            number=number*2
            scoreToAdd+=number
            elementsToGrow.push(indices[i+steps])
          } else {
            last=number
          }
          if (steps) {
            let newIndex=indices[i+steps]
            data[index]=0
            data[newIndex]=number
            updateSquare(0, index)  //set old position to zero
            moveSquare(direction, index, steps)
            elementsToUpdate.push([number, index, newIndex])
          }
        }
      }
    }
  })
  if (scoreToAdd) updateScore(scoreToAdd)
  stepTimer=setTimeout(finishBoardUpdate, delay)
}

function control(e){
  switch(e.keyCode){
    case 37:
      shiftDirection('left')
      break
    case 38:
      shiftDirection('up')
      break
    case 39:
      shiftDirection('right')
      break
    case 40:
      shiftDirection('down')
  }
}

function displayGrid(){ //draws whole grid on the html
  data.forEach((n, i)=>{
    updateSquare(n, i)
    updateSquare(n, i, true)
  })
}

function startGame(){
  console.log('Starting New Game!!!')
  data=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  //data=testData
  score=0
  scoreSpan.textContent=score
  container.className=''  //clears "game over" tag
  gameover.style.display='none'
  displayGrid()
  rollRandomEmptySpot()
  rollRandomEmptySpot()

  document.addEventListener('keydown', control)
  container.addEventListener('touchstart', handleTouchStart, false);
  container.addEventListener('touchmove', handleTouchMove, false);
  
}
startGame()
startBtn.addEventListener('click', startGame)

//Following touchscreen detect swipe movement is mostly borrowed by Stackoverflow
var xDown = null;                                                        
var yDown = null;

function handleTouchStart(evt) {
  const firstTouch = evt.touches[0];                                      
  xDown = firstTouch.clientX;                                      
  yDown = firstTouch.clientY;                                      
}   

function handleTouchMove(evt) {
  evt.preventDefault()
  if ( ! xDown || ! yDown ) return

  var xUp = evt.touches[0].clientX;                                    
  var yUp = evt.touches[0].clientY;
  var xDiff = xDown - xUp;
  var yDiff = yDown - yUp;
    
  if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
    if ( xDiff > 0 ) {
        /* right swipe */ 
      shiftDirection('left')
    } else {
        /* left swipe */
      shiftDirection('right')
    }                       
  } else {
    if ( yDiff > 0 ) {
      /* down swipe */
    shiftDirection('up')
    } else {
        /* up swipe */
      shiftDirection('down')
    }                                                                 
  }
  /* reset values */
  xDown = null;
  yDown = null;                                             
};