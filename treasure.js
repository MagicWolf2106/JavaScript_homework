/**
 * 寻宝游戏 · 异步逻辑层
 * ------------------------------------------------------------------
 * 知识点：Promise、async/await 串行流程、异步失败重试、事件回调
 * 说明：本文件既可以用 Node 直接运行（console.log 看结果），
 *       也可以被浏览器动画页面 index.html 加载调用。
 */

// ==================== 1. 模拟宝藏地图 API ====================
class TreasureMap {
  // 通用工具：把 setTimeout 包装成 Promise，方便做延时
  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 图书馆：找到第一个线索
  static getInitialClue() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("在古老的图书馆里找到了第一个线索...");
      }, 1000);
    });
  }

  // 破译古文字
  static decodeAncientScript(clue) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!clue) {
          reject("没有线索可以解码!");
          return;
        }
        resolve("解码成功!宝藏在一座古老的神庙中...");
      }, 1500);
    });
  }

  // 【新增情节】穿越流沙沙漠：有一定概率被沙暴困住
  static crossDesert(location) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.2) {
          reject("沙暴来袭，你被流沙困住了!");
          return;
        }
        resolve("穿过滚烫的流沙沙漠，远处浮现出神庙的轮廓...");
      }, 1800);
    });
  }

  // 【新增情节】破解神庙石碑上的谜题
  static solveStonePuzzle() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("石碑上的古老符文被逐一拼合，沉重的石门缓缓开启...");
      }, 1300);
    });
  }

  // 神庙守卫：随机触发战斗（对峙失败则被击退）
  static fightGuardian() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.25) {
          reject("糟糕!遇到了神庙守卫，你被击退了!");
          return;
        }
        resolve("你机智地绕开了神庙守卫，继续向神庙深处前进...");
      }, 1600);
    });
  }

  // 搜寻神秘宝箱
  static searchTemple(location) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.25) {
          reject("在一堆碎石中迷失了方向，没能找到箱子!");
          return;
        }
        resolve("在祭坛的正中央，你找到了一个神秘的箱子...");
      }, 2000);
    });
  }

  // 【新增情节】解开宝箱上的魔法封印
  static unlockSeal() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("你把石碑上得到的符文按顺序嵌入凹槽，封印应声而碎...");
      }, 1200);
    });
  }

  // 打开宝藏箱
  static openTreasureBox() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("恭喜!你找到了传说中的宝藏!");
      }, 1000);
    });
  }
}

// ==================== 2. 关卡定义（供动画页面渲染） ====================
const STAGES = [
  { id: "clue", icon: "📖", title: "图书馆 · 寻找线索" },
  { id: "decode", icon: "🔍", title: "破译古老文字" },
  { id: "desert", icon: "🏜️", title: "穿越流沙沙漠" },
  { id: "puzzle", icon: "🧩", title: "破解石碑谜题" },
  { id: "guard", icon: "⚔️", title: "神庙守卫之战" },
  { id: "search", icon: "📦", title: "搜寻神秘宝箱" },
  { id: "seal", icon: "🔑", title: "解开魔法封印" },
  { id: "open", icon: "👑", title: "开启传说宝藏" },
];

const MAX_RETRY = 4;

// ==================== 3. 核心：async/await 寻宝流程 ====================
/**
 * 异步寻宝主流程。
 * @param {{onEvent?: (e: {type:string, id:string|null, text:string|null}) => void}} options
 *   onEvent 回调用于把每一步的进展实时透出（动画页面/控制台皆可监听）。
 *   事件类型：start(开始某关) / done(过关) / retry(重试) / fail(彻底失败) / finish(全部完成)
 */
async function runTreasureHunt(options = {}) {
  const onEvent = typeof options.onEvent === "function" ? options.onEvent : () => {};
  const emit = (type, id, text = null) => onEvent({ type, id, text });

  // 单关执行器：带自动重试，把过程汇报给监听者
  async function playStage(id, task) {
    emit("start", id);
    for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
      try {
        const result = await task();
        emit("done", id, result);
        return result;
      } catch (err) {
        if (attempt === MAX_RETRY) {
          emit("fail", id, `${err} 连续 ${MAX_RETRY} 次失败，冒险到此结束...`);
          throw new Error(err);
        }
        emit("retry", id, `${err} 稍作调整，再次尝试(${attempt}/${MAX_RETRY})...`);
        await TreasureMap.delay(600); // 重试前稍作停顿
      }
    }
  }

  const clue = await playStage("clue", () => TreasureMap.getInitialClue());
  const location = await playStage("decode", () => TreasureMap.decodeAncientScript(clue));
  await playStage("desert", () => TreasureMap.crossDesert(location));
  await playStage("puzzle", () => TreasureMap.solveStonePuzzle());
  await playStage("guard", () => TreasureMap.fightGuardian());
  await playStage("search", () => TreasureMap.searchTemple(location));
  await playStage("seal", () => TreasureMap.unlockSeal());
  const treasure = await playStage("open", () => TreasureMap.openTreasureBox());

  emit("finish", null, "🏆 冒险圆满结束，你带着传说中的宝藏凯旋而归!");
  return treasure;
}

// ==================== 4. 控制台版本（验证 / 命令行运行） ====================
async function findTreasureWithAsync() {
  try {
    const clue = await TreasureMap.getInitialClue();
    console.log(clue);

    const location = await TreasureMap.decodeAncientScript(clue);
    console.log(location);

    const desert = await TreasureMap.crossDesert(location);
    console.log(desert);

    const puzzle = await TreasureMap.solveStonePuzzle();
    console.log(puzzle);

    const guardian = await TreasureMap.fightGuardian();
    console.log(guardian);

    const box = await TreasureMap.searchTemple(location);
    console.log(box);

    const seal = await TreasureMap.unlockSeal();
    console.log(seal);

    const treasure = await TreasureMap.openTreasureBox();
    console.log(treasure);
  } catch (error) {
    console.error("任务失败:", error);
  }
}

// ==================== 5. 导出（同时兼容 Node 与浏览器） ====================
(function (global) {
  const api = { TreasureMap, STAGES, runTreasureHunt, findTreasureWithAsync };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api; // Node 环境
  } else {
    Object.assign(global, api); // 浏览器环境，挂到 window 上
  }
})(typeof window !== "undefined" ? window : globalThis);

// 直接用 `node treasure.js` 运行时，自动跑一遍控制台版本
if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  findTreasureWithAsync();
}
