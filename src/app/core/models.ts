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

export type BudgetItemType = 'receita' | 'despesa';

export interface BudgetItem {
  id: string;
  tipo: BudgetItemType;
  nome: string;
  valor: number;
}

export interface Transaction {
  id: string;
  tipo: BudgetItemType;
  nome: string;
  valor: number;
  data: string | null;     // yyyy-mm-dd (optional display date)
  createdAt: string;       // ISO — used as fallback month when data is null
}

export type TaskPriority = 'baixa' | 'media' | 'alta';

export interface TaskGroup {
  id: string;
  nome: string;
  createdAt: string;
}

export interface Task {
  id: string;
  grupoId: string;
  titulo: string;
  descricao: string | null;
  concluida: boolean;
  prazo: string | null;    // yyyy-mm-dd
  prioridade: TaskPriority;
  createdAt: string;
}
