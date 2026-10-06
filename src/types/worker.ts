/** All money values in the app are integer paise (₹1 = 100 paise). */
export type Paise = number

export interface Worker {
  id: string
  name: string
  phone?: string
  workType: string
  /** Current daily wage in paise. */
  dailyWage: Paise
  createdAt: string
  updatedAt: string
}

export interface WorkerInput {
  name: string
  phone?: string
  workType: string
  dailyWage: Paise
}
