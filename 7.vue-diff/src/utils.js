/**
 * @name 工具类方法
 * @decs 重点关注下 策略模式 的应用，可以大大减少 if else 代码量
 */

const strats = {}
const LIFECYCLE = ['beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated', 'beforeDestroy', 'destroyed']
LIFECYCLE.forEach(hook => {
  strats[hook] = function (p, c) {
    // 第一次 { } { created: function(){} }   => { created: [fn] }
    // 第二次 { created: [fn] }  { created: function(){} } => { created: [fn,fn] }
    // 第三次 { created: [fn,fn] }  { } => { created: [fn,fn] }
    if (c) {
      if (p) {
        // 如果儿子有，父亲有
        return p.concat(c)
      } else {
        // 儿子有，父亲没有，则将儿子包装成数组
        return [c]
      }
    } else {
      return p // 如果儿子没有，则用父亲即可
    }
  }
})

// 合并选项
export function mergeOptions(parent, child) {
  const options = {}
  // 循环老的options { }
  for (let key in parent) {
    mergeField(key)
  }
  // 循环新的options { created: function(){} }
  for (let key in child) {
    if (!parent.hasOwnProperty(key)) {
      mergeField(key)
    }
  }

  function mergeField(key) {
    // 策略模式 用策略模式减少if /else
    if (strats[key]) {
      options[key] = strats[key](parent[key], child[key])
    } else {
      // 如果不在策略中则以儿子为主
      options[key] = child[key] || parent[key]
    }
  }
  return options
}
