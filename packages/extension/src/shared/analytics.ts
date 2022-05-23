import { base64 } from "ethers/lib/utils"
import { encode } from "starknet"

const SEGMENT_TRACK_URL = "https://api.segment.io/v1/track"
const SEGMENT_PAGE_URL = "https://api.segment.io/v1/page"

// dont use destructuring here
const SEGMENT_WRITE_KEY = `${process.env.SEGMENT_WRITE_KEY}`
const VERSION = `${process.env.VERSION}`

export interface Events {
  createWallet:
    | {
        status: "success"
      }
    | {
        status: "failure"
        errorMessage: string
      }
}

export interface Pages {
  welcome: undefined
  disclaimer: undefined
  createWallet: undefined
  restoreWallet: undefined
  restoreWalletWithFile: undefined
}

interface Analytics {
  track<T extends keyof Events>(
    event: T,
    ...rest: Events[T] extends undefined // makes sure that the argument is optional if the event is not defined
      ? [data?: Events[T]]
      : [data: Events[T]]
  ): Promise<unknown>
  page<T extends keyof Pages>(
    name: T,
    ...rest: Pages[T] extends undefined ? [data?: Pages[T]] : [data: Pages[T]]
  ): Promise<unknown>
}

const versionRegex = /(\d+[._]\d+)([._]\d+)*/g // https://regex101.com/r/TgejzT/1
export function anonymizeUseragent(ua?: string): string {
  if (!ua) {
    return "unknown"
  }
  return ua.replace(versionRegex, "$1")
}

export type Fetch = (url: string, init?: RequestInit) => Promise<unknown>

const defaultPayload = {
  anonymousId: "00000000-0000-0000-0000-000000000000",
  context: {
    ip: "0.0.0.0",
    app: {
      name: "Argent X",
      version: VERSION,
    },
  },
}
const headers = {
  "Content-Type": "application/json",
  Authorization: `Basic ${base64.encode(
    encode.utf8ToArray(`${SEGMENT_WRITE_KEY}:`),
  )}`,
}

const isBrowser = typeof window !== "undefined"
const defaultUa = isBrowser ? window.navigator.userAgent : "unknown"

export function getAnalytics(fetch: Fetch, ua = defaultUa): Analytics {
  const prebuildPayload = {
    ...defaultPayload,
    context: {
      ...defaultPayload.context,
      userAgent: anonymizeUseragent(ua),
    },
  }
  return {
    track: async (event, ...[data]) => {
      if (!SEGMENT_WRITE_KEY) {
        return
      }
      const payload = {
        ...prebuildPayload,
        event,
        properties: data,
        timestamp: new Date().toISOString(),
      }
      try {
        return await fetch(SEGMENT_TRACK_URL, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        })
      } catch {
        // ignore
      }
    },
    page: async (name, ...[data]) => {
      if (!SEGMENT_WRITE_KEY) {
        return
      }
      const payload = {
        ...prebuildPayload,
        name,
        properties: data,
        timestamp: new Date().toISOString(),
      }
      try {
        return await fetch(SEGMENT_PAGE_URL, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        })
      } catch {
        // ignore
      }
    },
  }
}
