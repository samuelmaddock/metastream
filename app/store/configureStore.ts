const local = (process.env.NODE_ENV === 'production') ?
  require('./configureStore.production').default as any :
  require('./configureStore.development').default as any;

export const configureStore: Function = local.configureStore;
export const history: any = local.history;
