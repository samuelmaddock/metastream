import { set as _set, clone } from 'lodash-es'

const enum DiffKind {
  New = 'N',
  Edit = 'E',
  Array = 'A',
  Delete = 'D'
}

type DiffBase<T, T2> = { path: (string | number)[]; lhs: T; rhs: T2 }

export type Diff<T = any, T2 = any> =
  | { kind: DiffKind.New } & DiffBase<T, T2>
  | { kind: DiffKind.Edit } & DiffBase<T, T2>
  | { kind: DiffKind.Array; index: number; item: Diff<T, T2> } & DiffBase<T, T2>
  | { kind: DiffKind.Delete } & DiffBase<T, T2>

function set(target: any, index: string | number, value: any) {
  target = clone(target)
  target[index] = value
  return target
}

function arrayRemove(arr: any[], from: number, to?: number) {
  var rest = arr.slice((to || from) + 1 || arr.length)
  arr = [...arr]
  arr.length = from < 0 ? arr.length + from : from
  arr.push.apply(arr, rest)
  return arr
}

function applyArrayChange(arr: any[], index: number, change: Diff) {
  if (change.path && change.path.length) {
    throw new Error('Not implemented')
  } else {
    switch (change.kind) {
      case DiffKind.Array:
        arr = applyArrayChange(arr[index], change.index, change.item)
        break
      case DiffKind.Delete:
        arr = arrayRemove(arr, index)
        break
      case DiffKind.Edit:
      case DiffKind.New:
        arr = set(arr, index, change.rhs)
        break
    }
  }
  return arr
}

function getInner(obj: any, path: Diff['path']) {
  obj = clone(obj)
  let it = obj
  let i = -1
  const last = path ? path.length - 1 : 0

  while (++i < last) {
    const key = path[i]

    // get default object if value undefined
    if (typeof it[key] === 'undefined') {
      const isArrayPath = typeof path[i + 1] !== 'undefined' && typeof path[i + 1] === 'number'
      it = set(it, key, isArrayPath ? [] : {})
      if (i === 0) obj = it
    }

    const root = it
    const child = clone(root[key])
    root[key] = child

    it = child
  }

  return [obj, it, path[i]]
}

/**
 * Apply change immutably.
 * https://github.com/flitbit/diff/blob/2b1ffbc4ebb78b79321d4d65a373673df1c937db/index.js#L353
 */
export function reduceChange(target: any, change: Diff) {
  if (target && change && change.kind) {
    let [newTarget, it, key] = getInner(target, change.path)
    target = newTarget

    switch (change.kind) {
      case DiffKind.Array:
        if (change.path && typeof it[key] === 'undefined') {
          it = set(it, key, [])
        }
        const newArray = applyArrayChange(change.path ? it[key] : it, change.index, change.item)
        if (change.path) {
          it = set(it, key, newArray)
        } else {
          it = newArray
        }
        break
      case DiffKind.Delete:
        it = set(it, key, undefined)
        delete it[key]
        break
      case DiffKind.Edit:
      case DiffKind.New:
        it = set(it, key, change.rhs)
        break
    }

    _set(target, change.path, it[key])
    return target
  }
  return target
}
