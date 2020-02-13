const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter

// Number of cells
// let cellsHorizontal = 6
// let cellsVertical = 4

// Maze size
const width = window.innerWidth
const height = window.innerHeight * .9

// Cell size
const unitLengthX = width / cellsHorizontal
const unitLengthY = height / cellsVertical

const engine = Engine.create()
engine.world.gravity.y = 0

const { world } = engine
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height
  }
})
Render.run(render)
Runner.run(Runner.create(), engine)


// Walls
const walls = [
  // Top
  Bodies.rectangle(
    width / 2, 
    0, 
    width, 
    8, 
    { 
     isStatic: true,
      render: {
        fillStyle: 'transparent'
      } 
    }
  ),
  // Bottom
  Bodies.rectangle(
    width / 2, 
    height, 
    width, 
    8, 
    { 
     isStatic: true,
      render: {
        fillStyle: '#904e95'
      } 
    }
  ),
  // Left
  Bodies.rectangle(
    0, 
    height / 2, 
    8, 
    height, 
    { 
     isStatic: true,
      render: {
        fillStyle: '#904e95'
      } 
    }
  ),
  // Right
  Bodies.rectangle(
    width, 
    height / 2, 
    8, 
    height, 
    { 
     isStatic: true,
      render: {
        fillStyle: '#904e95'
      } 
    }
  )
]
World.add(world, walls)

// Maze Generation
const shuffle = (arr) => {
  let counter = arr.length
  
  while (counter > 0) {
    const index = Math.floor(Math.random() * counter)
    
    counter --
    
    const temp = arr[counter]
    arr[counter] = arr[index]
    arr[index] = temp
  }
  return arr
}

const grid = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false))
  
const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false))
  
const horizontals = Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false))

const startRow = Math.floor(Math.random() * cellsVertical)
const startColumn = Math.floor(Math.random() * cellsHorizontal)

const mazePath = (row, column) => {
  // if I had visited cell at [row, column], then return
  if (grid[row][column]) {
    return
  }
  
  // mark this cell as being visited
  grid[row][column] = true
  
  // assemble randomly-ordered list of neighbors
  const neighbors = shuffle([
    [row - 1, column, 'up'],
    [row, column + 1, 'right'],
    [row + 1, column, 'down'],
    [row, column -1,'left']
  ])

  // for each neigbor...
  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor
    
    // see if that neighbor is out of bounds
    if (nextRow < 0 || 
        nextRow >= cellsVertical || 
        nextColumn < 0 || 
        nextColumn >= cellsHorizontal
    ) {
      continue
    }
    // if we have visited that neighbor, continue to next neighbor
    if (grid[nextRow][nextColumn]) {
      continue
    }
    // remove a wall from either horizontals or verticals
    if (direction === 'left') {
      verticals[row][column - 1] = true
    } else if (direction === 'right') {
      verticals[row][column] = true
    } else if (direction === 'up') {
      horizontals[row - 1][column] = true
    } else if (direction === 'down') {
      horizontals[row][column] = true
    }
    
    mazePath(nextRow, nextColumn)
  }
  // visit that next cell
}
mazePath(startRow, startColumn)

// Horizontal Walls
horizontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return
    }
    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      2,
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: 'red'
        }
      }
    )
    World.add(world, wall)
  })
})  

// Vertical Walls
verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return
    }
    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      2,
      unitLengthY,
      {
        label:'wall',
        isStatic: true,
        render: {
          fillStyle: 'red'
        }
      }
    )
    World.add(world, wall)
  })
})


// Goal
const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * .5,
  unitLengthY * .5,
  {
    label: 'goal',
    isStatic: true,
    render: {
      fillStyle: 'green'
    }
  }
)
World.add(world, goal)

// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4

const ball = Bodies.circle(
  unitLengthX / 2,
  unitLengthY / 2,
  ballRadius,
  {
    label: 'ball',
    isStatic: true,
    render: {
      fillStyle: 'blue'
    }
  }
)
World.add(world, ball)

document.addEventListener('keydown', event => {
  const { x, y } = ball.velocity
  
  // Up (up arrow or W)
  if (event.keyCode === 38 || event.keyCode === 87) {
    Body.setVelocity(ball, { x, y: y - 3.5 })
  }
  // Right (right arow or D)
  if (event.keyCode === 39 || event.keyCode === 68) {
    Body.setVelocity(ball, { x: x + 3.5, y })
  }
  // Down (down arrow or S)
  if (event.keyCode === 40 || event.keyCode === 83) {
    Body.setVelocity(ball, { x, y: y + 3.5 })
  }
  // Left (left arrow or A)
  if (event.keyCode === 37 || event.keyCode === 65) {
    Body.setVelocity(ball, { x: x - 3.5, y })
  }
})

// Win Condition
Events.on(engine, 'collisionStart', event => {
  event.pairs.forEach(collision => {
    const labels = ['ball', 'goal']
    
    // console.log(collision.bodyA.label)
    if (
      labels.includes(collision.bodyA.label) && 
      labels.includes(collision.bodyB.label)
     ) {
       timerStop()
       increaseCells()
       winningMessage()
       
       world.gravity.y = 1
       Body.setStatic(ball, true)
       world.bodies.forEach(body => {
         if (body.label === 'wall') {
           Body.setStatic(body, false)
         }
       })
    }
  })
})

