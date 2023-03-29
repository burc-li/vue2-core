/**
 * @name Vue初始化状态（初始化数据、初始化计算属性）
 * @todo 1. 对data进行劫持，并将data挂载到vm上 vm._data = data
 * @todo 2. 循环data，将vm._data用vm来代理
 * @split 初始化计算属性---------
 * @todo 1. 给每个计算属性都创建一个 watcher，并标识为 lazy，不会立即执行 get-fn，并将计算属性watcher 都保存到 vm上
 * @todo 2. 劫持计算属性getter/setter
 * @todo 3. 当访问计算属性时，如果为脏的，则重新获取值，如果为干净的，则取 watcher上的缓存值，还要让计算属性watcher订阅的dep，也去收集上一层watcher
 */

import { observe } from './observe/index'
import Watcher from './observe/watcher'
import Dep from './observe/dep'

// 初始化状态
export function initState(vm) {
  const opts = vm.$options // 获取所有的选项

  // 初始化数据
  if (opts.data) {
    initData(vm)
  }

  // 初始化计算属性
  if (opts.computed) {
    initComputed(vm)
  }
}

function proxy(vm, target, key) {
  Object.defineProperty(vm, key, {
    // vm.name
    get() {
      return vm[target][key] // vm._data.name
    },
    set(newValue) {
      vm[target][key] = newValue
    },
  })
}

// 初始化数据
function initData(vm) {
  let data = vm.$options.data // data可能是函数和对象
  data = typeof data === 'function' ? data.call(vm) : data

  vm._data = data // 我将返回的对象放到了_data上

  // vue2采用 defineProperty API，对data进行劫持
  observe(data)

  // 将vm._data 用 vm来代理 ，访问 vm.name = vm._data.name
  for (let key in data) {
    if (key === '_data') return

    proxy(vm, '_data', key)
  }
}

// 初始化计算属性
function initComputed(vm) {
  const computed = vm.$options.computed
  const watchers = (vm._computedWatchers = {}) // 将每个计算属性对应的watcher 都保存到 vm上
  for (let key in computed) {
    let userDef = computed[key]

    // 兼容不同写法 函数方式 和 对象getter/setter方式
    let fn = typeof userDef === 'function' ? userDef : userDef.get

    // 给每个计算属性都创建一个 watcher，并标识为 lazy，不会立即执行 get-fn
    watchers[key] = new Watcher(vm, fn, { lazy: true })

    // 劫持计算属性getter/setter
    defineComputed(vm, key, userDef)
  }
}

// 劫持计算属性
function defineComputed(target, key, userDef) {
  const setter = userDef.set || (() => {})

  Object.defineProperty(target, key, {
    get: createComputedGetter(key),
    set: setter,
  })
}

// 劫持计算属性的访问
function createComputedGetter(key) {
  return function () {
    const watcher = this._computedWatchers[key] // this就是 defineProperty 劫持的targer。获取到计算属性对应的watcher

    // 如果是脏的，就去执行用户传入的函数
    if (watcher.dirty) {
      watcher.evaluate() // 求值后 dirty变为false，下次就不求值了，走缓存
    }

    // 计算属性watcher 出栈后，还有渲染watcher，我们应该让计算属性watcher订阅的dep，也去收集上一层watcher
    // 注：计算属性根本不会收集依赖，但是会让自己的依赖属性去收集依赖
    if (Dep.target) {
      watcher.depend()
    }

    // 返回watcher上的值
    return watcher.value
  }
}