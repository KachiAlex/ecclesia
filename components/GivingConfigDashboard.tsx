'use client'

import { useState, useEffect } from 'react'

interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  accountName: string
  currency: string
  instructions?: string
}

interface GivingConfig {
  id?: string
  paymentMethods: {
    stripe?: {
      enabled: boolean
      publicKey?: string
      secretKey?: string
    }
    paystack?: {
      enabled: boolean
      publicKey?: string
      secretKey?: string
    }
    flutterwave?: {
      enabled: boolean
      publicKey?: string
      secretKey?: string
      webhookSecretHash?: string
    }
    bankTransfer?: {
      enabled: boolean
      banks: BankAccount[]
    }
  }
  currency: string
  defaultMethod?: string
}

type Toast = { message: string; tone: 'success' | 'error' }

export default function GivingConfigDashboard() {
  const [config, setConfig] = useState<GivingConfig>({
    paymentMethods: {
      stripe: { enabled: false },
      paystack: { enabled: false },
      flutterwave: { enabled: false },
      bankTransfer: { enabled: false, banks: [] },
    },
    currency: 'USD',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingFlutterwave, setEditingFlutterwave] = useState(false)
  const [showAddBank, setShowAddBank] = useState(false)
  const [newBank, setNewBank] = useState<Partial<BankAccount>>({
    bankName: '',
    accountNumber: '',
    accountName: '',
    currency: 'USD',
    instructions: '',
  })
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/giving/config')
      if (response.ok) {
        const data = await response.json()
        if (data) {
          const fw = data?.paymentMethods?.flutterwave
          if (fw?.publicKey || fw?.secretKey || fw?.webhookSecretHash) {
            setEditingFlutterwave(false)
            setConfig({
              ...data,
              paymentMethods: {
                ...(data.paymentMethods || {}),
                flutterwave: {
                  ...(data.paymentMethods?.flutterwave || { enabled: false }),
                  publicKey: fw?.publicKey ? '********' : '',
                  secretKey: fw?.secretKey ? '********' : '',
                  webhookSecretHash: fw?.webhookSecretHash ? '********' : '',
                },
              },
            })
          } else {
            setConfig({
              ...data,
              paymentMethods: {
                stripe: { enabled: false, ...(data.paymentMethods?.stripe || {}) },
                paystack: { enabled: false, ...(data.paymentMethods?.paystack || {}) },
                flutterwave: { enabled: false, ...(data.paymentMethods?.flutterwave || {}) },
                bankTransfer: { enabled: false, banks: [], ...(data.paymentMethods?.bankTransfer || {}) },
              },
            })
          }
        }
      }
    } catch (error) {
      console.error('Error loading config:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const handleSave = async (successMessage?: string) => {
    setSaving(true)
    try {
      const response = await fetch('/api/giving/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setToast({ message: successMessage ?? 'Configuration saved successfully!', tone: 'success' })
        loadConfig()
      } else {
        setToast({ message: 'Failed to save configuration', tone: 'error' })
      }
    } catch (error) {
      console.error('Error saving config:', error)
      setToast({ message: 'Failed to save configuration', tone: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddBank = () => {
    if (!newBank.bankName || !newBank.accountNumber || !newBank.accountName) {
      alert('Please fill in all required bank details')
      return
    }

    const bankAccount: BankAccount = {
      id: Date.now().toString(),
      bankName: newBank.bankName!,
      accountNumber: newBank.accountNumber!,
      accountName: newBank.accountName!,
      currency: newBank.currency || 'USD',
      instructions: newBank.instructions,
    }

    setConfig((prev) => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        bankTransfer: {
          ...prev.paymentMethods.bankTransfer!,
          banks: [...(prev.paymentMethods.bankTransfer?.banks || []), bankAccount],
        },
      },
    }))

    setNewBank({
      bankName: '',
      accountNumber: '',
      accountName: '',
      currency: 'USD',
      instructions: '',
    })
    setShowAddBank(false)
  }

  const handleRemoveBank = (bankId: string) => {
    setConfig((prev) => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        bankTransfer: {
          ...prev.paymentMethods.bankTransfer!,
          banks: prev.paymentMethods.bankTransfer?.banks.filter((b) => b.id !== bankId) || [],
        },
      },
    }))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading configuration...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-white ${
            toast.tone === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          <span className="text-sm font-medium">{toast.message}</span>
          <button className="text-white/80 hover:text-white text-sm" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Giving Configuration</h1>
        <p className="text-gray-600">
          Set up payment methods and configure how members can give to your church
        </p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">General Settings</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Currency
              </label>
              <select
                value={config.currency}
                onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="NGN">NGN - Nigerian Naira</option>
                <option value="GHS">GHS - Ghanaian Cedi</option>
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="ZAR">ZAR - South African Rand</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Payment Method
              </label>
              <select
                value={config.defaultMethod || ''}
                onChange={(e) => setConfig({ ...config, defaultMethod: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">None</option>
                <option value="stripe">Stripe</option>
                <option value="paystack">Paystack</option>
                <option value="flutterwave">Flutterwave</option>
                <option value="bankTransfer">Bank Transfer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stripe Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Stripe Payment Gateway</h2>
              <p className="text-sm text-gray-600">Accept credit/debit cards globally</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.paymentMethods.stripe?.enabled || false}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    paymentMethods: {
                      ...config.paymentMethods,
                      stripe: {
                        ...config.paymentMethods.stripe,
                        enabled: e.target.checked,
                      },
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {config.paymentMethods.stripe?.enabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Publishable Key
                </label>
                <input
                  type="text"
                  value={config.paymentMethods.stripe?.publicKey || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      paymentMethods: {
                        ...config.paymentMethods,
                        stripe: {
                          ...config.paymentMethods.stripe!,
                          publicKey: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="pk_live_..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secret Key
                </label>
                <input
                  type="password"
                  value={config.paymentMethods.stripe?.secretKey || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      paymentMethods: {
                        ...config.paymentMethods,
                        stripe: {
                          ...config.paymentMethods.stripe!,
                          secretKey: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="sk_live_..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="text-blue-800">
                  <strong>Get your Stripe keys:</strong> Sign up at{' '}
                  <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="underline">
                    stripe.com
                  </a>{' '}
                  and find your API keys in the Developers section.
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('Stripe settings saved!')}
                  disabled={saving}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Stripe Settings'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Paystack Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Paystack Payment Gateway</h2>
              <p className="text-sm text-gray-600">Accept payments in Africa (Nigeria, Ghana, Kenya, SA)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.paymentMethods.paystack?.enabled || false}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    paymentMethods: {
                      ...config.paymentMethods,
                      paystack: {
                        ...config.paymentMethods.paystack,
                        enabled: e.target.checked,
                      },
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {config.paymentMethods.paystack?.enabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Public Key
                </label>
                <input
                  type="text"
                  value={config.paymentMethods.paystack?.publicKey || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      paymentMethods: {
                        ...config.paymentMethods,
                        paystack: {
                          ...config.paymentMethods.paystack!,
                          publicKey: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="pk_live_..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secret Key
                </label>
                <input
                  type="password"
                  value={config.paymentMethods.paystack?.secretKey || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      paymentMethods: {
                        ...config.paymentMethods,
                        paystack: {
                          ...config.paymentMethods.paystack!,
                          secretKey: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="sk_live_..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="text-blue-800">
                  <strong>Get your Paystack keys:</strong> Sign up at{' '}
                  <a href="https://paystack.com" target="_blank" rel="noopener noreferrer" className="underline">
                    paystack.com
                  </a>{' '}
                  and find your API keys in Settings → API Keys & Webhooks.
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('Paystack settings saved!')}
                  disabled={saving}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Paystack Settings'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Flutterwave Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Flutterwave Payment Gateway</h2>
              <p className="text-sm text-gray-600">Accept payments via Flutterwave</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.paymentMethods.flutterwave?.enabled || false}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    paymentMethods: {
                      ...config.paymentMethods,
                      flutterwave: {
                        ...config.paymentMethods.flutterwave,
                        enabled: e.target.checked,
                      },
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {config.paymentMethods.flutterwave?.enabled && (
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                {editingFlutterwave ? (
                  <button
                    onClick={() => {
                      setEditingFlutterwave(false)
                      loadConfig()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel Edit
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingFlutterwave(true)
                      setConfig({
                        ...config,
                        paymentMethods: {
                          ...config.paymentMethods,
                          flutterwave: {
                            ...(config.paymentMethods.flutterwave || { enabled: true }),
                            enabled: config.paymentMethods.flutterwave?.enabled ?? true,
                            publicKey: '',
                            secretKey: '',
                            webhookSecretHash: '',
                          },
                        },
                      })
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Edit Keys
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
                <input
                  type="text"
                  disabled={!editingFlutterwave}
                  value={config.paymentMethods.flutterwave?.publicKey || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      paymentMethods: {
                        ...config.paymentMethods,
                        flutterwave: {
                          ...config.paymentMethods.flutterwave!,
                          publicKey: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="FLWPUBK_..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                <input
                  type="password"
                  disabled={!editingFlutterwave}
                  value={config.paymentMethods.flutterwave?.secretKey || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      paymentMethods: {
                        ...config.paymentMethods,
                        flutterwave: {
                          ...config.paymentMethods.flutterwave!,
                          secretKey: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="FLWSECK_..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret Hash</label>
                <input
                  type="password"
                  disabled={!editingFlutterwave}
                  value={config.paymentMethods.flutterwave?.webhookSecretHash || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      paymentMethods: {
                        ...config.paymentMethods,
                        flutterwave: {
                          ...config.paymentMethods.flutterwave!,
                          webhookSecretHash: e.target.value,
                        },
                      },
                    })
                  }
                  placeholder="Your verif-hash secret"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('Flutterwave settings saved!')}
                  disabled={saving}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Flutterwave Settings'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bank Transfer Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Bank Transfer</h2>
              <p className="text-sm text-gray-600">Accept direct bank transfers</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.paymentMethods.bankTransfer?.enabled || false}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    paymentMethods: {
                      ...config.paymentMethods,
                      bankTransfer: {
                        enabled: e.target.checked,
                        banks: config.paymentMethods.bankTransfer?.banks || [],
                      },
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {config.paymentMethods.bankTransfer?.enabled && (
            <div className="space-y-4">
              {/* Bank Accounts List */}
              {config.paymentMethods.bankTransfer.banks.map((bank) => (
                <div key={bank.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{bank.bankName}</h3>
                      <p className="text-sm text-gray-600">
                        {bank.accountName} - {bank.accountNumber}
                      </p>
                      <p className="text-xs text-gray-500">{bank.currency}</p>
                      {bank.instructions && (
                        <p className="text-sm text-gray-600 mt-2">{bank.instructions}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveBank(bank.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Bank Button/Form */}
              {!showAddBank ? (
                <button
                  onClick={() => setShowAddBank(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors"
                >
                  + Add Bank Account
                </button>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold">Add Bank Account</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        value={newBank.bankName || ''}
                        onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                        placeholder="e.g., First Bank of Nigeria"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        value={newBank.accountNumber || ''}
                        onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                        placeholder="1234567890"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Name *
                      </label>
                      <input
                        type="text"
                        value={newBank.accountName || ''}
                        onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })}
                        placeholder="Church Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <select
                        value={newBank.currency || 'USD'}
                        onChange={(e) => setNewBank({ ...newBank, currency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="USD">USD</option>
                        <option value="NGN">NGN</option>
                        <option value="GHS">GHS</option>
                        <option value="KES">KES</option>
                        <option value="ZAR">ZAR</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions (Optional)
                      </label>
                      <textarea
                        value={newBank.instructions || ''}
                        onChange={(e) => setNewBank({ ...newBank, instructions: e.target.value })}
                        placeholder="e.g., Please include your name and 'Tithe' in the reference"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddBank}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Add Account
                    </button>
                    <button
                      onClick={() => setShowAddBank(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('Bank transfer settings saved!')}
                  disabled={saving}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Bank Transfer Settings'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  )
}

