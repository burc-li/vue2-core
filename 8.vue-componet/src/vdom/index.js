/**
 * @name 虚拟DOM相关方法
 */

// 是否是预定的标签，用于判断是标签名还是组件名
const isReservedTag = tag => {
  return ['a', 'div', 'p', 'button', 'ul', 'li', 'span'].includes(tag)
}

// h()  _c() 创建元素的虚拟节点
export function createElementVNode(vm, tag, data, ...children) {
  if (data == null) {
    data = {}
  }
  let key = data.key
  if (key) {
    delete data.key
  }
  // 是标签
  if (isReservedTag(tag)) {
    return vnode(vm, tag, key, data, children)
  }
  // 是组件
  else {
    let Ctor = vm.$options.components[tag] // Ctor就是组件的定义 可能是一个Sub类，也可能是组件选项对象
    return createComponentVnode(vm, tag, key, data, children, Ctor)
  }
}

function createComponentVnode(vm, tag, key, data, children, Ctor) {
  if (typeof Ctor === 'object') {
    Ctor = vm.$options._base.extend(Ctor) // 即 Vue.extend(Ctor) 返回一个 Sub构造函数
  }
  data.hook = {
    // 稍后创造真实节点时，如果时组件则会在 createComponent 调用 init方法
    init(vnode) { 
      vnode.componentInstance = new vnode.componentOptions.Ctor()  // 缓存 Sub实例 到组件虚拟节点上
      vnode.componentInstance.$mount() //  给 vm.$el 即 vnode.componentInstance.$el 赋值。 mountComponent -》 vm._update -》 vm.$el = patch(el, vnode) -》 el 为 null 走 createElm(vnode) ，vnode就是组件的虚拟节点 —》 返回真实DOM
    },
  }
  return vnode(vm, tag, key, data, children, null, { Ctor })
}

// _v() 创建文本虚拟节点
export function createTextVNode(vm, text) {
  return vnode(vm, undefined, undefined, undefined, undefined, text)
}

// VNode 和 AST一样吗？ AST做的是语法层面的转化，他描述的是语法本身 (可以描述 js css html)
// 我们的VNode 是描述的dom元素，可以增加一些自定义属性
function vnode(vm, tag, key, data, children, text, componentOptions) {
  return {
    vm,
    tag,
    key,
    data,
    children,
    text,
    componentOptions, // 组件的构造函数
    // ....
  }
}

// 判断是否是相同节点 tag标签名相同 && key相同
export function isSameVnode(vnode1, vnode2) {
  return vnode1.tag === vnode2.tag && vnode1.key === vnode2.key
}
