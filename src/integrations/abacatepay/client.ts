// Cliente AbacatePay via proxy local (Vite) para evitar CORS

// Tipos baseados na documentação
export interface CreateBillingParams {
	frequency: 'ONE_TIME' | 'RECURRING';
	methods: string[];
	products: Array<{
		externalId: string;
		name: string;
		quantity: number;
		price: number; // em centavos
	}>;
	returnUrl: string;
	completionUrl: string;
	customer: {
		email: string;
		name?: string;
		taxId?: string;
	};
	metadata?: Record<string, any>;
}

export interface BillingResponse {
	id?: string;
	status?: string;
	amount?: number;
	currency?: string;
	description?: string;
	external_id?: string;
	customer?: {
		name?: string;
		email?: string;
		tax_id?: string;
	};
	payment_methods?: string[];
	returnUrl?: string;
	completionUrl?: string;
	metadata?: Record<string, any>;
	created_at?: string;
	updated_at?: string;
	payment_url?: string; // Pode ser undefined
	url?: string; // Alternativa para URL de pagamento
	data?: any; // Algumas respostas do AbacatePay vêm aninhadas em data
	error?: any;
}

// Wrapper para facilitar o uso no frontend
export class AbacatePayClient {
	constructor() {}

	async createBilling(params: CreateBillingParams): Promise<BillingResponse> {
		return this.createSubscription({
			frequency: 'RECURRING',
			methods: params.methods,
			products: params.products,
			returnUrl: params.returnUrl,
			completionUrl: params.completionUrl,
			customer: params.customer,
			metadata: params.metadata,
		});
	}

	async getBilling(_billingId: string): Promise<BillingResponse> {
		throw new Error('Método não implementado');
	}

	async createSubscription(params: {
		frequency: 'ONE_TIME' | 'RECURRING';
		methods: string[];
		products: Array<{
			externalId: string;
			name: string;
			quantity: number;
			price: number;
		}>;
		returnUrl: string;
		completionUrl: string;
			customer: {
		email: string;
		name?: string;
		taxId?: string;
		cellphone?: string;
	};
		metadata?: Record<string, any>;
	}) {
		// Prepara customer com defaults exigidos pela API (cellphone é obrigatório em todos os métodos neste ambiente)
		const customerPayload = {
			...params.customer,
			cellphone: (params.customer as any)?.cellphone || '(11) 4002-8922',
		};

		const base = {
			products: params.products,
			returnUrl: params.returnUrl,
			completionUrl: params.completionUrl,
			customer: customerPayload,
			metadata: params.metadata,
		};

		// Normaliza método selecionado do app para candidatos aceitos pela API
		const inputMethod = (params.methods?.[0] || '').toUpperCase();
		let methodCandidates: string[] = [];
		switch (inputMethod) {
			case 'CREDIT_CARD':
			case 'CARD':
				methodCandidates = ['CARD'];
				break;
			case 'PIX':
				methodCandidates = ['PIX'];
				break;
			case 'BOLETO':
			case 'TICKET':
				methodCandidates = ['BOLETO'];
				break;
			default:
				methodCandidates = [inputMethod || 'PIX'];
		}

		// Calcula amount total (algumas integrações aceitam amount direto)
		const amount = params.products.reduce((acc, p) => acc + (p.price * p.quantity), 0);

		try {
			let lastErrorText = '';
			for (const method of methodCandidates) {
				// 1) Tenta SEM frequency (deixa padrão do backend)
				const bodyNoFreq = { ...base, methods: [method], amount } as any;
				let response = await fetch('/api/abacatepay/v1/billing/create', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
					body: JSON.stringify(bodyNoFreq),
				});
				if (response.ok) {
					const ok = await response.json();
					return ok?.data || ok;
				}
				let errorText = await response.text();
				lastErrorText = errorText;

				// 2) Se falhar, tenta com ONE_TIME
				const bodyOneTime = { ...base, methods: [method], amount, frequency: 'ONE_TIME' as const };
				response = await fetch('/api/abacatepay/v1/billing/create', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
					body: JSON.stringify(bodyOneTime),
				});
				if (response.ok) {
					const ok = await response.json();
					return ok?.data || ok;
				}
				errorText = await response.text();
				lastErrorText = errorText;
				// se não for erro de validação, encerra cedo
				if (!errorText.includes('FST_ERR_VALIDATION')) {
					throw new Error(`Erro na API: ${response.status} - ${errorText}`);
				}
			}

			throw new Error(`Erro na API: payload rejeitado. ${lastErrorText}`);
		} catch (error) {
			console.error('AbacatePay - Erro na API:', error);
			throw error;
		}
	}

	async getSubscription(_subscriptionId: string) {
		throw new Error('Método não implementado');
	}

	async cancelSubscription(subscriptionId: string) {
		// Tenta cancelar no gateway (proxy Vite)
		try {
			let response = await fetch('/api/abacatepay/v1/billing/cancel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
				body: JSON.stringify({ id: subscriptionId })
			});
			if (!response.ok) {
				// fallback path-based
				response = await fetch(`/api/abacatepay/v1/billing/cancel/${subscriptionId}`, { method: 'POST' });
			}
			// Ignora erro do gateway em dev; o app ainda realizará downgrade local
			return { ok: response.ok } as any;
		} catch {
			return { ok: false } as any;
		}
	}

	async createCustomer(_params: { email: string; name?: string; taxId?: string }) {
		throw new Error('Método não implementado');
	}

	async getCustomer(_customerId: string) {
		throw new Error('Método não implementado');
	}
}

// Instância global
export const abacatePayClient = new AbacatePayClient(); 