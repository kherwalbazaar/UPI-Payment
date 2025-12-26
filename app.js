const form = document.getElementById("addItemForm")
const itemNameEl = document.getElementById("itemName")
const itemQtyEl = document.getElementById("itemQty")
const itemPriceEl = document.getElementById("itemPrice")

const itemsEmpty = document.getElementById("itemsEmpty")
const itemsTableWrap = document.getElementById("itemsTableWrap")
const itemsTbody = document.getElementById("itemsTbody")
const grandTotalEl = document.getElementById("grandTotal")

const generateQrBtn = document.getElementById("generateQrBtn")
const paymentReceivedBtn = document.getElementById("paymentReceivedBtn")

const historyEmpty = document.getElementById("historyEmpty")
const historyTableWrap = document.getElementById("historyTableWrap")
const historyTbody = document.getElementById("historyTbody")
const clearHistoryBtn = document.getElementById("clearHistoryBtn")

const qrModal = document.getElementById("qrModal")
const qrBox = document.getElementById("qrBox")
const upiLinkEl = document.getElementById("upiLink")
const qrAmountEl = document.getElementById("qrAmount")

const DEFAULT_UPI_VPA = "9583252256-3@axl"
const DEFAULT_PAYEE_NAME = "UPI PYMT"

const HISTORY_STORAGE_KEY = "upi_pymt_payment_history_v1"

let items = []
let paymentHistory = []

function makeId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID()
    }
  } catch {
    // ignore
  }

  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function inr(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount)
}

function normalizeText(s) {
  return String(s || "").trim()
}

function numberOrNull(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function computeTotal() {
  return items.reduce((sum, it) => sum + it.qty * it.price, 0)
}

function formatDateTime(isoString) {
  const d = new Date(isoString)
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d)
}

function saveHistory() {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(paymentHistory))
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    console.log("[v0] Loaded history from storage:", parsed.length, "entries")
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch (err) {
    console.error("[v0] Failed to load history:", err)
    return []
  }
}

function itemSummary(list) {
  return list.map((it) => `${it.name} (${it.qty}×${it.price})`).join(", ")
}

function renderHistory() {
  const hasHistory = paymentHistory.length > 0
  historyEmpty.hidden = hasHistory
  historyTableWrap.hidden = !hasHistory

  historyTbody.innerHTML = ""

  for (const h of paymentHistory) {
    const tr = document.createElement("tr")

    const tdDate = document.createElement("td")
    tdDate.textContent = formatDateTime(h.createdAt)
    tdDate.className = "cellText"

    const tdAmt = document.createElement("td")
    tdAmt.textContent = inr(h.amount)
    tdAmt.className = "cellNum"

    const tdUpi = document.createElement("td")
    tdUpi.textContent = h.vpa
    tdUpi.className = "cellText"

    const tdItems = document.createElement("td")
    tdItems.textContent = itemSummary(h.items)
    tdItems.className = "cellText"

    tr.appendChild(tdDate)
    tr.appendChild(tdAmt)
    tr.appendChild(tdUpi)
    tr.appendChild(tdItems)

    historyTbody.appendChild(tr)
  }
}

function render() {
  const hasItems = items.length > 0
  itemsEmpty.hidden = hasItems
  itemsTableWrap.hidden = !hasItems

  itemsTbody.innerHTML = ""

  for (const it of items) {
    const tr = document.createElement("tr")

    const tdName = document.createElement("td")
    tdName.textContent = it.name

    tdName.className = "cellText"

    const tdQty = document.createElement("td")
    tdQty.textContent = String(it.qty)

    tdQty.className = "cellNum"

    const tdPrice = document.createElement("td")
    tdPrice.textContent = inr(it.price)

    tdPrice.className = "cellNum"

    const tdTotal = document.createElement("td")
    tdTotal.textContent = inr(it.qty * it.price)

    tdTotal.className = "cellNum"

    const tdAction = document.createElement("td")
    tdAction.className = "colAction"

    const delBtn = document.createElement("button")
    delBtn.type = "button"
    delBtn.className = "smallBtn"
    delBtn.textContent = "X"
    delBtn.addEventListener("click", () => {
      items = items.filter((x) => x.id !== it.id)
      render()
    })

    tdAction.appendChild(delBtn)

    tr.appendChild(tdName)
    tr.appendChild(tdQty)
    tr.appendChild(tdPrice)
    tr.appendChild(tdTotal)
    tr.appendChild(tdAction)

    itemsTbody.appendChild(tr)
  }

  grandTotalEl.textContent = inr(computeTotal())
}

form.addEventListener("submit", (e) => {
  e.preventDefault()

  const name = normalizeText(itemNameEl.value)
  const qty = numberOrNull(itemQtyEl.value)
  const price = numberOrNull(itemPriceEl.value)

  console.log("[v0] Form submitted:", { name, qty, price })

  if (!name) return
  if (qty === null || qty <= 0) return
  if (price === null || price < 0) return

  items.unshift({
    id: makeId(),
    name,
    qty: Math.floor(qty),
    price,
  })

  itemNameEl.value = ""
  itemQtyEl.value = ""
  itemPriceEl.value = ""
  itemNameEl.focus()

  render()
})

function showModal() {
  console.log("[v0] Showing QR modal")
  qrModal.hidden = false
}

function hideModal() {
  console.log("[v0] Hiding QR modal")
  qrModal.hidden = true
  qrBox.innerHTML = ""
  upiLinkEl.href = "#"
}

qrModal.addEventListener("click", (e) => {
  const target = e.target
  if (!(target instanceof HTMLElement)) return
  if (target.dataset.close === "true") hideModal()
})

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !qrModal.hidden) hideModal()
})

function buildUpiUrl({ vpa, name, amount }) {
  const params = new URLSearchParams()
  params.set("pa", vpa)
  params.set("pn", name)
  params.set("am", String(amount.toFixed(2)))
  params.set("cu", "INR")
  return `upi://pay?${params.toString()}`
}

const QRCode = window.QRCode // Declare QRCode variable

generateQrBtn.addEventListener("click", () => {
  try {
    console.log("[v0] QR generation started. Total items:", items.length)
    const total = computeTotal()
    console.log("[v0] Computed total for QR:", total)

    if (total <= 0) {
      alert("Add at least 1 item first.")
      return
    }

    if (typeof QRCode === "undefined") {
      alert("QR library not loaded. Please refresh the page and try again.")
      return
    }

    const upiUrl = buildUpiUrl({ vpa: DEFAULT_UPI_VPA, name: DEFAULT_PAYEE_NAME, amount: total })
    console.log("[v0] Generated UPI URL:", upiUrl)

    qrBox.innerHTML = ""
    new QRCode(qrBox, {
      text: upiUrl,
      width: 280,
      height: 280,
      correctLevel: QRCode.CorrectLevel.M,
    })

    upiLinkEl.href = upiUrl
    qrAmountEl.textContent = `Total: ${inr(total)}/-`
    showModal()
  } catch (err) {
    console.error("Generate UPI QR failed:", err)
    alert(`Generate UPI QR failed: ${err?.message || err}`)
  }
})

paymentReceivedBtn.addEventListener("click", () => {
  const total = computeTotal()
  console.log("[v0] Payment received clicked. Total:", total)

  if (total > 0 && items.length > 0) {
    const newEntry = {
      id: makeId(),
      createdAt: new Date().toISOString(),
      amount: total,
      vpa: DEFAULT_UPI_VPA,
      payeeName: DEFAULT_PAYEE_NAME,
      items: items.map((it) => ({ name: it.name, qty: it.qty, price: it.price })),
    }
    paymentHistory.unshift(newEntry)
    console.log("[v0] Added new payment history entry:", newEntry.id)
    saveHistory()
    renderHistory()
  }

  items = []
  render()
  hideModal()
})

clearHistoryBtn.addEventListener("click", () => {
  const ok = confirm("Clear all payment history?")
  if (!ok) return
  paymentHistory = []
  saveHistory()
  renderHistory()
})

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.error("Service worker registration failed:", err)
    })
  })
}

paymentHistory = loadHistory()
render()
renderHistory()
