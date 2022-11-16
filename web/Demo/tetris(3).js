const { floor, sin, cos, random, PI } = Math,
  // 最小值
  min = (...args) => args.reduce((p, c) => (p < c ? p : c), args[0]),
  // 最大值
  max = (...args) => args.reduce((p, c) => (p < c ? c : p), args[0]),
  // 范围在 min 到 max 随机整数
  randInt = (max, min = 0) => floor(random() * (max - min)) + floor(min),
  // 随机获取数组种的元素
  randItem = (...args) => args[randInt(args.length)],
  // 角度转弧度
  rad = (angle) => (angle * PI) / 180;
/**
 * collisionDetection
 *
 * 碰撞检测函数，返回布尔类型。
 *
 * @param {array} tetris 砖块
 * @param {number} top
 * @param {number} left
 * @param {number} rows 背景总行数
 * @param {number} columns 背景总列数
 * @param {array} background 背景数据
 * @returns boolean 真值表示通过检测
 */
const collisionDetection = (tetris, top, left, rows, columns, background) => {
  const maxColumn = max(...tetris.map(([, column]) => column)),
    maxRow = max(...tetris.map(([row]) => row)),
    minColumn = min(...tetris.map(([, column]) => column));
  try {
    return !(
      left + maxColumn > columns ||
      left + minColumn < 0 ||
      top + maxRow >= rows ||
      tetris.some(([row, column]) => background[top + row][left + column] != 0)
    );
  } catch {
    return false;
  }
};
/**
 * tetris 砖块
 *
 * 俄罗斯方块中，组成各个砖块的最小正方形基本单元称为方块（Tile）；
 * 由若干个方块（Tile）组成的形状，称为砖块（Tetris）。
 * 被玩家或AI操控的砖块（Tetris），称为活动砖块（Active Tetris）。
 *
 * 移动：move
 * 旋转：rotate
 *
 * 算法：碰撞检测、
 *
 * 基本的子类型： S，T，J，L，O，Z，I
 */
class Tetris {
  constructor(top, left, rows, columns, background) {
    // 对象属性一次性赋值
    Object.assign(this, { rows, columns, background });
    // 位置 position
    this.position = { top, left };
    // 保存方块排列的数组
    this.tetris = [];
    this.color = "";
    // 调用初始化方法
    this.init();
    // 模拟事件处理函数通知 Game 类型实例处理方块的销毁事件
    this.onStop = undefined;
  }
  /**
   * init 初始化属性方法，为子类覆盖提供接口函数。
   */
  init() {}
  /**
   * move
   * 改变方块的位置，并且进行碰撞检测。
   *
   * @param {string} direction left | right | down
   */
  move(direction) {
    const {
      position: { left, top },
      rows,
      columns,
      background,
      tetris,
    } = this;
    if (direction == "left") {
      if (
        collisionDetection(
          tetris.map(([row, column]) => [row, column - 1]),
          top,
          left,
          rows,
          columns,
          background
        )
      )
        this.position.left -= 1;
    } else if (direction == "right") {
      if (
        collisionDetection(
          tetris.map(([row, column]) => [row, column + 1]),
          top,
          left,
          rows,
          columns,
          background
        )
      )
        this.position.left += 1;
    } else if (direction == "down") {
      if (
        collisionDetection(
          tetris.map(([row, column]) => [row + 1, column]),
          top,
          left,
          rows,
          columns,
          background
        )
      ) {
        this.position.top += 1;
      } else {
        // 无法下坠，消息通知方块实例已经不能移动
        this.onStop?.(); // ?. 可选链运算符
      }
    }
  }
  /**
   * rotate
   * 旋转方块
   * @param {string} direction left | right
   */
  rotate(direction = "right") {
    // x1 = cos(a) * x - sin(a) * y, y1 = cos(a) * y + sin(a) * x
    // 由于 a = 90, 所以：x1 = -y, y = x
    // 根据公式进行映射
    let tetris =
      direction == "left"
        ? this.tetris.map(([row, column]) => [-column, row])
        : this.tetris.map(([row, column]) => [column, -row]);
    // 修正所有坐标
    const columnOffset = -min(...tetris.map(([, column]) => column)),
      rowOffset = -min(...tetris.map(([row]) => row));
    tetris = tetris.map(([row, column]) => [
      row + rowOffset,
      column + columnOffset,
    ]);
    // 进行碰撞检测：不能超出左右边界且在背景中没有被阻挡。
    const {
      position: { left, top },
      rows,
      columns,
      background,
    } = this;
    if (!collisionDetection(tetris, top, left, rows, columns, background))
      return;
    this.tetris = tetris;
  }
  /**
   * width 当前方块的宽度  * 使用 get 属性写法实现
   */
  get width() {
    return max(...this.tetris.map(([, column]) => column)) + 1;
  }
  /**
   * height 当前方块的高度
   */
  get height() {
    return max(...this.tetris.map(([row]) => row)) + 1;
  }
  /**
   * 使用生成器函数实现迭代器，返回在容器背景的真实位置！
   */
  *[Symbol.iterator]() {
    for (let [row, column] of this.tetris) {
      yield [this.position.top + row, this.position.left + column];
    }
  }
}

/**
 * 7种基本砖块：
 * T, J, O, S, L, I, Z
 */
class T extends Tetris {
  /** */
  init() {
    this.color = "purple";
    this.tetris = [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1],
    ];
  }
}

class J extends Tetris {
  init() {
    this.color = "blue";
    this.tetris = [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
    ];
  }
}
/**
 * O型方块
 * 使用公式旋转，不论如何都存在修正的。
 * 但其实 O 型方块不需要旋转，因此直接覆盖父类旋转方法。
 */
class O extends Tetris {
  init() {
    this.color = "yellow";
    this.tetris = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ];
  }
  // 子类可以覆盖旋转方法，以支持自己的特有旋转方式。
  rotate() {}
}
class S extends Tetris {
  init() {
    this.color = "green";
    this.tetris = [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
    ];
  }
}
class L extends Tetris {
  init() {
    this.color = "orange";
    this.tetris = [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
    ];
  }
}

const posture = {
  h: [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
  ],
  v: [
    [-1, 1],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
};
class I extends Tetris {
  init() {
    this.color = "cyan";
    this.tetris = posture["h"];
    this.state = "h";
  }
  rotate() {
    this.state = this.state == "h" ? "v" : "h";
    // 进行碰撞检测
    const {
      position: { left, top },
      rows,
      columns,
      background,
    } = this;
    if (
      collisionDetection(
        posture[this.state],
        top,
        left,
        rows,
        columns,
        background
      )
    )
      this.tetris = posture[this.state];
  }
}

class Z extends Tetris {
  init() {
    this.color = "red";
    this.tetris = [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ];
  }
}

/**
 * Timer
 *
 * 计时器类，记录毫秒数。精度：100毫秒
 *
 * 开始：start
 * 暂停: stop
 * 重置: reset
 *
 */
class Timer {
  constructor(delay = 100) {
    this.delay = delay;
    // 累计毫秒数
    this._count = 0;
    this.timerId = undefined;
    // 计时更新事件
    this.onUpdate = undefined;
  }
  start() {
    if (!this.timerId)
      this.timerId = setInterval(() => {
        this._count += this.delay;
        this.onUpdate?.(this._count);
      }, this.delay);
  }
  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }
  reset() {
    this.stop();
    this._count = 0;
  }
  get count() {
    return this._count;
  }
}

/**
 * Game 控制游戏、绘制画面
 *
 * 游戏背景: background = [rows, columns]
 *
 * 开始游戏：start
 * 暂停游戏：pause
 * 终止游戏：end
 *
 * 算法：游戏结束检测、记录得分
 */
class Game {
  /**
   * 构造函数
   *
   * @param {HTMLElement} container
   * @param {number} width 300
   * @param {number} height 600
   * @param {number} rows 20
   * @param {number} columns 10
   */
  constructor(container, width = 300, height = 600, rows = 20, columns = 10) {
    // 保存实例属性
    this.container = container;
    this.width = width;
    this.height = height;
    this.rows = rows;
    this.columns = columns;
    // 初始化 background 数组 [rows, columns]
    this.background = [];
    // 生成 canvas 的 DOM 对象
    const el = document.createElement("canvas");
    el.width = width;
    el.height = height;
    container.appendChild(el);
    // 获取 context 对象
    this.ctx = el.getContext("2d");
    // 获取合理的方块长度
    this.size = min(width / columns, height / rows);
    // 当前状态：未开始(init)、正在游戏中(running)、暂停(pause)、结束(end)
    this.status = "init";
    // 游戏计分
    this.score = 0;
    // 时间累计
    this.timer = new Timer();
    // 创建事件: update
    this.onUpdate = undefined;
  }

  /**
   * start 控制游戏开始
   */
  start() {
    if (this.status == "running" || this.status == "pause") {
      return alert("上局游戏未结束，无法开始新游戏！");
    }
    const { ctx, width, height, size, rows, columns, background } = this;
    this.status = "running";
    this.score = 0;
    // 清除所有数组元素
    background.length = 0;
    // 初始化背景
    background.unshift(
      ...new Array(rows).fill(0).map(() => new Array(columns).fill(0))
    );
    // 重置计时器
    this.timer.reset();
    // 当前活动砖块
    let active;
    // 处理当前活动方块的销毁
    const doStop = () => {
      // 记录当前方块销毁的位置
      if (active)
        for (let [row, column] of active)
          background[row][column] = active.color;
      // 移除行
      for (let row = rows - 1; row >= 0; row--)
        if (background[row].every((i) => i != 0)) background.splice(row, 1);
      const lines = rows - background.length;
      if (lines) {
        this.score += lines * lines;
        background.unshift(
          ...new Array(lines).fill(0).map(() => new Array(columns).fill(0))
        );
      }
      // 随机新方块
      active = new (randItem(T, J, O, S, L, I, Z))(
        0,
        columns / 2 - 2,
        rows,
        columns,
        background
      );
      active.onStop = doStop;
      // 游戏结束条件：新砖块的初始状态在背景中有颜色
      if (
        Array.from(active).some(([row, column]) => background[row][column] != 0)
      ) {
        // 清除自动下坠计时器
        clearInterval(timerId);
        // 移除键盘监听事件函数
        document.removeEventListener("keydown", onKeyDown);
        // 设置游戏状态
        this.status = "end";
        // 停止计时
        this.timer.stop();
      }
      // 通知状态变化
      this.onUpdate(this);
    };
    doStop();
    // 自动下坠
    const timerId = setInterval(() => {
      if (this.status == "pause") return;
      active.move("down");
    }, 1000);
    // 注册键盘监听事件
    const onKeyDown = (event) => {
      if (this.status != "running") return;

      if (event.code == "ArrowLeft") active.move("left");
      else if (event.code == "ArrowRight") active.move("right");
      else if (event.code == "ArrowDown") active.move("down");
      else if (event.code == "Space") active.rotate();
      else if (event.code == "ArrowUp") active.rotate("left");
      // console.log(event.code);
    };
    document.addEventListener("keydown", onKeyDown);
    // draw 绘制游戏内容
    const draw = () => {
      if (this.status == "end") return;
      // 清除上一帧
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);

      // 绘制背景
      for (let row = 0; row < rows; row++)
        for (let column = 0; column < columns; column++)
          if (background[row][column] != 0) {
            ctx.fillStyle = background[row][column];
            ctx.fillRect(column * size, row * size, size, size);
          }
      // 绘制当前活动的方块
      ctx.fillStyle = active.color;
      for (let [row, column] of active) {
        ctx.fillRect(column * size, row * size, size, size);
      }
      // 绘制参考线
      // ctx.strokeStyle = "rgba(255, 255, 255, 1)";
      ctx.strokeStyle = "black";
      ctx.beginPath();
      for (let i = 0; i < rows; i++) {
        ctx.moveTo(0, i * size);
        ctx.lineTo(width, i * size);
      }
      for (let i = 0; i < columns; i++) {
        ctx.moveTo(i * size, 0);
        ctx.lineTo(i * size, height);
      }
      ctx.stroke();
      // 请求绘制下一帧游戏内容 (递归)
      requestAnimationFrame(draw);
    };
    // 绘制游戏第一帧
    requestAnimationFrame(draw);
    // 开始计时
    this.timer.start();
    // 更新状态
    this.onUpdate(this);
  }
  /**
   * pause 暂停游戏
   */
  pause() {
    if (this.status == "running") {
      this.status = "pause";
      this.timer.stop();
    } else if (this.status == "pause") {
      this.status = "running";
      this.timer.start();
    }
    this.onUpdate(this);
  }
  /**
   * end 停止游戏
   */
  end() {}
}
