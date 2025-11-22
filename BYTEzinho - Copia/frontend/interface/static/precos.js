document.addEventListener('DOMContentLoaded', () => {
    const toggleCheckbox = document.getElementById('price-toggle-checkbox');
    const monthlyLabel = document.querySelector('.toggle-label[data-period="monthly"]');
    const annualLabel = document.querySelector('.toggle-label[data-period="annual"]');
    
    if (!toggleCheckbox || !monthlyLabel || !annualLabel) {
        console.error('Um ou mais elementos de preço não foram encontrados.');
        return;
    }

    // --- Valores Base dos Planos ---
    // A fonte da verdade para os preços mensais.
    const prices = {
        basic: {
            monthly: 590.90
        },
        premium: {
            monthly: 990.90
        }
    };

    /**
     * Atualiza um único card de plano com base no período selecionado.
     * @param {string} planName - O nome do plano (ex: 'basic', 'premium').
     * @param {boolean} isAnnual - True se o período for anual.
     */
    function updatePlanCard(planName, isAnnual) {
        const priceValueEl = document.getElementById(`price-${planName}-value`);
        const pricePeriodEl = document.getElementById(`price-${planName}-period`);
        const annualBillingEl = document.getElementById(`annual-billing-${planName}`);

        if (!priceValueEl || !pricePeriodEl || !annualBillingEl) return;

        const monthlyPrice = prices[planName].monthly;
        const annualPrice = monthlyPrice * 12 * 0.90; // Desconto de 10%

        const newPrice = isAnnual ? annualPrice : monthlyPrice;
        const [integerPart, decimalPart] = newPrice.toFixed(2).split('.');
        
        priceValueEl.textContent = integerPart;
        pricePeriodEl.textContent = `,${decimalPart}/${isAnnual ? 'ano' : 'mês'}`;
        
        // Em vez de 'visibility', usar 'display' é mais comum para remover o espaço.
        annualBillingEl.style.display = isAnnual ? 'none' : 'block';
    }

    /**
     * Atualiza todos os planos e os labels do seletor.
     * @param {boolean} isAnnual - True se o período for anual.
     */
    function updateAllPrices(isAnnual) {
        // Itera sobre os planos definidos no objeto 'prices'
        Object.keys(prices).forEach(planName => {
            updatePlanCard(planName, isAnnual);
        });
        
        // Atualiza estilo dos labels
        monthlyLabel.classList.toggle('active', !isAnnual);
        annualLabel.classList.toggle('active', isAnnual);
    }

    toggleCheckbox.addEventListener('change', () => {
        updateAllPrices(toggleCheckbox.checked);
    });

    // Garante o estado inicial correto ao carregar a página
    updateAllPrices(false);
});