"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Trash2, QrCode, CheckCircle, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface Item {
  id: string
  name: string
  qty: number
  price: number
}

interface PaymentEntry {
  id: string
  createdAt: string
  date: string
  time: string
  amount: number
  vpa: string
  items: Item[]
  status: "pending" | "completed" | "failed"
}

const DEFAULT_UPI_VPA = "9583252256-3@axl"
const DEFAULT_PAYEE_NAME = "KHERWAL BAZAAR"
const HISTORY_STORAGE_KEY = "kherwal_bazaar_payment_history_v1"

export function BillingDashboard() {
  const [items, setItems] = useState<Item[]>([])
  const [history, setHistory] = useState<PaymentEntry[]>([])
  const [itemName, setItemName] = useState("")
  const [itemQty, setItemQty] = useState("")
  const [itemPrice, setItemPrice] = useState("")
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error("[v0] Failed to parse history", e)
      }
    }
  }, [])

  const addItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemPrice) return

    const newItem: Item = {
      id: crypto.randomUUID(),
      name: itemName.trim() || "Garments",
      qty: itemQty ? Number.parseInt(itemQty) : 1, // Using 1 for internal calculation but display can be customized
      price: Number.parseFloat(itemPrice),
    }

    setItems([newItem, ...items])
    setItemName("")
    setItemQty("")
    setItemPrice("")
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const grandTotal = items.reduce((sum, item) => sum + item.qty * item.price, 0)

  const generateQr = () => {
    if (grandTotal <= 0) return

    const params = new URLSearchParams({
      pa: DEFAULT_UPI_VPA,
      pn: DEFAULT_PAYEE_NAME,
      am: grandTotal.toFixed(2),
      cu: "INR",
    })
    const upiUrl = `upi://pay?${params.toString()}`

    // Using a QR code generation API for the preview
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(upiUrl)}`)
    setIsQrModalOpen(true)
  }

  const markAsPaid = () => {
    if (items.length === 0) return

    const now = new Date()
    const newEntry: PaymentEntry = {
      id: crypto.randomUUID(),
      createdAt: now.toISOString(),
      date: now.toLocaleDateString("en-IN"),
      time: now.toLocaleTimeString("en-IN"),
      amount: grandTotal,
      vpa: DEFAULT_UPI_VPA,
      items: [...items],
      status: "completed",
    }

    const updatedHistory = [newEntry, ...history]
    setHistory(updatedHistory)
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory))

    setItems([])
    setIsQrModalOpen(false)
  }

  const clearHistory = () => {
    if (confirm("Clear all history?")) {
      setHistory([])
      localStorage.removeItem(HISTORY_STORAGE_KEY)
    }
  }

  return (
    <div className="w-full space-y-4">
      <header className="w-full flex flex-col items-center justify-center py-2 bg-gradient-to-r from-red-600 to-yellow-500 shadow-lg mb-2">
        <h1 className="text-xl font-black tracking-tight text-white drop-shadow-md">KHERWAL BAZAAR</h1>
        <p className="text-white/90 font-medium text-[8px] uppercase tracking-widest">
          Professional Billing & Payments
        </p>
      </header>

      <div className="grid grid-cols-1 gap-2 px-0">
        <Card className="bg-gradient-to-br from-pink-500/20 to-emerald-500/20 backdrop-blur-xl border-white/10 shadow-xl overflow-hidden rounded-none border-x-0">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-emerald-500/10 pointer-events-none" />
          <CardHeader className="relative z-10 py-2">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Plus className="w-4 h-4 text-pink-400" /> Quick Add
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 py-2">
            <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <Input
                placeholder="Item Name (Optional)"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="bg-black/40 border-white/10 text-white placeholder:text-zinc-400 focus:border-blue-500/50 h-9"
              />
              <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Qty (Default: xxx)"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  className="bg-black/40 border-white/10 text-white placeholder:text-zinc-400 focus:border-blue-500/50 h-9"
                />
                <Input
                  type="number"
                  placeholder="Price (Required)"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="bg-black/40 border-white/10 text-white placeholder:text-zinc-400 focus:border-emerald-500/50 h-9"
                  required
                />
              </div>
              <Button
                type="submit"
                className="bg-white text-black hover:bg-zinc-200 shadow-lg font-bold h-9 rounded-none"
              >
                Add to Bill
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 backdrop-blur-xl border-white/10 shadow-2xl rounded-none border-x-0">
          <CardHeader className="border-b border-white/5 py-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">Current Bill</CardTitle>
              <div className="flex items-center gap-3 bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20">
                <span className="text-emerald-400/70 text-[10px] font-medium uppercase tracking-wider">
                  Grand Total:
                </span>
                <span className="text-emerald-400 font-mono text-2xl font-bold">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {items.length === 0 ? (
              <p className="text-center text-zinc-500 py-12 italic">No items added to current bill</p>
            ) : (
              <Table className="w-full">
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-zinc-300 font-bold border-r border-white/5 w-[10%]">S.No</TableHead>
                    <TableHead className="text-zinc-300 font-bold border-r border-white/5">Item Name</TableHead>
                    <TableHead className="text-zinc-300 font-bold border-r border-white/5 text-center w-[15%]">
                      Qty
                    </TableHead>
                    <TableHead className="text-zinc-300 font-bold border-r border-white/5 text-right w-[20%]">
                      Rate (₹)
                    </TableHead>
                    <TableHead className="text-zinc-300 font-bold border-r border-white/5 text-right w-[20%]">
                      Total (₹)
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="text-zinc-400 font-mono border-r border-white/5 py-2">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-white border-r border-white/5 py-2">{item.name}</TableCell>
                      <TableCell className="text-center text-zinc-300 border-r border-white/5 py-2">
                        {itemQty === "" && item.qty === 1 ? "xxx" : item.qty}
                      </TableCell>
                      <TableCell className="text-right text-zinc-300 border-r border-white/5 py-2">
                        ₹{item.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-400 font-bold border-r border-white/5 py-2">
                        ₹{(item.qty * item.price).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total row like excel */}
                  <TableRow className="bg-emerald-500/5 hover:bg-emerald-500/5 font-bold">
                    <TableCell colSpan={4} className="text-right text-white border-r border-white/5 py-4">
                      Total Amount:
                    </TableCell>
                    <TableCell className="text-right text-emerald-400 text-xl border-r border-white/5 py-4">
                      ₹{grandTotal.toFixed(2)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter className="flex gap-2 p-3 border-t border-white/5">
            <Button
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border-0 rounded-none h-9"
              onClick={generateQr}
              disabled={items.length === 0}
            >
              <QrCode className="w-4 h-4 mr-2 text-blue-400" /> QR Pay
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-0 shadow-lg shadow-emerald-900/20 rounded-none h-9"
              onClick={markAsPaid}
              disabled={items.length === 0}
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Mark Paid
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Payment History / Receive Activity Section */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl rounded-none border-x-0">
        <CardHeader className="flex flex-row items-center justify-between py-1.5 px-4 border-b border-white/5">
          <CardTitle className="text-sm flex items-center gap-2 text-blue-100 uppercase tracking-wider">
            <History className="w-4 h-4 text-blue-400" /> Receive Activity
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="text-zinc-500 hover:text-white h-6 px-2 text-[10px] rounded-none"
          >
            Clear History
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <p className="text-center text-zinc-500 py-8 italic">No receive activity tracked yet</p>
          ) : (
            <div className="space-y-1 divide-y divide-white/5">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-black/30 hover:bg-black/40 transition-all"
                >
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        Payment Received
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] h-4 px-1 uppercase tracking-tighter font-medium">
                          Verified
                        </Badge>
                      </div>
                      <div className="text-[9px] text-zinc-500 font-mono">
                        {entry.date} {entry.time} • {entry.id.slice(0, 6).toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-emerald-400 font-bold text-base leading-none">₹{entry.amount.toFixed(2)}</div>
                    <div className="text-[9px] text-zinc-500 uppercase font-medium mt-0.5">UPI</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Modal */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-xs shadow-2xl rounded-none">
          <DialogHeader>
            <DialogTitle className="text-blue-100">Scan to Pay</DialogTitle>
            <DialogDescription className="text-zinc-400">Recipient: {DEFAULT_PAYEE_NAME}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-inner">
            {qrCodeUrl && (
              <img src={qrCodeUrl || "/placeholder.svg"} alt="UPI QR Code" className="w-[220px] h-[220px]" />
            )}
            <div className="mt-4 text-black font-bold text-xl">₹{grandTotal.toFixed(2)}</div>
          </div>
          <div className="flex flex-col gap-2 pt-4">
            <Button
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-0 rounded-none"
              onClick={markAsPaid}
            >
              Confirm Payment
            </Button>
            <Button
              variant="ghost"
              className="w-full text-zinc-400 hover:text-white rounded-none"
              onClick={() => setIsQrModalOpen(false)}
            >
              Back to Bill
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
