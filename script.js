const STORAGE_KEY = "orcamentoFacilHistorico";
const SETTINGS_KEY = "orcamentoFacilConfiguracoes";

const form = document.getElementById("quoteForm");
const itemsContainer = document.getElementById("itemsContainer");

const empresa = document.getElementById("empresa");
const whatsapp = document.getElementById("whatsapp");
const cliente = document.getElementById("cliente");
const telefoneCliente = document.getElementById("telefoneCliente");
const validade = document.getElementById("validade");
const pagamento = document.getElementById("pagamento");
const observacoes = document.getElementById("observacoes");

const previewCompany = document.getElementById("previewCompany");
const previewCompanyWhatsapp = document.getElementById("previewCompanyWhatsapp");
const previewClient = document.getElementById("previewClient");
const previewClientPhone = document.getElementById("previewClientPhone");
const previewItems = document.getElementById("previewItems");
const previewTotal = document.getElementById("previewTotal");
const previewValidity = document.getElementById("previewValidity");
const previewPayment = document.getElementById("previewPayment");
const previewNotes = document.getElementById("previewNotes");
const previewNumber = document.getElementById("previewNumber");
const previewDate = document.getElementById("previewDate");
const previewStatus = document.getElementById("previewStatus");
const historyList = document.getElementById("historyList");

let quoteNumber = Number(localStorage.getItem("orcamentoFacilProximoNumero") || "1");

function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function normalizePhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("55")) return digits;
    return `55${digits}`;
}

function nextQuoteId() {
    return `#${String(quoteNumber).padStart(6, "0")}`;
}

function advanceQuoteNumber() {
    quoteNumber += 1;
    localStorage.setItem("orcamentoFacilProximoNumero", String(quoteNumber));
}

function todayBR() {
    return new Intl.DateTimeFormat("pt-BR").format(new Date());
}

function createItemElement(item = {}) {
    const row = document.createElement("div");
    row.className = "item-row";

    row.innerHTML = `
        <input class="item-description" type="text" placeholder="Descrição do serviço" value="${escapeAttribute(item.description || "")}">
        <input class="item-quantity" type="number" min="1" step="1" value="${Number(item.quantity || 1)}" aria-label="Quantidade">
        <input class="item-price" type="number" min="0" step="0.01" placeholder="Preço" value="${item.price ?? ""}" aria-label="Preço unitário">
        <div class="item-total">R$ 0,00</div>
        <button type="button" class="remove-item" title="Remover item" aria-label="Remover item">×</button>
    `;

    const inputs = row.querySelectorAll("input");
    inputs.forEach(input => input.addEventListener("input", updatePreview));

    row.querySelector(".remove-item").addEventListener("click", () => {
        const rows = itemsContainer.querySelectorAll(".item-row");
        if (rows.length === 1) {
            rows[0].querySelector(".item-description").value = "";
            rows[0].querySelector(".item-quantity").value = 1;
            rows[0].querySelector(".item-price").value = "";
        } else {
            row.remove();
        }
        updatePreview();
    });

    itemsContainer.appendChild(row);
    updatePreview();
}

function escapeAttribute(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function getItems() {
    return [...itemsContainer.querySelectorAll(".item-row")]
        .map(row => {
            const description = row.querySelector(".item-description").value.trim();
            const quantity = Math.max(1, Number(row.querySelector(".item-quantity").value || 1));
            const price = Math.max(0, Number(row.querySelector(".item-price").value || 0));
            const total = quantity * price;

            row.querySelector(".item-total").textContent = formatCurrency(total);

            return { description, quantity, price, total };
        })
        .filter(item => item.description || item.price > 0);
}

function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.total, 0);
}

function collectQuote() {
    const items = getItems();

    return {
        id: nextQuoteId(),
        createdAt: new Date().toISOString(),
        company: empresa.value.trim(),
        companyWhatsapp: whatsapp.value.trim(),
        client: cliente.value.trim(),
        clientWhatsapp: telefoneCliente.value.trim(),
        validity: validade.value.trim(),
        payment: pagamento.value.trim(),
        notes: observacoes.value.trim(),
        items,
        total: calculateTotal(items)
    };
}

function renderItems(items) {
    previewItems.innerHTML = "";

    if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "small-muted";
        empty.textContent = "Adicione pelo menos um item para aparecer aqui.";
        previewItems.appendChild(empty);
        return;
    }

    items.forEach(item => {
        const row = document.createElement("div");
        row.className = "document-item";
        row.innerHTML = `
            <div class="document-item-main">
                <strong>${escapeHTML(item.description || "Item sem descrição")}</strong>
                <span>${item.quantity} × ${formatCurrency(item.price)}</span>
            </div>
            <div class="document-item-value">${formatCurrency(item.total)}</div>
        `;
        previewItems.appendChild(row);
    });
}

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}

function updatePreview(statusText = "Rascunho", saved = false) {
    const quote = collectQuote();

    previewCompany.textContent = quote.company || "Sua empresa";
    previewCompanyWhatsapp.textContent =
        quote.companyWhatsapp
            ? `WhatsApp: ${quote.companyWhatsapp}`
            : "WhatsApp não informado";

    previewClient.textContent = quote.client || "Nome do cliente";
    previewClientPhone.textContent =
        quote.clientWhatsapp
            ? `WhatsApp: ${quote.clientWhatsapp}`
            : "WhatsApp não informado";

    previewNumber.textContent = quote.id;
    previewDate.textContent = `Emitido em ${todayBR()}`;
    previewTotal.textContent = formatCurrency(quote.total);

    previewValidity.textContent = quote.validity || "Não informado";
    previewPayment.textContent = quote.payment || "Não informado";
    previewNotes.textContent = quote.notes || "Nenhuma observação.";

    renderItems(quote.items);

    previewStatus.textContent = statusText;
    previewStatus.classList.toggle("saved", saved);
}

function saveSettings() {
    const settings = {
        company: empresa.value.trim(),
        companyWhatsapp: whatsapp.value.trim()
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
        empresa.value = settings.company || "";
        whatsapp.value = settings.companyWhatsapp || "";
    } catch {
        // Ignora dados corrompidos e segue com o formulário vazio.
    }
}

function saveQuoteToHistory() {
    const quote = collectQuote();

    if (!quote.company || !quote.client || !quote.items.length) {
        alert("Preencha a empresa, o cliente e pelo menos um item antes de salvar.");
        return;
    }

    saveSettings();

    const history = loadHistory();
    history.unshift(quote);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 30)));
    advanceQuoteNumber();

    previewNumber.textContent = quote.id;
    updatePreview("Salvo", true);
    renderHistory();

    alert(`Orçamento ${quote.id} salvo no histórico.`);
}

function loadHistory() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        return [];
    }
}

function renderHistory() {
    const history = loadHistory();
    historyList.innerHTML = "";

    if (!history.length) {
        historyList.innerHTML = `
            <div class="history-empty">
                Nenhum orçamento salvo ainda. Crie o primeiro acima.
            </div>
        `;
        return;
    }

    history.forEach(quote => {
        const card = document.createElement("article");
        card.className = "history-card";

        const date = quote.createdAt
            ? new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short"
            }).format(new Date(quote.createdAt))
            : "";

        card.innerHTML = `
            <div class="history-main">
                <h3>${escapeHTML(quote.id)} · ${escapeHTML(quote.client || "Cliente")}</h3>
                <p>${escapeHTML(quote.company || "Empresa")} · ${date}</p>
                <div class="history-total">${formatCurrency(quote.total)}</div>
            </div>

            <div class="history-actions">
                <button type="button" data-action="load">Abrir</button>
                <button type="button" data-action="delete">Excluir</button>
            </div>
        `;

        card.querySelector('[data-action="load"]').addEventListener("click", () => loadQuote(quote.id));
        card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteQuote(quote.id));

        historyList.appendChild(card);
    });
}

function loadQuote(id) {
    const quote = loadHistory().find(item => item.id === id);
    if (!quote) return;

    empresa.value = quote.company || "";
    whatsapp.value = quote.companyWhatsapp || "";
    cliente.value = quote.client || "";
    telefoneCliente.value = quote.clientWhatsapp || "";
    validade.value = quote.validity || "";
    pagamento.value = quote.payment || "";
    observacoes.value = quote.notes || "";

    itemsContainer.innerHTML = "";
    (quote.items || []).forEach(item => createItemElement(item));
    if (!quote.items?.length) createItemElement();

    previewNumber.textContent = quote.id;
    updatePreview("Histórico", true);

    document.getElementById("criar-orcamento").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function deleteQuote(id) {
    const confirmed = confirm(`Excluir o orçamento ${id}?`);
    if (!confirmed) return;

    const history = loadHistory().filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    renderHistory();
}

function buildWhatsAppMessage() {
    const quote = collectQuote();
    const lines = [
        `Olá, ${quote.client || ""}!`,
        ``,
        `Segue o orçamento ${quote.id} da ${quote.company || "nossa empresa"}:`,
        ``
    ];

    quote.items.forEach((item, index) => {
        lines.push(
            `${index + 1}. ${item.description || "Item"} — ${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(item.total)}`
        );
    });

    lines.push(
        ``,
        `Total: ${formatCurrency(quote.total)}`,
        `Validade: ${quote.validity || "não informada"}`,
        `Pagamento: ${quote.payment || "a combinar"}`,
        ``
    );

    if (quote.notes) {
        lines.push(`Observações: ${quote.notes}`, ``);
    }

    lines.push(`Obrigado!`);

    return lines.join("\n");
}

function sendWhatsApp() {
    const quote = collectQuote();

    if (!quote.client || !quote.items.length) {
        alert("Preencha o cliente e pelo menos um item antes de enviar.");
        return;
    }

    const text = encodeURIComponent(buildWhatsAppMessage());
    const clientPhone = normalizePhone(quote.clientWhatsapp);

    const url = clientPhone
        ? `https://wa.me/${clientPhone}?text=${text}`
        : `https://web.whatsapp.com/send?text=${text}`;

    window.open(url, "_blank", "noopener,noreferrer");
}

function clearForm() {
    form.reset();
    itemsContainer.innerHTML = "";
    createItemElement();
    loadSettings();
    updatePreview("Rascunho", false);
}

document.getElementById("addItem").addEventListener("click", () => createItemElement());
document.getElementById("saveQuote").addEventListener("click", saveQuoteToHistory);
document.getElementById("clearForm").addEventListener("click", clearForm);

document.getElementById("printQuote").addEventListener("click", () => {
    saveSettings();
    window.print();
});

document.getElementById("sendWhatsApp").addEventListener("click", sendWhatsApp);

form.addEventListener("submit", event => {
    event.preventDefault();
    saveSettings();
    updatePreview("Atualizado", false);
});

[
    empresa,
    whatsapp,
    cliente,
    telefoneCliente,
    validade,
    pagamento,
    observacoes
].forEach(input => input.addEventListener("input", () => updatePreview()));

loadSettings();
createItemElement();
updatePreview();
renderHistory();
