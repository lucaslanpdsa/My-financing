export interface Installment {
  num: number;
  total: number;
  value: number;
  paid: boolean;
  paidValue: number;
  paidDate: string | null; // format: dd/mm/yyyy
}

export interface FinancingConfig {
  totalInstallments: number;
  installmentValue: number;
  financedAmount: number;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
