'use client';

import { useState, useEffect, useCallback } from 'react';

// Exchange rates (will be fetched from API in production)
const DEFAULT_RATES: Record<string, number> = {
  USD: 1,
  KRW: 1380,
  JPY: 149,
  EUR: 0.92,
  CNY: 7.24,
  GBP: 0.79,
  THB: 34.5,
  VND: 25400,
};

const CURRENCY_INFO: Record<string, { name: string; symbol: string; flag: string }> = {
  USD: { name: '미국 달러', symbol: '$', flag: '🇺🇸' },
  KRW: { name: '한국 원', symbol: '₩', flag: '🇰🇷' },
  JPY: { name: '일본 엔', symbol: '¥', flag: '🇯🇵' },
  EUR: { name: '유로', symbol: '€', flag: '🇪🇺' },
  CNY: { name: '중국 위안', symbol: '¥', flag: '🇨🇳' },
  GBP: { name: '영국 파운드', symbol: '£', flag: '🇬🇧' },
  THB: { name: '태국 바트', symbol: '฿', flag: '🇹🇭' },
  VND: { name: '베트남 동', symbol: '₫', flag: '🇻🇳' },
};

const CURRENCIES = Object.keys(CURRENCY_INFO);

export default function Home() {
  const [leftCurrency, setLeftCurrency] = useState('KRW');
  const [rightCurrency, setRightCurrency] = useState('USD');
  const [leftAmount, setLeftAmount] = useState('10000');
  const [rightAmount, setRightAmount] = useState('');
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCalculator, setActiveCalculator] = useState<'left' | 'right'>('left');

  // Calculate exchange rate
  const getExchangeRate = useCallback((from: string, to: string) => {
    const fromRate = rates[from] || 1;
    const toRate = rates[to] || 1;
    return toRate / fromRate;
  }, [rates]);

  // Convert amount
  const convert = useCallback((amount: string, from: string, to: string) => {
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(numAmount)) return '';
    const rate = getExchangeRate(from, to);
    const result = numAmount * rate;
    return result.toLocaleString('en-US', {
      minimumFractionDigits: to === 'KRW' || to === 'VND' || to === 'JPY' ? 0 : 2,
      maximumFractionDigits: to === 'KRW' || to === 'VND' || to === 'JPY' ? 0 : 2
    });
  }, [getExchangeRate]);

  // Fetch real exchange rates
  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    try {
      // Using exchangerate-api.com (free tier)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();

      const newRates: Record<string, number> = { USD: 1 };
      CURRENCIES.forEach(currency => {
        if (data.rates[currency]) {
          newRates[currency] = data.rates[currency];
        }
      });

      setRates(newRates);
      setLastUpdated(new Date());

      // Save to localStorage for offline use
      localStorage.setItem('exchangeRates', JSON.stringify(newRates));
      localStorage.setItem('lastUpdated', new Date().toISOString());
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      // Try to load from localStorage
      const savedRates = localStorage.getItem('exchangeRates');
      if (savedRates) {
        setRates(JSON.parse(savedRates));
        const savedDate = localStorage.getItem('lastUpdated');
        if (savedDate) setLastUpdated(new Date(savedDate));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Calculate on amount change
  useEffect(() => {
    if (activeCalculator === 'left' && leftAmount) {
      setRightAmount(convert(leftAmount, leftCurrency, rightCurrency));
    }
  }, [leftAmount, leftCurrency, rightCurrency, activeCalculator, convert]);

  useEffect(() => {
    if (activeCalculator === 'right' && rightAmount) {
      setLeftAmount(convert(rightAmount, rightCurrency, leftCurrency));
    }
  }, [rightAmount, rightCurrency, leftCurrency, activeCalculator, convert]);

  // Handle input change
  const handleLeftChange = (value: string) => {
    setActiveCalculator('left');
    setLeftAmount(value);
  };

  const handleRightChange = (value: string) => {
    setActiveCalculator('right');
    setRightAmount(value);
  };

  // Swap currencies
  const swapCurrencies = () => {
    setLeftCurrency(rightCurrency);
    setRightCurrency(leftCurrency);
    setLeftAmount(rightAmount);
    setRightAmount(leftAmount);
  };

  // Number pad
  const handleNumberPad = (key: string) => {
    const setter = activeCalculator === 'left' ? handleLeftChange : handleRightChange;
    const current = activeCalculator === 'left' ? leftAmount : rightAmount;

    if (key === 'C') {
      setter('');
    } else if (key === '⌫') {
      setter(current.slice(0, -1));
    } else if (key === '.') {
      if (!current.includes('.')) {
        setter(current + '.');
      }
    } else {
      setter(current + key);
    }
  };

  const rate = getExchangeRate(leftCurrency, rightCurrency);
  const rateDisplay = rate < 1
    ? `1 ${rightCurrency} = ${(1/rate).toFixed(2)} ${leftCurrency}`
    : `1 ${leftCurrency} = ${rate.toFixed(4)} ${rightCurrency}`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-1">환율 듀얼 계산기</h1>
        <p className="text-gray-400 text-sm">Dual Currency Calculator</p>
        {lastUpdated && (
          <p className="text-gray-500 text-xs mt-1">
            업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
            <button
              onClick={fetchRates}
              className="ml-2 text-blue-400 hover:text-blue-300"
              disabled={isLoading}
            >
              {isLoading ? '⏳' : '🔄'}
            </button>
          </p>
        )}
      </div>

      {/* Dual Calculator */}
      <div className="flex gap-2 mb-4">
        {/* Left Calculator */}
        <div
          className={`flex-1 rounded-2xl p-4 cursor-pointer transition-all ${
            activeCalculator === 'left'
              ? 'bg-blue-600/20 ring-2 ring-blue-500'
              : 'bg-gray-800'
          }`}
          onClick={() => setActiveCalculator('left')}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{CURRENCY_INFO[leftCurrency].flag}</span>
            <select
              value={leftCurrency}
              onChange={(e) => setLeftCurrency(e.target.value)}
              className="bg-transparent text-white font-semibold text-lg outline-none cursor-pointer"
            >
              {CURRENCIES.map(c => (
                <option key={c} value={c} className="bg-gray-800">
                  {c} - {CURRENCY_INFO[c].name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-gray-400">{CURRENCY_INFO[leftCurrency].symbol}</span>
            <input
              type="text"
              value={leftAmount}
              onChange={(e) => handleLeftChange(e.target.value)}
              className="bg-transparent text-3xl font-bold w-full outline-none"
              placeholder="0"
            />
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={swapCurrencies}
          className="self-center bg-gray-700 hover:bg-gray-600 rounded-full p-3 transition-colors"
        >
          ⇄
        </button>

        {/* Right Calculator */}
        <div
          className={`flex-1 rounded-2xl p-4 cursor-pointer transition-all ${
            activeCalculator === 'right'
              ? 'bg-green-600/20 ring-2 ring-green-500'
              : 'bg-gray-800'
          }`}
          onClick={() => setActiveCalculator('right')}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{CURRENCY_INFO[rightCurrency].flag}</span>
            <select
              value={rightCurrency}
              onChange={(e) => setRightCurrency(e.target.value)}
              className="bg-transparent text-white font-semibold text-lg outline-none cursor-pointer"
            >
              {CURRENCIES.map(c => (
                <option key={c} value={c} className="bg-gray-800">
                  {c} - {CURRENCY_INFO[c].name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-gray-400">{CURRENCY_INFO[rightCurrency].symbol}</span>
            <input
              type="text"
              value={rightAmount}
              onChange={(e) => handleRightChange(e.target.value)}
              className="bg-transparent text-3xl font-bold w-full outline-none"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Exchange Rate Display */}
      <div className="text-center text-gray-400 text-sm mb-6">
        {rateDisplay}
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
        {['7', '8', '9', 'C', '4', '5', '6', '⌫', '1', '2', '3', '.', '00', '0', '000', '='].map((key) => (
          <button
            key={key}
            onClick={() => key !== '=' && handleNumberPad(key)}
            className={`
              py-4 rounded-xl text-xl font-semibold transition-colors
              ${key === 'C' ? 'bg-red-600/50 hover:bg-red-600' : ''}
              ${key === '⌫' ? 'bg-yellow-600/50 hover:bg-yellow-600' : ''}
              ${key === '=' ? 'bg-blue-600 hover:bg-blue-500' : ''}
              ${!['C', '⌫', '='].includes(key) ? 'bg-gray-700 hover:bg-gray-600' : ''}
            `}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Quick Amount Buttons */}
      <div className="mt-6">
        <p className="text-gray-400 text-sm mb-2 text-center">빠른 금액</p>
        <div className="flex flex-wrap justify-center gap-2">
          {leftCurrency === 'KRW' ? (
            <>
              {['1만', '5만', '10만', '50만', '100만'].map((label, idx) => (
                <button
                  key={label}
                  onClick={() => handleLeftChange(['10000', '50000', '100000', '500000', '1000000'][idx])}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                >
                  {label}
                </button>
              ))}
            </>
          ) : (
            <>
              {['10', '50', '100', '500', '1000'].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleLeftChange(amount)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                >
                  {CURRENCY_INFO[leftCurrency].symbol}{amount}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-gray-500 text-xs">
        <p>오프라인에서도 사용 가능 (마지막 환율 기준)</p>
        <p className="mt-1">© 2025 Dual Currency Calculator</p>
      </footer>
    </main>
  );
}
