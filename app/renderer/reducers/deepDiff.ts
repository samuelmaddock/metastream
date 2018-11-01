const enum DiffKind {
  New = 'N',
  Edit = 'E',
  Add = 'A',
  Delete = 'D'
}

type DiffBase<T, T2> = { path: (string | number)[]; lhs: T; rhs: T2 }

export type Diff<T = any, T2 = any> =
  | { kind: DiffKind.New } & DiffBase<T, T2>
  | { kind: DiffKind.Edit } & DiffBase<T, T2>
  | { kind: DiffKind.Add; index: number; item: Diff<T, T2> } & DiffBase<T, T2>
  | { kind: DiffKind.Delete } & DiffBase<T, T2>

function set(target: any, index: string | number, value: any) {
  if (Array.isArray(target)) {
    target = [...target]
    target[index] = value
  } else {
    target = { ...target, [index]: value }
  }
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
    let it = arr[index]
    let i
    const u = change.path.length - 1
    for (i = 0; i < u; i++) {
      it = it[change.path[i]]
    }
    switch (change.kind) {
      case DiffKind.Add:
        it = applyArrayChange(it[change.path[i]], change.index, change.item)
        break
      case DiffKind.Delete:
        it = set(it, change.path[i], undefined)
        delete it[change.path[i]]
        break
      case DiffKind.Edit:
      case DiffKind.New:
        it = set(it, change.path[i], change.rhs)
        break
    }
    return it
  } else {
    switch (change.kind) {
      case DiffKind.Add:
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

/**
 * Apply change immutably.
 * https://github.com/flitbit/diff/blob/2b1ffbc4ebb78b79321d4d65a373673df1c937db/index.js#L353
 */
export function reduceChange(target: any, change: Diff) {
  if (target && change && change.kind) {
    let it = target
    let i = -1
    const last = change.path ? change.path.length - 1 : 0
    while (++i < last) {
      if (typeof it[change.path[i]] === 'undefined') {
        const isArrayPath =
          typeof change.path[i + 1] !== 'undefined' && typeof change.path[i + 1] === 'number'
        it = set(it, change.path[i], isArrayPath ? [] : {})
      }
      it = it[change.path[i]]
    }
    switch (change.kind) {
      case DiffKind.Add:
        if (change.path && typeof it[change.path[i]] === 'undefined') {
          it = set(it, change.path[i], [])
        }
        it = applyArrayChange(change.path ? it[change.path[i]] : it, change.index, change.item)
        break
      case DiffKind.Delete:
        it = set(it, change.path[i], undefined)
        delete it[change.path[i]]
        break
      case DiffKind.Edit:
      case DiffKind.New:
        it = set(it, change.path[i], change.rhs)
        break
    }
    return it
  }
  return target
}
