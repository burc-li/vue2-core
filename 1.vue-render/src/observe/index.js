/**
 * @name 数据劫持
 * @todo 1. 只对对象进行劫持
 * @todo 2. 如果一个对象被劫持过了，那就不需要再被劫持了 (要判断一个对象是否被劫持过，可以在对象上增添一个实例，用实例的原型链来判断是否被劫持过)
 * @todo 3. Object.defineProperty只能劫持已经存在的属性，对象新增属性和数组新增元素无法劫持 （vue会为此单独写一些api语法糖  $set $delete）
 * @todo 4. 循环对象，对属性依次递归劫持，性能差
 * @todo 5. setter方法中修改属性之后重新观测，目的：新值为对象或数组的话，可以劫持其数据
 * @todo 6. 重写数组7个可以改变自身的方法，切片编程
 * @todo 7. this 实例挂载到 data 数据上，将__ob__ 变成不可枚举，防止栈溢出【用于判断对象是否被劫持过 和 劫持变异数组新增数据】
 */

import { newArrayProto } from './array'

class Observer {
  constructor(data) {
    // data.__ob__ = this // 给数据加了一个标识 如果数据上有__ob__ 则说明这个属性被观测过了
    Object.defineProperty(data, '__ob__', {
      value: this,
      enumerable: false, // 将__ob__ 变成不可枚举 （循环的时候无法获取到，防止栈溢出）
    })

    if (Array.isArray(data)) {
      // 这里我们可以重写可以修改数组本身的方法 7个方法，切片编程：需要保留数组原有的特性，并且可以重写部分方法
      data.__proto__ = newArrayProto
      this.observeArray(data) // 如果数组中放的是对象 可以监控到对象的变化
    } else {
      this.walk(data)
    }
  }

  // 循环对象"重新定义属性",对属性依次劫持，性能差
  // "重新定义属性"，个人理解，和proxy类似，对象和proxy返回的代理对象并不全等，其引用不同；
  // 入参属性为data[key]，使用defineProperty劫持之后，其属性变为响应式属性，和之前的普通属性断开了关联，可以理解为重新定义了属性
  // 换句话来说，data[key]仅仅是给其对应的响应式属性提供了一个默认值，无任何关联
  // 如果不传入默认值，而是在getter、setter中访问 data[key]，则会出现栈溢出的现象   getter -> data.name -> getter -> data.name ->...无限循环
  walk(data) {
    Object.keys(data).forEach(key => defineReactive(data, key, data[key]))
  }

  // 观测数组
  observeArray(data) {
    data.forEach(item => observe(item))
  }
}

// 使用defineProperty API进行属性劫持
export function defineReactive(target, key, value) {
  // 深度属性劫持，对所有的对象都进行属性劫持
  observe(value)

  // Object.defineProperty只能劫持已经存在的属性，新增属性无法劫持 （vue里面会为此单独写一些语法糖  $set $delete）
  Object.defineProperty(target, key, {
    // 取值的时候 会执行get
    get() {
      console.log('get_v2', key)
      return value
    },
    // 修改的时候 会执行set
    set(newValue) {
      console.log('set_v2', key)
      if (newValue === value) return

      // 修改属性之后重新观测，目的：新值为对象或数组的话，可以劫持其数据
      observe(newValue)
      value = newValue
    },
  })
}

// 数据观测
export function observe(data) {
  // 只对对象进行劫持
  if (typeof data !== 'object' || data == null) {
    return
  }

  // 如果一个对象被劫持过了，那就不需要再被劫持了 (要判断一个对象是否被劫持过，可以在对象上增添一个实例，用实例的原型链来判断是否被劫持过)
  if (data.__ob__ instanceof Observer) {
    return data.__ob__
  }

  return new Observer(data)
}
