export interface Awareness {
  clientID: number
  getStates(): Map<number, Record<string, unknown>>
  setLocalStateField(field: string, value: unknown): void
  on(event: string, callback: () => void): void
  off(event: string, callback: () => void): void
}

export interface WebsocketProvider {
  awareness: Awareness
  disconnect(): void
  connect(): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, callback: (...args: any[]) => void): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, callback: (...args: any[]) => void): void
}
