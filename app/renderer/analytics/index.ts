import { InitParams, Item, Param } from './types'
import {
  getDefaultInitParams,
  prepareItems,
  getBatches,
  sendBatches,
  resolveParam
} from './helpers'
import { getNow, getCache, setCache, retry } from './side-effects'
import { BATCH_SIZE, RETRY } from './consts'

export class Analytics {
  private trackId: Param<string>
  private protocolVersion: Param<string>
  private clientId: Param<string>
  private userId: Param<string>
  private appName: Param<string>
  private appVersion: Param<string>
  private language: Param<string>
  private userAgent: Param<string>
  private viewport: Param<string>
  private screenResolution: Param<string>

  constructor(trackId: string, params: InitParams = {}) {
    this.trackId = trackId
    const initParams = { ...getDefaultInitParams(), ...params }
    Object.keys(initParams).forEach(key => ((this as any)[key] = (initParams as any)[key]))
    retry(this.send, RETRY)
  }

  public send = async (hitType?: string, additionalParams: object = {}) => {
    const now = getNow()
    const params = hitType ? this.getParams(hitType, additionalParams, now) : null
    const cache = getCache()
    const items = prepareItems(
      [...cache, params].filter(Boolean) as any[],
      this.trackId as string,
      now
    )
    if (items.length === 0) return
    const batches = getBatches(items, BATCH_SIZE)
    const failedItems = await sendBatches(batches)
    setCache(failedItems)
  }

  private getParams(hitType: string, additionalParams = {}, time: number): Item {
    return {
      __timestamp: time,
      t: hitType,
      v: resolveParam(this.protocolVersion),
      tid: resolveParam(this.trackId),
      cid: resolveParam(this.clientId),
      an: resolveParam(this.appName),
      av: resolveParam(this.appVersion),
      ul: resolveParam(this.language),
      ua: resolveParam(this.userAgent),
      vp: resolveParam(this.viewport),
      sr: resolveParam(this.screenResolution),
      ...additionalParams
    }
  }
}

export default Analytics
