import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, LogIn, LogOut, Users, Clock, Home, FileBarChart, Wallet, Settings as SettingsIcon, UserPlus, CheckCircle2, XCircle, Calendar, ChevronLeft, ChevronRight, Plus, Bell, Shield, HelpCircle, FileText, Award, Trophy, Sparkles, Coffee, Edit3, Trash2, AlertCircle, Check, X, Briefcase, Mail, Phone, Camera, ChevronDown, Download, TrendingUp, Activity, Building2, Search, RefreshCw } from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup } from 'firebase/auth';

// ── Firebase init (singleton guard) ──
const _fbConfig = {
  apiKey: 'AIzaSyBmYPvgVVKbrRUmqpGMORzsZPOtO4X4WZw',
  authDomain: 'clowi-cattd.firebaseapp.com',
  projectId: 'clowi-cattd',
  storageBucket: 'clowi-cattd.firebasestorage.app',
  messagingSenderId: '418062327499',
  appId: '1:418062327499:web:992ddb3fa830b0a441454e',
};
const _fbApp  = getApps().length ? getApps()[0] : initializeApp(_fbConfig);
const _fbAuth = getAuth(_fbApp);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


// ============ CONSTANTS ============
const ROLES = ['HR', 'Manager', 'TeamLead', 'Employee'];
const BADGES = [
  { id: 'timekeeper', label: 'Time Keeper', icon: Clock, color: 'from-emerald-400 to-emerald-600', desc: 'On time 10 days in a row' },
  { id: 'late', label: 'Late Bird', icon: Coffee, color: 'from-amber-400 to-orange-500', desc: 'Late 3+ times this month' },
  { id: 'eagle', label: 'Early Eagle', icon: Sparkles, color: 'from-sky-400 to-blue-600', desc: 'First to check in' },
  { id: 'workaholic', label: 'Workaholic', icon: Trophy, color: 'from-violet-400 to-purple-600', desc: '40+ hours this week' },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$',  label: 'US Dollar',        locale: 'en-US' },
  { code: 'EUR', symbol: '€',  label: 'Euro',              locale: 'de-DE' },
  { code: 'GBP', symbol: '£',  label: 'British Pound',     locale: 'en-GB' },
  { code: 'INR', symbol: '₹',  label: 'Indian Rupee',      locale: 'en-IN' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham',       locale: 'ar-AE' },
  { code: 'SAR', symbol: '﷼',  label: 'Saudi Riyal',       locale: 'ar-SA' },
  { code: 'JPY', symbol: '¥',  label: 'Japanese Yen',      locale: 'ja-JP' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar',  locale: 'en-SG' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar',   locale: 'en-CA' },
];

const ROLE_PILL = {
  Admin: 'bg-rose-100 text-rose-800 border border-rose-200',
  HR: 'bg-amber-100 text-amber-800 border border-amber-200',
  Manager: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  TeamLead: 'bg-sky-100 text-sky-800 border border-sky-200',
  Employee: 'bg-stone-100 text-stone-800 border border-stone-200',
};

const DEPT_PILL = {
  Admin: 'bg-stone-900 text-stone-100 border border-stone-800',
  HR: 'bg-amber-50 text-amber-850 border border-amber-200',
  Manager: 'bg-emerald-50 text-emerald-850 border border-emerald-200',
  TeamLead: 'bg-indigo-50 text-indigo-850 border border-indigo-200',
  Employee: 'bg-violet-50 text-violet-850 border border-violet-200',
};

const DEPT_LABEL = {
  Admin: 'Executive Suite',
  HR: 'Human Resources',
  Manager: 'Operations',
  TeamLead: 'Product & Tech Lead',
  Employee: 'Engineering Staff',
};

// ============ HELPERS ============
function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
const todayKey = () => new Date().toISOString().slice(0, 10);
const initials = (n) => n?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '?';
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DEFAULT_PAYROLL = { base: 5000, hra: 1200, performance: 800, leaveDeduction: 0, tax: 600, prEsi: 200, medical: 150 };
const PAID_LEAVE_TYPES = new Set(['annual', 'wfh', 'work from home', 'paid']);

const toValidDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dateKeyFromIso = (value) => {
  const date = toValidDate(value);
  return date ? date.toISOString().slice(0, 10) : null;
};

const monthLabelToRange = (label) => {
  const [monthName, yearText] = String(label || '').split(' ');
  const monthIndex = MONTH_NAMES.indexOf(monthName);
  const year = Number(yearText);
  const now = new Date();
  const safeYear = Number.isInteger(year) ? year : now.getFullYear();
  const safeMonth = monthIndex >= 0 ? monthIndex : now.getMonth();
  const start = new Date(Date.UTC(safeYear, safeMonth, 1));
  const end = new Date(Date.UTC(safeYear, safeMonth + 1, 0));
  return {
    monthKey: `${safeYear}-${String(safeMonth + 1).padStart(2, '0')}`,
    startKey: start.toISOString().slice(0, 10),
    endKey: end.toISOString().slice(0, 10),
    daysInMonth: end.getUTCDate(),
  };
};

const eachDateKey = (from, to) => {
  const start = toValidDate(`${from}T00:00:00.000Z`);
  const end = toValidDate(`${to}T00:00:00.000Z`);
  if (!start || !end || start > end) return [];
  const days = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
};

const normalizeAttendanceRecords = (attendance = []) => {
  const daily = new Map();
  attendance.forEach((record) => {
    const checkIn = toValidDate(record.checkIn);
    if (!record?.userId || !checkIn) return;
    const date = record.date || dateKeyFromIso(record.checkIn);
    if (!date) return;
    const key = `${record.userId}:${date}`;
    const existing = daily.get(key) || {
      ...record,
      id: key,
      date,
      checkIn: checkIn.toISOString(),
      checkOut: null,
      sessions: 0,
      hasOpenSession: false,
    };

    const currentFirst = toValidDate(existing.checkIn);
    if (!currentFirst || checkIn < currentFirst) {
      existing.checkIn = checkIn.toISOString();
      existing.locationId = record.locationId || existing.locationId;
      existing.locationName = record.locationName || existing.locationName;
    }

    const checkOut = toValidDate(record.checkOut);
    if (checkOut) {
      const currentLast = toValidDate(existing.checkOut);
      if (!currentLast || checkOut > currentLast) existing.checkOut = checkOut.toISOString();
    } else {
      existing.hasOpenSession = true;
    }

    existing.sessions += 1;
    daily.set(key, existing);
  });

  return Array.from(daily.values()).map((record) => {
    const checkIn = toValidDate(record.checkIn);
    const checkOut = toValidDate(record.checkOut);
    return {
      ...record,
      checkOut: checkOut && checkIn && checkOut >= checkIn ? checkOut.toISOString() : null,
    };
  });
};

const getPayrollForMonth = (userId, data, monthLabel) => {
  const base = { ...DEFAULT_PAYROLL, ...(data.payroll?.[userId] || {}) };
  const gross = (base.base || 0) + (base.hra || 0) + (base.performance || 0);
  const { startKey, endKey, daysInMonth } = monthLabelToRange(monthLabel);
  const leaveDays = new Set();
  const unpaidLeaveDays = new Set();

  (data.leaves || []).forEach((leave) => {
    if (leave.userId !== userId || leave.status !== 'approved') return;
    const type = String(leave.type || '').trim().toLowerCase();
    eachDateKey(leave.from, leave.to).forEach((day) => {
      if (day < startKey || day > endKey) return;
      leaveDays.add(day);
      if (!PAID_LEAVE_TYPES.has(type)) unpaidLeaveDays.add(day);
    });
  });

  const attendanceDays = new Set(
    normalizeAttendanceRecords(data.attendance || [])
      .filter((record) => record.userId === userId && record.date >= startKey && record.date <= endKey)
      .map((record) => record.date)
  );
  const dailyRate = daysInMonth > 0 ? gross / daysInMonth : 0;
  const autoLeaveDeduction = Math.round(dailyRate * unpaidLeaveDays.size);

  return {
    ...base,
    leaveDeduction: autoLeaveDeduction,
    manualLeaveDeduction: base.leaveDeduction || 0,
    payrollMeta: {
      attendanceDays: attendanceDays.size,
      leaveDays: leaveDays.size,
      unpaidLeaveDays: unpaidLeaveDays.size,
      dailyRate,
      daysInMonth,
    },
  };
};

// Format a numeric amount using the active currency
const fmtCurrency = (amount, currencyCode = 'USD') => {
  const cur = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  try {
    return new Intl.NumberFormat(cur.locale, { style: 'currency', currency: cur.code, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${cur.symbol}${Number(amount).toLocaleString()}`;
  }
};

const downloadCSV = (filename, headers, rows) => {
  const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const printPDF = (title, headers, rows) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download/print PDF reports.');
    return;
  }
  
  const headersHtml = headers.map(h => `<th>${h}</th>`).join('');
  const rowsHtml = rows.map(row => `
    <tr>
      ${row.map(cell => `<td>${cell || '-'}</td>`).join('')}
    </tr>
  `).join('');
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #fff; color: #1c1917; padding: 40px; font-size: 11px; }
    .header { border-bottom: 2.5px solid #1c1917; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { font-size: 18px; font-weight: 800; color: #0c0a09; letter-spacing: -0.5px; }
    .header p { font-size: 10px; color: #78716c; margin-top: 4px; font-weight: 500; }
    .date-stamp { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #78716c; font-weight: 600; text-align: right; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #f5f5f4; color: #44403c; text-align: left; padding: 10px 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; border: 1.5px solid #e7e5e4; }
    td { padding: 10px 12px; border: 1px solid #e7e5e4; color: #1c1917; font-weight: 500; }
    tr:nth-child(even) td { background: #fafaf9; }
    .footer { margin-top: 50px; text-align: center; font-size: 8px; color: #a8a29e; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${title}</h1>
      <p>Clowi SaaS Enterprise Resource Reporting Gateway</p>
    </div>
    <div class="date-stamp">Generated on ${dateStr}</div>
  </div>
  <table>
    <thead>
      <tr>
        ${headersHtml}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
  <div class="footer">
    Confidential · Automated Gatekeepers of Clowi Systems
  </div>
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>`;
  printWindow.document.write(html);
  printWindow.document.close();
};

const printPayslip = (user, payroll, month, settings, C) => {
  const fallbackCompany = {
    name: 'Company Name',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    gstin: '',
    logo: '',
  };
  const fallbackBank = { bankName: '', accountName: '', accountNo: '', ifsc: '', branch: '' };
  const co = { ...fallbackCompany, ...(settings?.company || {}) };
  const cb = { ...fallbackBank, ...(settings?.companyBank || {}) };
  const emp = user;
  const companyLogo = co.logo || `${window.location.origin}${import.meta.env.BASE_URL}logo.png`;
  const companyLogoMarkup = companyLogo
    ? `<img src="${companyLogo}" alt="${co.name || 'Company'} Logo" />`
    : `<span>${(co.name || 'C').charAt(0)}</span>`;
  const base = payroll.base || 0;
  const hra = payroll.hra || 0;
  const perf = payroll.performance || 0;
  const tax = payroll.tax || 0;
  const prEsi = payroll.prEsi || 0;
  const leaveD = payroll.leaveDeduction || 0;
  const gross = base + hra + perf;
  const totalDed = tax + prEsi + leaveD;
  const net = gross - totalDed;
  const printWindow = window.open('', '_blank');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Payslip - ${month} - ${emp.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #1c1917; font-size: 11px; }
    .page { width: 794px; min-height: 1123px; margin: 0 auto; padding: 36px 40px; position: relative; }
    /* Header */
    .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18px; border-bottom: 2.5px solid #1c1917; margin-bottom: 20px; }
    .company-logo-box { width: 64px; height: 64px; border: 1px solid #e7e5e4; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fff; color: #fbbf24; font-size: 20px; font-weight: 900; letter-spacing: -1px; flex-shrink: 0; }
    .company-logo-box img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
    .company-info h1 { font-size: 18px; font-weight: 800; color: #0c0a09; letter-spacing: -0.5px; }
    .company-info p { font-size: 9.5px; color: #78716c; margin-top: 2px; }
    .payslip-badge { background: #1c1917; color: #fbbf24; padding: 6px 16px; border-radius: 8px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
    /* Month strip */
    .month-strip { background: #f5f5f4; border-radius: 10px; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .month-strip .label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #78716c; font-weight: 600; }
    .month-strip .value { font-size: 13px; font-weight: 700; color: #1c1917; }
    /* Info grid */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .info-card { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 10px; padding: 12px 14px; }
    .info-card .section-title { font-size: 8px; text-transform: uppercase; letter-spacing: 1.2px; color: #a8a29e; font-weight: 700; margin-bottom: 8px; }
    .info-card table { width: 100%; }
    .info-card td { padding: 2.5px 0; font-size: 10px; }
    .info-card td:first-child { color: #78716c; width: 40%; }
    .info-card td:last-child { font-weight: 600; color: #1c1917; }
    /* Earnings table */
    .section-header { font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px; color: #78716c; font-weight: 700; margin-bottom: 8px; margin-top: 18px; }
    .pay-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    .pay-table thead tr { background: #1c1917; }
    .pay-table thead th { color: #fafaf9; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 8px 12px; text-align: left; }
    .pay-table thead th:last-child { text-align: right; }
    .pay-table tbody tr { border-bottom: 1px solid #f5f5f4; }
    .pay-table tbody tr:last-child { border-bottom: none; }
    .pay-table tbody td { padding: 8px 12px; font-size: 10.5px; color: #292524; }
    .pay-table tbody td:last-child { text-align: right; font-weight: 600; }
    .pay-table tfoot td { padding: 9px 12px; font-weight: 700; font-size: 11px; border-top: 2px solid #e7e5e4; }
    .pay-table tfoot td:last-child { text-align: right; }
    .earn-total { background: #f0fdf4; color: #15803d; }
    .ded-total { background: #fff1f2; color: #be123c; }
    /* Net pay */
    .net-box { background: #1c1917; color: white; border-radius: 12px; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; margin-top: 16px; }
    .net-box .net-label { font-size: 11px; font-weight: 600; color: #d6d3d1; text-transform: uppercase; letter-spacing: 1px; }
    .net-box .net-amount { font-size: 24px; font-weight: 900; color: #fbbf24; letter-spacing: -1px; }
    .net-box .net-month { font-size: 9px; color: #a8a29e; margin-top: 2px; }
    /* Bank details */
    .bank-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; }
    .bank-card { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 10px; padding: 12px 14px; }
    .bank-card .section-title { font-size: 8px; text-transform: uppercase; letter-spacing: 1.2px; color: #a8a29e; font-weight: 700; margin-bottom: 8px; }
    .bank-card table { width: 100%; }
    .bank-card td { padding: 2.5px 0; font-size: 10px; }
    .bank-card td:first-child { color: #78716c; width: 45%; }
    .bank-card td:last-child { font-weight: 600; color: #1c1917; }
    /* Footer */
    .footer { margin-top: 28px; padding-top: 14px; border-top: 1.5px solid #e7e5e4; display: flex; justify-content: space-between; align-items: flex-end; }
    .sig-box { text-align: center; }
    .sig-line { width: 120px; border-bottom: 1.5px solid #a8a29e; margin-bottom: 4px; height: 30px; }
    .sig-label { font-size: 8.5px; color: #78716c; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; }
    .footer-note { font-size: 8px; color: #a8a29e; text-align: center; margin-top: 18px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { padding: 24px 28px; } }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div style="display:flex;align-items:center;gap:14px">
      <div class="company-logo-box">${companyLogoMarkup}</div>
      <div class="company-info">
        <h1>${co.name || 'Company Name'}</h1>
        <p>${co.address || '-'}</p>
        <p>${co.city || '-'} &nbsp;|&nbsp; ${co.phone || '-'} &nbsp;|&nbsp; ${co.email || '-'}</p>
        ${co.gstin ? `<p style="font-size:8.5px;color:#a8a29e;margin-top:2px">GSTIN: ${co.gstin}</p>` : ''}
      </div>
    </div>
    <div style="text-align:right">
      <div class="payslip-badge">Pay Slip</div>
      <p style="font-size:9px;color:#78716c;margin-top:6px">Generated: ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</p>
      ${co.website ? `<p style="font-size:9px;color:#a8a29e">${co.website}</p>` : ''}
    </div>
  </div>

  <!-- Month Strip -->
  <div class="month-strip">
    <div><div class="label">Pay Period</div><div class="value">${month}</div></div>
    <div><div class="label">Employee ID</div><div class="value">${emp.corporateId || emp.id?.slice(-6).toUpperCase() || 'EMP-001'}</div></div>
    <div><div class="label">Payment Mode</div><div class="value">Bank Transfer</div></div>
    <div><div class="label">Pay Date</div><div class="value">${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div></div>
  </div>

  <!-- Employee + Company Info -->
  <div class="info-grid">
    <div class="info-card">
      <div class="section-title">Employee Details</div>
      <table>
        <tr><td>Full Name</td><td>${emp.name}</td></tr>
        <tr><td>Designation</td><td>${emp.role}</td></tr>
        <tr><td>Email</td><td>${emp.email}</td></tr>
        <tr><td>Contact</td><td>${emp.contact || 'Not provided'}</td></tr>
        <tr><td>Department</td><td>${emp.department || 'General'}</td></tr>
      </table>
    </div>
    <div class="info-card">
      <div class="section-title">Company Details</div>
      <table>
        <tr><td>Company</td><td>${co.name || '-'}</td></tr>
        <tr><td>Address</td><td>${co.address || '-'}</td></tr>
        <tr><td>City</td><td>${co.city || '-'}</td></tr>
        <tr><td>HR Email</td><td>${co.email || '-'}</td></tr>
        <tr><td>GSTIN</td><td>${co.gstin || '-'}</td></tr>
      </table>
    </div>
  </div>

  <!-- Earnings Table -->
  <div class="section-header">Earnings</div>
  <table class="pay-table">
    <thead><tr><th>Description</th><th>Type</th><th>Amount</th></tr></thead>
    <tbody>
      <tr><td>Basic / Base Salary</td><td>Fixed Monthly</td><td>${C(base)}</td></tr>
      <tr><td>House Rent Allowance (HRA)</td><td>Allowance</td><td>${C(hra)}</td></tr>
      <tr><td>Performance Bonus</td><td>Variable Incentive</td><td>${C(perf)}</td></tr>
    </tbody>
    <tfoot><tr class="earn-total"><td colspan="2"><strong>Gross Earnings</strong></td><td><strong>${C(gross)}</strong></td></tr></tfoot>
  </table>

  <!-- Deductions Table -->
  <div class="section-header" style="margin-top:14px">Deductions</div>
  <table class="pay-table">
    <thead><tr><th>Description</th><th>Type</th><th>Amount</th></tr></thead>
    <tbody>
      <tr><td>Income Tax / Professional Tax</td><td>Statutory</td><td>${C(tax)}</td></tr>
      <tr><td>Provident Fund (PF) + ESI</td><td>Statutory</td><td>${C(prEsi)}</td></tr>
      ${leaveD > 0 ? `<tr><td>Leave Deduction</td><td>Unpaid Leaves</td><td>${C(leaveD)}</td></tr>` : ''}
    </tbody>
    <tfoot><tr class="ded-total"><td colspan="2"><strong>Total Deductions</strong></td><td><strong>- ${C(totalDed)}</strong></td></tr></tfoot>
  </table>

  <!-- Net Pay Box -->
  <div class="net-box">
    <div>
      <div class="net-label">Net Pay (Take Home)</div>
      <div class="net-month">${month} &nbsp;·&nbsp; ${emp.name}</div>
    </div>
    <div class="net-amount">${C(net)}</div>
  </div>

  <!-- Bank Details -->
  <div class="bank-grid">
    <div class="bank-card">
      <div class="section-title">Employee Bank Details</div>
      <table>
        <tr><td>Bank Name</td><td>${emp.bankName || 'Not provided'}</td></tr>
        <tr><td>Account Name</td><td>${emp.bankAccountName || emp.name}</td></tr>
        <tr><td>Account No.</td><td>${emp.bankAccountNo || 'Not provided'}</td></tr>
        <tr><td>IFSC / SWIFT</td><td>${emp.bankIfsc || 'Not provided'}</td></tr>
        <tr><td>Branch</td><td>${emp.bankBranch || 'Not provided'}</td></tr>
      </table>
    </div>
    <div class="bank-card">
      <div class="section-title">Company Bank Details</div>
      <table>
        <tr><td>Bank Name</td><td>${cb.bankName || '-'}</td></tr>
        <tr><td>Account Name</td><td>${cb.accountName || '-'}</td></tr>
        <tr><td>Account No.</td><td>${cb.accountNo || '-'}</td></tr>
        <tr><td>IFSC / SWIFT</td><td>${cb.ifsc || '-'}</td></tr>
        <tr><td>Branch</td><td>${cb.branch || '-'}</td></tr>
      </table>
    </div>
  </div>

  <!-- Signatures -->
  <div class="footer">
    <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Employee Signature</div></div>
    <div style="text-align:center;font-size:8.5px;color:#a8a29e;">
      <p>This is a system-generated payslip and does not require a physical signature.</p>
      <p style="margin-top:3px">${co.name || ''} &nbsp;·&nbsp; ${co.website || ''}</p>
    </div>
    <div class="sig-box"><div class="sig-line"></div><div class="sig-label">Authorized Signatory</div></div>
  </div>
  <div class="footer-note">CONFIDENTIAL — This document is intended solely for the named employee. Unauthorized use, disclosure or copying is strictly prohibited.</div>
</div>
<script>window.onload=function(){window.print();setTimeout(function(){window.close();},600);};<\/script>
</body></html>`;
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
};

// ============ STORE & LOCALSTORAGE PERSISTENCE ============
const INITIAL_DATA = {
  users: [],
  locations: [{ id: 'loc_hq', name: 'HQ — Downtown', lat: 37.7749, lng: -122.4194, radius: 150 }],
  attendance: [],
  leaves: [],
  holidays: [
    `${new Date().getFullYear()}-05-26`,
    `${new Date().getFullYear()}-06-19`,
    `${new Date().getFullYear()}-07-04`,
  ],
  payroll: {},
  settings: {
    notifications: { email: true, push: true, weekly: false },
    twoFactor: false,
    currency: 'USD',
    company: {
      name: 'Clowi Technologies Pvt. Ltd.',
      address: '123 Corporate Avenue, Business District',
      city: 'Mumbai, Maharashtra - 400001',
      phone: '+91 98765 43210',
      email: 'hr@clowi.com',
      website: 'www.clowi.com',
      gstin: 'GSTIN27AAAAA0000A1Z5',
    },
    companyBank: {
      bankName: 'HDFC Bank',
      accountName: 'Clowi Technologies Pvt. Ltd.',
      accountNo: '50200012345678',
      ifsc: 'HDFC0001234',
      branch: 'Nariman Point Branch, Mumbai',
    },
  },
  notifications: [],
};

const useStore = () => {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('clowi_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse stored clowi_data', e);
      }
    }
    return INITIAL_DATA;
  });

  const update = (fn) => {
    setData((prev) => {
      const next = fn({ ...prev });
      localStorage.setItem('clowi_data', JSON.stringify(next));
      return next;
    });
  };

  return [data, update];
};

// ============ UI PRIMITIVES ============
const Pill = ({ role }) => (
  <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider ${ROLE_PILL[role] || ROLE_PILL.Employee}`}>{role}</span>
);

const Avatar = ({ name, size = 'md', src }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-lg', xl: 'w-20 h-20 text-xl' };
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200 flex items-center justify-center font-semibold text-stone-700 ring-2 ring-white shadow-sm flex-shrink-0`}>
      {src ? (
        <img src={src} alt={`${name || 'User'} logo`} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  );
};const Logo = ({ size = 'sidebar' }) => {
  const sizes = {
    login: 'w-72 h-28',
    sidebar: 'w-full h-24',
    mobile: 'w-32 h-10',
  };
  const imageClass = size === 'sidebar'
    ? 'absolute top-1/2 left-1/2 w-[250%] max-w-none h-auto -translate-x-1/2 -translate-y-1/2 mix-blend-multiply'
    : size === 'login'
      ? 'absolute top-1/2 left-1/2 w-[230%] max-w-none h-auto -translate-x-1/2 -translate-y-1/2 mix-blend-multiply'
      : 'w-full h-full object-contain';
  return (
    <div className={`relative overflow-hidden flex items-center justify-center ${sizes[size] || sizes.sidebar}`}>
      <img 
        src={`${import.meta.env.BASE_URL}logo.png`} 
        alt="Clowi Logo" 
        className={imageClass} 
      />
    </div>
  );
};

// ============ LOGIN / REGISTRATION ============
function Login({ onLogin, onRegister }) {
  const [isRegister, setIsRegister] = useState(false);
  const [hasUsers, setHasUsers] = useState(true);
  const [email, setEmail] = useState('');
  const [corporateId, setCorporateId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Employee');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dynamically check if Corporate ID exists on MongoDB to show register vs login mode
  useEffect(() => {
    if (!corporateId.trim()) return;
    const timer = setTimeout(() => {
      fetch(`${API_URL}/api/tenant/${corporateId.trim()}/exists`)
        .then((res) => res.json())
        .then((res) => {
          setHasUsers(res.hasUsers);
          if (!res.hasUsers) {
            setIsRegister(true);
          } else {
            setIsRegister(false);
          }
        })
        .catch((err) => console.error(err));
    }, 500);
    return () => clearTimeout(timer);
  }, [corporateId]);

  // ── Firebase OAuth — called directly (no nested popup) ──
  const handleOAuth = async (providerName) => {
    setError('');
    setSuccess('');
    try {
      const provider = providerName === 'google'
        ? new GoogleAuthProvider()
        : new OAuthProvider('microsoft.com');

      const result = await signInWithPopup(_fbAuth, provider);
      const firebaseEmail = result.user.email?.toLowerCase() || '';

      // Try to match against a registered Clowi account
      const clowiData = JSON.parse(localStorage.getItem('clowi_data') || '{"users":[]}');
      const matched = clowiData.users?.find(u => u.email.toLowerCase() === firebaseEmail);

      if (matched) {
        // Known user → log in directly
        onLogin(matched);
      } else {
        // New Firebase user → pre-fill registration
        setName(result.user.displayName || '');
        setEmail(firebaseEmail);
        setIsRegister(true);
        setSuccess(`✨ ${providerName === 'google' ? 'Google' : 'Microsoft'} verified! Enter your Corporate ID & complete registration below.`);
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'OAuth sign-in failed.');
      }
    }
  };

  const submit = async () => {
    setError('');
    setSuccess('');
    if (!email.trim() || !password || !corporateId.trim()) {
      return setError('Please fill in all fields.');
    }

    if (isRegister) {
      if (!name.trim()) return setError('Please enter your full name.');
      try {
        await onRegister({ name, email, role, password, corporateId });
        setSuccess('Account and company created successfully! You can now sign in.');
        setIsRegister(false);
        setName('');
        setPassword('');
        setHasUsers(true);
      } catch (e) {
        setError(e.message || 'Registration failed.');
      }
    } else {
      try {
        await onLogin({ email, password, corporateId });
      } catch (e) {
        setError(e.message || 'Invalid credentials or Corporate ID.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-stone-100" style={{
      background: 'radial-gradient(circle at 20% 20%, #fef3c7 0%, transparent 50%), radial-gradient(circle at 80% 80%, #fce7f3 0%, transparent 50%), #fafaf9'
    }}>
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-stone-200 shadow-xl">
        <div className="flex justify-center mb-8">
          <Logo size="login" />
        </div>

        {!hasUsers && (
          <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-200">
            <p className="text-xs text-amber-900 font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Sparkles size={12} /> Company Initial Setup</p>
            <p className="text-xs text-amber-800 leading-relaxed">This Corporate ID is not registered yet. Create the initial Administrator or staff account below to register your company.</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={14} /> {success}
          </div>
        )}

        <div className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-stone-500 font-semibold mb-1">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:border-stone-900 transition" />
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-stone-500 font-semibold mb-1">Corporate ID</label>
            <input type="text" value={corporateId} onChange={(e) => setCorporateId(e.target.value)} placeholder="CORP-12345" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:border-stone-900 transition" />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-stone-500 font-semibold mb-1">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.com" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:border-stone-900 transition" />
          </div>

          {isRegister && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-stone-500 font-semibold mb-1">Role Type</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:border-stone-900 transition">
                <option value="Employee">Employee (Staff)</option>
                <option value="TeamLead">Team Lead</option>
                <option value="Manager">Manager</option>
                <option value="HR">HR Officer</option>
                <option value="Admin">System Administrator</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-stone-500 font-semibold mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:border-stone-900 transition" />
          </div>

          {error && <p className="text-rose-600 text-xs flex items-center gap-1.5 pt-1"><AlertCircle size={12} />{error}</p>}
          
          <button onClick={submit} className="w-full py-3.5 bg-stone-900 text-stone-50 rounded-2xl text-sm font-semibold hover:bg-stone-850 active:scale-[0.98] transition shadow-lg shadow-stone-900/10 mt-2">
            {isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </div>

        {!isRegister && (
          <>
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200"></div></div>
              <span className="relative px-3 bg-white text-[10px] text-stone-400 font-semibold uppercase tracking-widest">Or Continue With</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleOAuth('google')} 
                className="flex items-center justify-center gap-2 py-3 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-2xl text-xs font-semibold active:scale-95 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Google
              </button>
              <button 
                onClick={() => handleOAuth('microsoft')} 
                className="flex items-center justify-center gap-2 py-3 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-2xl text-xs font-semibold active:scale-95 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M0 0h11v11H0z"/>
                  <path fill="#81bc06" d="M12 0h11v11H12z"/>
                  <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                  <path fill="#ffba08" d="M12 12h11v11H12z"/>
                </svg>
                Microsoft
              </button>
            </div>
          </>
        )}

        <div className="mt-6 text-center border-t border-stone-100 pt-4">
          <button 
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setSuccess('');
            }}
            className="text-xs text-stone-500 hover:text-stone-950 font-semibold transition hover:underline"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ HOME / CHECK-IN ============
function HomePage({ user, data, update, onOpenNotifs }) {
  const [geo, setGeo] = useState(null);
  const [checking, setChecking] = useState(false);
  const [simulated, setSimulated] = useState(true);
  const [now, setNow] = useState(new Date());

  // Admin Calendar dashboard specific state (hooks must be called unconditionally)
  const [adminDate, setAdminDate] = useState(new Date());
  const [adminSelectedDay, setAdminSelectedDay] = useState(todayKey());
  const [newHoliName, setNewHoliName] = useState('');
  const [adminHolidayMap, setAdminHolidayMap] = useState({
    [`${new Date().getFullYear()}-05-26`]: 'Memorial Day Holiday',
    [`${new Date().getFullYear()}-06-19`]: 'Juneteenth National Holiday',
    [`${new Date().getFullYear()}-07-04`]: 'Independence Day Holiday',
    [`${new Date().getFullYear()}-12-25`]: 'Christmas Day Holiday',
    [`${new Date().getFullYear()}-01-01`]: 'New Years Day Holiday',
  });

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const todays = data.attendance.filter((a) => a.userId === user.id && a.date === todayKey());
  const openSession = todays.find((a) => !a.checkOut);

  const fetchLoc = () => {
    setChecking(true);
    setTimeout(() => {
      const base = data.locations[0];
      if (!base) { setChecking(false); return; }
      const jitter = simulated ? 0.0003 : 0.05;
      setGeo({
        lat: base.lat + (Math.random() - 0.5) * jitter,
        lng: base.lng + (Math.random() - 0.5) * jitter,
      });
      setChecking(false);
    }, 700);
  };

  useEffect(() => { fetchLoc(); }, [simulated]);

  const matched = useMemo(() => {
    if (!geo) return null;
    for (const loc of data.locations) {
      const d = distanceMeters(geo.lat, geo.lng, loc.lat, loc.lng);
      if (d <= loc.radius) return { ...loc, distance: d };
    }
    return null;
  }, [geo, data.locations]);

  const doToggle = () => {
    if (!matched) return;
    if (!openSession) {
      update((d) => {
        d.attendance = [...d.attendance, {
          id: `att_${Date.now()}`,
          userId: user.id,
          date: todayKey(),
          checkIn: new Date().toISOString(),
          checkOut: null,
          locationId: matched.id,
          locationName: matched.name,
        }];
        return d;
      });
    } else {
      update((d) => {
        d.attendance = d.attendance.map((a) => a.id === openSession.id ? { ...a, checkOut: new Date().toISOString() } : a);
        return d;
      });
    }
  };

  const isCheckedIn = !!openSession;

  if (user.role === 'Admin') {
    const adminYear = adminDate.getFullYear();
    const adminMonth = adminDate.getMonth();
    const adminFirstDay = new Date(adminYear, adminMonth, 1).getDay();
    const adminDaysInMonth = new Date(adminYear, adminMonth + 1, 0).getDate();
    const adminMonthLabel = adminDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const adminPrevMonth = () => setAdminDate(new Date(adminYear, adminMonth - 1, 1));
    const adminNextMonth = () => setAdminDate(new Date(adminYear, adminMonth + 1, 1));

    const pendingCount = data.leaves.filter(l => l.status === 'pending').length;
    const todayStr = todayKey();
    const onLeaveToday = data.leaves.filter(l => l.status === 'approved' && todayStr >= l.from && todayStr <= l.to);
    
    const upcomingHolidays = data.holidays.filter(h => h >= todayStr).sort();
    const nextHolidayStr = upcomingHolidays[0];
    const nextHolidayLabel = nextHolidayStr ? (adminHolidayMap[nextHolidayStr] || 'Corporate Holiday') : 'None';

    const selectedDayLeaves = data.leaves.filter(l => l.status === 'approved' && adminSelectedDay >= l.from && adminSelectedDay <= l.to);
    const isSelectedDayHoliday = data.holidays.includes(adminSelectedDay);

    const userMap = Object.fromEntries(data.users.map((u) => [u.id, u]));

    const handleCreateHoliday = () => {
      if (!newHoliName.trim()) return;
      update((d) => {
        if (!d.holidays.includes(adminSelectedDay)) {
          d.holidays = [...d.holidays, adminSelectedDay];
        }
        return d;
      });
      setAdminHolidayMap(prev => ({ ...prev, [adminSelectedDay]: newHoliName.trim() }));
      setNewHoliName('');
    };

    const handleRemoveHoliday = () => {
      update((d) => {
        d.holidays = d.holidays.filter(h => h !== adminSelectedDay);
        return d;
      });
      setAdminHolidayMap(prev => {
        const next = { ...prev };
        delete next[adminSelectedDay];
        return next;
      });
    };

    return (
      <div className="px-1 md:px-5 pt-3 animate-fade-in max-w-7xl mx-auto">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl text-stone-900 font-extrabold tracking-tight font-corporate">Corporate Calendar & Leaves Hub</h1>
            <p className="text-xs text-stone-500 mt-0.5">Corporate events, governmental holidays, and employee leave schedules.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAdminDate(new Date())} className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-bold text-stone-700 active:scale-95 transition">
              Today
            </button>
            <button onClick={onOpenNotifs} className="relative w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center active:scale-95 transition">
              <Bell size={16} className="text-stone-600" />
              {data.notifications?.filter(n => !n.read && n.userId === user.id).length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Dashboard Executive KPI Widget Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-900 flex items-center justify-center flex-shrink-0">
              <Calendar size={22} className="text-amber-800" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold leading-none mb-1.5">Next Holiday</p>
              <p className="text-sm font-extrabold text-stone-900 leading-snug truncate">{nextHolidayLabel}</p>
              {nextHolidayStr && <p className="text-[10px] text-stone-450 font-semibold mt-1 font-mono">{new Date(nextHolidayStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</p>}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-950 flex items-center justify-center flex-shrink-0">
              <Users size={22} className="text-emerald-800" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold leading-none mb-1.5">On Leave Today</p>
              <p className="text-2xl font-black text-stone-950 leading-none">{onLeaveToday.length} Employees</p>
              <p className="text-[10px] text-stone-450 font-semibold mt-1.5 truncate max-w-[200px]">
                {onLeaveToday.length > 0 ? onLeaveToday.map(l => userMap[l.userId]?.name.split(' ')[0]).join(', ') : 'Everyone is at work!'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100/80 text-rose-950 flex items-center justify-center flex-shrink-0">
              <Clock size={22} className="text-rose-800" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold leading-none mb-1.5">Pending Approvals</p>
              <p className="text-2xl font-black text-rose-650 leading-none">{pendingCount} Requests</p>
              <p className="text-[10px] text-stone-450 font-semibold mt-1.5">Requires immediate executive action</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mb-10">
          {/* Left Column: Interactive Grid Calendar (2 Columns wide) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
              <h3 className="text-sm font-bold text-stone-900 font-corporate">Interactive Attendance Calendar</h3>
              <div className="flex items-center gap-2">
                <button onClick={adminPrevMonth} className="w-8 h-8 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition active:scale-90"><ChevronLeft size={14} /></button>
                <span className="text-xs font-bold text-stone-850 min-w-[100px] text-center">{adminMonthLabel}</span>
                <button onClick={adminNextMonth} className="w-8 h-8 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition active:scale-90"><ChevronRight size={14} /></button>
              </div>
            </div>

            {/* Calendar grid headers */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty offset days */}
              {Array(adminFirstDay).fill(null).map((_, idx) => (
                <div key={`empty-${idx}`} className="aspect-square rounded-2xl bg-stone-50/50 border border-transparent" />
              ))}

              {/* Day cells */}
              {Array(adminDaysInMonth).fill(null).map((_, idx) => {
                const dayNum = idx + 1;
                const dStr = `${adminYear}-${String(adminMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                
                const hasHoliday = data.holidays.includes(dStr);
                const dayLeaves = data.leaves.filter(l => l.status === 'approved' && dStr >= l.from && dStr <= l.to);
                
                const dObj = new Date(adminYear, adminMonth, dayNum);
                const isWknd = dObj.getDay() === 0 || dObj.getDay() === 6;
                const isSelected = adminSelectedDay === dStr;
                const isCurrentToday = todayStr === dStr;

                return (
                  <button
                    key={`day-${dayNum}`}
                    onClick={() => setAdminSelectedDay(dStr)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-between p-2 border transition relative group active:scale-95 ${
                      isSelected ? 'bg-stone-900 border-stone-900 text-white shadow-md' :
                      isCurrentToday ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' :
                      hasHoliday ? 'bg-rose-50 border-rose-100 text-rose-800 font-semibold' :
                      dayLeaves.length > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-800 font-semibold' :
                      isWknd ? 'bg-stone-50 border-transparent text-stone-400' :
                      'bg-white border-stone-100 text-stone-800 hover:border-stone-300'
                    }`}
                  >
                    <span className="text-xs font-bold font-mono">{dayNum}</span>
                    
                    {/* Event indicators */}
                    <div className="flex gap-1 items-center justify-center mt-1">
                      {hasHoliday && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500'}`} title="Holiday" />
                      )}
                      {dayLeaves.length > 0 && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} title="Leaves" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend guide */}
            <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-center flex-wrap gap-4 text-[10px] font-semibold text-stone-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xl bg-rose-50 border border-rose-100 block flex-shrink-0" />
                <span>Holiday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xl bg-emerald-50 border border-emerald-100 block flex-shrink-0" />
                <span>Employee On Leave</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xl bg-amber-50 border border-amber-300 block flex-shrink-0" />
                <span>Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xl bg-stone-50 block flex-shrink-0" />
                <span>Weekend</span>
              </div>
            </div>
          </div>

          {/* Right Column: Selected Day Dashboard Details (1 Column wide) */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1.5">Selected Day Details</p>
              <h4 className="text-sm font-bold text-stone-900 font-corporate">{fmtDate(adminSelectedDay)}</h4>
            </div>

            {/* Holiday Status Section */}
            {isSelectedDayHoliday ? (
              <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase tracking-wider text-rose-700 font-bold">Government/Corporate Holiday</p>
                  <p className="text-xs font-bold text-rose-900 mt-0.5">{adminHolidayMap[adminSelectedDay] || 'Public Holiday'}</p>
                  <button
                    onClick={handleRemoveHoliday}
                    className="mt-2 text-[10px] text-rose-600 hover:text-rose-800 font-bold underline flex items-center gap-1 active:scale-95 transition"
                  >
                    Remove Holiday
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">Configure Company Holiday</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Holiday Name (e.g. Christmas)"
                    value={newHoliName}
                    onChange={(e) => setNewHoliName(e.target.value)}
                    className="flex-1 text-xs border border-stone-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-stone-400 font-medium"
                  />
                  <button
                    onClick={handleCreateHoliday}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-bold active:scale-95 transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Employees On Leave List */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-stone-550 font-bold">Leave Schedule ({selectedDayLeaves.length})</p>
              
              {selectedDayLeaves.length === 0 ? (
                <p className="text-xs text-stone-400 py-3 text-center bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">No leaves scheduled on this date.</p>
              ) : (
                <div className="space-y-2.5">
                  {selectedDayLeaves.map(lv => {
                    const emp = userMap[lv.userId];
                    return (
                      <div key={lv.id} className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/60 flex items-start gap-3">
                        <Avatar name={emp?.name || 'Staff'} size="sm" src={emp?.logo} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-stone-900">{emp?.name}</p>
                          <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">{lv.type} Leave · Approved</p>
                          {lv.reason && <p className="text-[10px] text-stone-500 mt-1 italic leading-relaxed">"{lv.reason}"</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-1 md:px-5 pt-3">
      {/* Mobile Top Header (hidden on widescreen desktop) */}
      <div className="flex items-center justify-between mb-6 lg:hidden">
        <div>
          <p className="text-stone-500 text-sm font-medium">Hey {user.name.split(' ')[0]} 👋</p>
          <p className="text-xs text-stone-400 mt-0.5">{fmtDate(now.toISOString())}</p>
        </div>
      </div>

      {/* Dual Column Widescreen Desktop Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: General Clock Info & Primary Attendance Triggers (2 Columns wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Time / Date card */}
          <div className="relative rounded-3xl p-6 overflow-hidden shadow-sm" style={{
            background: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #44403c 100%)',
          }}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/10 rounded-full -translate-y-20 translate-x-20 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-400/10 rounded-full translate-y-16 -translate-x-16 blur-2xl" />
            <div className="relative">
              <div className="flex items-baseline gap-2 text-stone-50">
                <span className="text-5xl font-semibold tracking-tight font-mono tabular-nums">
                  {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}
                </span>
                <span className="text-amber-300 text-sm font-medium">{now.getHours() >= 12 ? 'PM' : 'AM'}</span>
              </div>
              <p className="text-stone-400 text-xs mt-1">{now.toLocaleDateString('en-US', { weekday: 'long' })}, {now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>

              {isCheckedIn && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-200 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Clocked-in since {fmtTime(openSession.checkIn)}
                </div>
              )}
            </div>
          </div>

          {/* Attendance System Dashboard Card */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <p className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">Attendance System</p>
              {isCheckedIn && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Active Session
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Check-in Toggle Button Column */}
              <div className="flex flex-col items-center justify-center py-2 border-b md:border-b-0 md:border-r border-stone-100 pb-6 md:pb-0 md:pr-6">
                <button
                  onClick={doToggle}
                  disabled={!matched}
                  className="relative group disabled:cursor-not-allowed active:scale-95 transition-transform duration-100"
                >
                  {/* Outer rings */}
                  <div className={`absolute inset-0 rounded-full ${matched ? 'animate-ping' : ''}`} style={{
                    background: isCheckedIn ? 'radial-gradient(circle, rgba(244,63,94,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)',
                  }} />
                  <div className="absolute -inset-4 rounded-full border-2 border-dashed opacity-20 animate-[spin_30s_linear_infinite]" style={{
                    borderColor: isCheckedIn ? '#f43f5e' : '#fbbf24',
                  }} />
                  <div className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center shadow-xl transition-all ${
                    !matched ? 'bg-stone-300 shadow-stone-300/30' :
                    isCheckedIn ? 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-500/40 hover:brightness-105' :
                    'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-400/40 hover:brightness-105'
                  }`}>
                    <div className="absolute inset-2 rounded-full border-2 border-white/20" />
                    {isCheckedIn ? (
                      <>
                        <LogOut size={32} className="text-white mb-1" strokeWidth={2.2} />
                        <span className="text-white font-bold text-sm tracking-wider">CHECK OUT</span>
                        <span className="text-white/80 text-[9px] mt-0.5 font-mono tabular-nums">{fmtTime(openSession.checkIn)}</span>
                      </>
                    ) : (
                      <>
                        <LogIn size={32} className="text-white mb-1" strokeWidth={2.2} />
                        <span className="text-white font-bold text-sm tracking-wider">CHECK IN</span>
                        <span className="text-white/80 text-[9px] mt-0.5">Tap to clock in</span>
                      </>
                    )}
                  </div>
                </button>

                {isCheckedIn && (
                  <p className="text-[10px] text-stone-500 mt-4 text-center font-medium">
                    Clocked-in since <span className="font-semibold text-stone-900">{fmtTime(openSession.checkIn)}</span>
                  </p>
                )}
              </div>

              {/* Geolocation & Coordinates Status Column */}
              <div className="space-y-4">
                {/* Geolocation status badge */}
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${matched ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${matched ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                      <MapPin size={16} className={matched ? 'text-emerald-700' : 'text-rose-700'} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Location Status</p>
                      <p className="text-xs font-bold text-stone-900 truncate">
                        {checking ? 'Locating…' : matched ? matched.name : 'Outside registered zone'}
                      </p>
                    </div>
                  </div>
                  <label className="flex-shrink-0 flex items-center gap-1.5 text-[10px] text-stone-600 cursor-pointer select-none font-bold bg-white border border-stone-200 px-2 py-1 rounded-lg hover:bg-stone-50 transition">
                    <input 
                      type="checkbox" 
                      checked={simulated} 
                      onChange={(e) => setSimulated(e.target.checked)} 
                      className="w-3.5 h-3.5 rounded border-stone-300 text-amber-500 focus:ring-amber-500 cursor-pointer" 
                    />
                    At site
                  </label>
                </div>

                {!matched && geo && (
                  <div className="bg-rose-50 rounded-xl p-3 border border-rose-100 flex items-start gap-2">
                    <AlertCircle size={14} className="text-rose-750 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-rose-750 font-medium leading-relaxed">
                      You are outside coordinates. Toggle <strong>"At site"</strong> to check-in/out.
                    </p>
                  </div>
                )}

                <div className="bg-stone-50 rounded-2xl p-4 text-stone-500 text-xs leading-relaxed space-y-2 border border-stone-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-stone-400 text-[11px]">Coordinates:</span>
                    <span className="font-mono text-stone-850 font-bold text-[11px] bg-white border border-stone-100 px-2 py-0.5 rounded">
                      {geo ? `${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}` : 'Detecting...'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-stone-400 text-[11px]">Office Site:</span>
                    <span className="text-stone-850 font-bold text-[11px] bg-white border border-stone-100 px-2 py-0.5 rounded">
                      {matched ? matched.name : data.locations[0]?.name || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline tracker (1 Column wide, stacks below on mobile) */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <p className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">Today's Timeline</p>
          </div>

          {todays.length === 0 ? (
            <p className="text-xs text-stone-400 py-8 text-center">No clock activities logged today.</p>
          ) : (
            <div className="space-y-4">
              {todays.map((a) => (
                <div key={a.id} className="flex items-start gap-3.5 py-1 border-b border-stone-50 last:border-0 pb-4 last:pb-0">
                  <div className="flex flex-col items-center mt-1.5 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                    <div className="w-px h-10 bg-stone-200 my-1" />
                    <div className={`w-2 h-2 rounded-full ${a.checkOut ? 'bg-rose-500 ring-4 ring-rose-50' : 'bg-stone-200 ring-4 ring-stone-50'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div>
                      <p className="text-xs font-bold text-stone-900">Checked in</p>
                      <p className="text-[10px] text-stone-400 mt-0.5 font-medium">{fmtTime(a.checkIn)} · {a.locationName}</p>
                    </div>
                    
                    <div className="mt-3">
                      {a.checkOut ? (
                        <>
                          <p className="text-xs font-bold text-stone-900">Checked out</p>
                          <p className="text-[10px] text-stone-400 mt-0.5 font-medium">
                            {fmtTime(a.checkOut)} · {Math.round((new Date(a.checkOut) - new Date(a.checkIn)) / 60000)}m active
                          </p>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-bold animate-pulse">
                          Session Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leave Approvals Panel — Admin / HR Only */}
      {(user.role === 'Admin' || user.role === 'HR') && (() => {
        const pendingLeaves = data.leaves.filter((l) => l.status === 'pending');
        const userMap = Object.fromEntries(data.users.map((u) => [u.id, u]));
        const approve = (id) => update((d) => {
          d.leaves = d.leaves.map((l) => l.id === id ? { ...l, status: 'approved' } : l);
          return d;
        });
        const reject = (id) => update((d) => {
          d.leaves = d.leaves.map((l) => l.id === id ? { ...l, status: 'rejected' } : l);
          return d;
        });

        return (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <CheckCircle2 size={16} className="text-amber-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900 font-corporate">Leave Approvals</p>
                  <p className="text-[10px] text-stone-400">Pending requests requiring your action</p>
                </div>
              </div>
              {pendingLeaves.length > 0 && (
                <span className="px-2.5 py-1 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                  {pendingLeaves.length} pending
                </span>
              )}
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center shadow-sm">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Check size={22} className="text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-stone-700">All caught up!</p>
                <p className="text-xs text-stone-400 mt-1">No pending leave requests</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingLeaves.map((l) => {
                  const u = userMap[l.userId];
                  return (
                    <div key={l.id} className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition">
                      <div className="flex items-start gap-3 mb-4">
                        <Avatar name={u?.name || '?'} src={u?.logo} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-stone-900 truncate">{u?.name || 'Unknown'}</p>
                            <Pill role={u?.role} />
                          </div>
                          <p className="text-[10px] text-stone-400 mt-0.5 truncate">{u?.email}</p>
                        </div>
                        <span className="flex-shrink-0 px-2 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 rounded-full uppercase tracking-wider">
                          Pending
                        </span>
                      </div>

                      <div className="bg-stone-50 rounded-2xl p-3.5 mb-4 space-y-2 border border-stone-100">
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-500">Type</span>
                          <span className="font-semibold text-stone-900">{l.type}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-500">Period</span>
                          <span className="font-semibold text-stone-900">
                            {new Date(l.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(l.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        {l.reason && (
                          <div className="flex justify-between text-xs border-t border-stone-100 pt-2">
                            <span className="text-stone-500">Reason</span>
                            <span className="font-medium text-stone-900 ml-2 text-right max-w-[140px] truncate">{l.reason}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => reject(l.id)}
                          className="flex-1 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-rose-100 active:scale-95 transition"
                        >
                          <X size={13} /> Reject
                        </button>
                        <button
                          onClick={() => approve(l.id)}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition"
                        >
                          <Check size={13} /> Approve
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ============ PROFILE ============
function ProfilePage({ user, data, onBack }) {
  const userAttendance = data.attendance.filter((a) => a.userId === user.id);
  const totalHours = userAttendance.reduce((sum, a) => {
    if (!a.checkOut) return sum;
    return sum + (new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 3600000;
  }, 0);

  return (
    <div className="px-1 md:px-5 pt-3 animate-fade-in flex flex-col items-center">
      <div className="w-full max-w-md">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 mb-4 transition font-semibold select-none">
            <ChevronLeft size={14} /> Back to Dashboard
          </button>
        )}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl text-stone-900 font-extrabold tracking-tight">My Profile</h1>
          <button className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center active:scale-95 transition shadow-sm"><Edit3 size={14} className="text-stone-600" /></button>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-200 text-center shadow-sm">
          <div className="relative inline-block mb-3">
            <Avatar name={user.name} size="xl" src={user.logo} />
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-md active:scale-95 transition"><Camera size={12} /></button>
          </div>
          <h2 className="text-xl font-semibold text-stone-900">{user.name}</h2>
          <p className="text-sm text-stone-500 mb-2">{user.email}</p>
          <Pill role={user.role} />

          <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-stone-100">
            <div>
              <p className="text-lg font-semibold text-stone-900 tabular-nums">{userAttendance.length}</p>
              <p className="text-[9px] uppercase tracking-wider text-stone-500">Sessions</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-stone-900 tabular-nums">{totalHours.toFixed(1)}h</p>
              <p className="text-[9px] uppercase tracking-wider text-stone-500">Total Hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ CALENDAR PAGE ============
function CalendarPage({ user, data, update, onBack }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const userAtt = data.attendance.filter((a) => a.userId === user.id);
  const userLeaves = data.leaves.filter((l) => l.userId === user.id);

  const [selectedDayStr, setSelectedDayStr] = useState(todayKey());
  const [customEventText, setCustomEventText] = useState('');
  const [showDayModal, setShowDayModal] = useState(false);

  const [showLeave, setShowLeave] = useState(false);
  const [leaveType, setLeaveType] = useState('Annual');
  const [leaveForm, setLeaveForm] = useState({ from: '', to: '', reason: '' });

  const submitLeave = () => {
    if (!leaveForm.from || !leaveForm.to) return;
    update((d) => {
      d.leaves = [...d.leaves, {
        id: `lv_${Date.now()}`,
        userId: user.id,
        type: leaveType,
        from: leaveForm.from,
        to: leaveForm.to,
        reason: leaveForm.reason,
        status: 'pending',
      }];
      return d;
    });
    setShowLeave(false);
    setLeaveForm({ from: '', to: '', reason: '' });
  };

  const addCustomEvent = () => {
    if (!customEventText.trim()) return;
    update((d) => {
      d.customEvents = d.customEvents || [];
      d.customEvents = [...d.customEvents, {
        id: `ev_${Date.now()}`,
        userId: user.id,
        date: selectedDayStr,
        text: customEventText.trim(),
        createdAt: new Date().toISOString()
      }];
      return d;
    });
    setCustomEventText('');
  };

  const removeCustomEvent = (evId) => {
    update((d) => {
      d.customEvents = (d.customEvents || []).filter((e) => e.id !== evId);
      return d;
    });
  };

  const removeLeaveRequest = (leaveId) => {
    update((d) => {
      d.leaves = (d.leaves || []).filter((l) => l.id !== leaveId);
      return d;
    });
  };

  const dayStatus = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (data.holidays.includes(dateStr)) return 'holiday';
    if (userAtt.some((a) => a.date === dateStr)) return 'present';
    const onLeave = userLeaves.some((l) => l.status === 'approved' && dateStr >= l.from && dateStr <= l.to);
    if (onLeave) return 'leave';
    const d = new Date(dateStr);
    if (d.getDay() === 0 || d.getDay() === 6) return 'weekend';
    if (d < new Date(todayKey())) return 'absent';
    return 'future';
  };

  // Find all events for the selected day
  const dayAtts = data.attendance.filter((a) => a.userId === user.id && a.date === selectedDayStr);
  const dayLeaves = data.leaves.filter((l) => l.userId === user.id && selectedDayStr >= l.from && selectedDayStr <= l.to);
  const isHoliday = data.holidays.includes(selectedDayStr);
  const customEvs = (data.customEvents || []).filter((e) => e.userId === user.id && e.date === selectedDayStr);

  return (
    <div className="px-1 md:px-5 pt-3 animate-fade-in max-w-5xl mx-auto">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 mb-4 transition font-semibold select-none">
          <ChevronLeft size={14} /> Back to Dashboard
        </button>
      )}
      {/* Header Banner */}
      <div className="mb-6 border-b border-stone-150 pb-4">
        <h1 className="text-2xl text-stone-900 font-extrabold tracking-tight">Interactive Calendar & Leaves</h1>
        <p className="text-xs text-stone-500 mt-0.5">Track attendance, manage custom daily events, and log requests.</p>
      </div>

      {/* Separate Request Leave Box at the top */}
      {user.role !== 'Admin' && (
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm mb-6">
          <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-3 font-semibold">Quick Leave & WFH Panel</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button 
              onClick={() => { setLeaveType('Annual'); setShowLeave(true); }} 
              className="flex items-center justify-between p-4 bg-gradient-to-br from-amber-50 to-amber-100/60 hover:from-amber-100 hover:to-amber-150 rounded-2xl border border-amber-200 active:scale-95 transition text-left group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <Briefcase size={16} className="text-amber-800" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900">Annual Leave</p>
                  <p className="text-[10px] text-amber-700/80 mt-0.5">Submit multi-day annual leaves</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-amber-600 pl-1" />
            </button>

            <button 
              onClick={() => { setLeaveType('Normal'); setShowLeave(true); }} 
              className="flex items-center justify-between p-4 bg-gradient-to-br from-rose-50 to-rose-100/60 hover:from-rose-100 hover:to-rose-150 rounded-2xl border border-rose-200 active:scale-95 transition text-left group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <Calendar size={16} className="text-rose-800" />
                </div>
                <div>
                  <p className="text-sm font-bold text-rose-950">Normal Leave</p>
                  <p className="text-[10px] text-rose-700/80 mt-0.5">Request general day-off or sick leave</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-rose-600 pl-1" />
            </button>

            <button 
              onClick={() => { setLeaveType('WFH'); setShowLeave(true); }} 
              className="flex items-center justify-between p-4 bg-gradient-to-br from-sky-50 to-sky-100/60 hover:from-sky-100 hover:to-sky-150 rounded-2xl border border-sky-200 active:scale-95 transition text-left group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <Home size={16} className="text-sky-850" />
                </div>
                <div>
                  <p className="text-sm font-bold text-sky-905">WFH Request</p>
                  <p className="text-[10px] text-sky-750/80 mt-0.5">Log work-from-home sessions</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-sky-600 pl-1" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          {/* Month Calendar Grid */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition"><ChevronLeft size={16} /></button>
              <span className="font-semibold text-stone-900">{monthLabel}</span>
              <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition"><ChevronRight size={16} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-semibold text-stone-400 uppercase tracking-wider py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const st = dayStatus(day);
                
                const colors = {
                  present: 'bg-emerald-500 text-white hover:brightness-105',
                  leave: 'bg-amber-200 text-amber-900 hover:brightness-95',
                  absent: 'bg-rose-100 text-rose-700 hover:bg-rose-150',
                  weekend: 'bg-stone-100 text-stone-450 hover:bg-stone-150',
                  holiday: 'bg-violet-200 text-violet-900 hover:brightness-95',
                  future: 'text-stone-500 hover:bg-stone-100',
                };
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                const isSelected = dateStr === selectedDayStr;

                // Quick indicator checks
                const hasHoliday = data.holidays.includes(dateStr);
                const hasAttendance = data.attendance.some((a) => a.userId === user.id && a.date === dateStr);
                const hasLeave = data.leaves.some((l) => l.userId === user.id && dateStr >= l.from && dateStr <= l.to);
                const hasCustomEvents = (data.customEvents || []).some((e) => e.userId === user.id && e.date === dateStr);

                return (
                  <button 
                    key={day}
                    onClick={() => {
                      setSelectedDayStr(dateStr);
                      setShowDayModal(true);
                    }}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-semibold relative transition-all duration-200 pb-2 ${colors[st]} ${
                      isSelected ? 'ring-2 ring-stone-900 ring-offset-2 scale-[1.08] z-10 shadow-md shadow-stone-900/10' : ''
                    } ${isToday && !isSelected ? 'border border-stone-850' : ''}`}
                  >
                    <span className={isSelected ? 'font-bold' : ''}>{day}</span>
                    
                    {/* Small visual dot indicators beneath the day number */}
                    <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                      {hasHoliday && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-violet-500'}`} />}
                      {hasAttendance && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />}
                      {hasLeave && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-500'}`} />}
                      {hasCustomEvents && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-sky-500'}`} />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-stone-100">
              {[
                { label: 'Present', c: 'bg-emerald-500' },
                { label: 'Leave', c: 'bg-amber-250' },
                { label: 'Holiday', c: 'bg-violet-300' },
                { label: 'Absent', c: 'bg-rose-200' },
                { label: 'Agenda Note', c: 'bg-sky-400' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5 text-[10px] text-stone-600 font-medium">
                  <div className={`w-2 h-2 rounded-full ${l.c}`} />{l.label}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-4 font-semibold">Government Holidays</p>
            <div className="space-y-3">
              {data.holidays.map((h) => (
                <div key={h} className="flex items-center justify-between py-1 border-b border-stone-50 last:border-0 pb-2 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <Calendar size={13} className="text-violet-750" />
                    </div>
                    <p className="text-sm text-stone-850 font-medium">{new Date(h).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Public Holiday</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">



          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-4 font-semibold">My Requests History</p>
            {userLeaves.length === 0 ? (
              <p className="text-sm text-stone-400 py-6 text-center">No leave requests logged yet.</p>
            ) : (
              <div className="space-y-3">
                {userLeaves.map((l) => (
                  <div key={l.id} className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-100 group">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{l.type}</p>
                      <p className="text-[10px] text-stone-500 mt-0.5">{new Date(l.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(l.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      {l.reason && (
                        <p className="text-[9px] text-stone-400 italic mt-0.5 font-medium">"{l.reason}"</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        l.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        l.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-250' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>{l.status}</span>
                      
                      <button
                        onClick={() => removeLeaveRequest(l.id)}
                        className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-stone-150 transition active:scale-90"
                        title="Cancel or delete request"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showLeave && (
        <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4" onClick={() => setShowLeave(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-stone-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold tracking-tight text-lg text-stone-950">{leaveType} Request</h3>
              <button onClick={() => setShowLeave(false)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">Start Date</span>
                  <input type="date" value={leaveForm.from} onChange={(e) => setLeaveForm({ ...leaveForm, from: e.target.value })} className="w-full mt-1.5 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 transition" />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">End Date</span>
                  <input type="date" value={leaveForm.to} onChange={(e) => setLeaveForm({ ...leaveForm, to: e.target.value })} className="w-full mt-1.5 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 transition" />
                </label>
              </div>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">Reason</span>
                <textarea value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} rows="3" className="w-full mt-1.5 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 transition" placeholder="Detail..." />
              </label>
              <button onClick={submitLeave} className="w-full py-3 bg-stone-900 hover:bg-stone-880 text-white rounded-2xl text-sm font-semibold active:scale-[0.98] transition shadow-lg">Submit Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Day Details & Events Popup Modal */}
      {showDayModal && (
        <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDayModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-stone-200 animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-extrabold tracking-tight text-lg text-stone-950 mt-0.5">
                  {new Date(selectedDayStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
              </div>
              <button onClick={() => setShowDayModal(false)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition border border-stone-150 shadow-sm"><X size={16} /></button>
            </div>

            {/* List of events on this day */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 mb-4">
              {/* Public Holiday */}
              {isHoliday && (
                <div className="p-3.5 bg-violet-50 rounded-2xl border border-violet-100 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-violet-150 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Sparkles size={12} className="text-violet-750" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-violet-950">Public Holiday 🎉</p>
                    <p className="text-[9px] text-violet-700/80 mt-0.5">Corporate / Government Day Off</p>
                  </div>
                </div>
              )}

              {/* Attendance logs */}
              {dayAtts.map((a) => (
                <div key={a.id} className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col gap-1.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-emerald-150 flex items-center justify-center flex-shrink-0">
                      <Clock size={10} className="text-emerald-700" />
                    </div>
                    <p className="text-xs font-bold text-emerald-950">Clocked Session</p>
                  </div>
                  <div className="text-[10px] text-stone-600 pl-7 space-y-1">
                    <p className="font-medium">Check-In: <span className="text-stone-900 font-bold">{fmtTime(a.checkIn)}</span> @ {a.locationName}</p>
                    {a.checkOut ? (
                      <p className="font-medium">Check-Out: <span className="text-stone-900 font-bold">{fmtTime(a.checkOut)}</span></p>
                    ) : (
                      <span className="inline-block text-[8px] uppercase tracking-wider font-extrabold text-emerald-800 bg-emerald-150 px-1.5 py-0.5 rounded">Active now</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Leave records */}
              {dayLeaves.map((l) => (
                <div key={l.id} className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col gap-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-amber-150 flex items-center justify-center flex-shrink-0">
                        <Briefcase size={10} className="text-amber-800" />
                      </div>
                      <p className="text-xs font-bold text-amber-950">{l.type} Request</p>
                    </div>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      l.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-150' :
                      l.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-150' : 'bg-amber-100/60 text-amber-805 border border-amber-200'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                  {l.reason && (
                    <p className="text-[10px] text-stone-550 pl-7 italic leading-relaxed">
                      Reason: "{l.reason}"
                    </p>
                  )}
                </div>
              ))}

              {/* Custom Events / Notes */}
              {customEvs.map((e) => (
                <div key={e.id} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 group shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <FileText size={11} className="text-sky-700" />
                    </div>
                    <p className="text-xs font-semibold text-stone-850 truncate leading-relaxed">{e.text}</p>
                  </div>
                  <button 
                    onClick={() => removeCustomEvent(e.id)}
                    className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition flex-shrink-0 shadow-sm border border-transparent hover:border-stone-150 active:scale-90"
                    title="Delete event"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}

              {/* Empty State */}
              {!isHoliday && dayAtts.length === 0 && dayLeaves.length === 0 && customEvs.length === 0 && (
                <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <HelpCircle className="mx-auto text-stone-300 mb-1.5 animate-pulse" size={20} />
                  <p className="text-xs text-stone-400 font-semibold">No scheduled events or work notes.</p>
                </div>
              )}
            </div>

            {/* Event Addition Form */}
            <div className="pt-4 border-t border-stone-100">
              <p className="text-[9px] uppercase tracking-wider text-stone-400 font-bold mb-2">Create Custom Event / Task</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customEventText}
                  onChange={(e) => setCustomEventText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCustomEvent(); }}
                  placeholder="Type event note..."
                  className="flex-1 px-3 py-2.5 bg-stone-50 border border-stone-250 rounded-xl text-xs focus:outline-none focus:border-stone-900 transition"
                />
                <button
                  onClick={addCustomEvent}
                  className="px-3.5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-semibold active:scale-95 transition flex items-center gap-1 shadow-md shadow-stone-900/10"
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>

            {/* Done Button */}
            <div className="mt-4 pt-3 border-t border-stone-100">
              <button 
                onClick={() => setShowDayModal(false)}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-850 rounded-xl text-xs font-bold transition active:scale-[0.98] border border-stone-250"
              >
                Close Planner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// ============ REPORT PAGE (with HR leave approval) ============
function ReportPage({ user, data, update }) {
  const [tab, setTab] = useState(user.role === 'Admin' ? 'staff_reports' : 'report');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [biTab, setBiTab] = useState('summary');
  const [biRefreshing, setBiRefreshing] = useState(false);
  const [biLastUpdated, setBiLastUpdated] = useState('Just now');
  
  const pastMonths = useMemo(() => {
    const list = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      list.push(d.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
    }
    return list;
  }, []);
  const [selectedMonth, setSelectedMonth] = useState(pastMonths[0]);
  const [exportModal, setExportModal] = useState(null);

  const isAdmin = user.role === 'Admin';
  const isHR = user.role === 'HR' || isAdmin;

  const userMap = useMemo(() => Object.fromEntries(data.users.map((u) => [u.id, u])), [data.users]);
  const normalizedAttendance = useMemo(() => normalizeAttendanceRecords(data.attendance), [data.attendance]);
  const myAtt = normalizedAttendance.filter((a) => a.userId === user.id).sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
  
  const myMonthlyAtt = useMemo(() => {
    const { monthKey } = monthLabelToRange(selectedMonth);
    return myAtt.filter(a => {
      return a.date?.slice(0, 7) === monthKey;
    });
  }, [myAtt, selectedMonth]);

  const monthlyStats = useMemo(() => {
    const totalDays = myMonthlyAtt.length;
    let totalMs = 0;
    myMonthlyAtt.forEach(a => {
      if (a.checkOut) {
        totalMs += (new Date(a.checkOut) - new Date(a.checkIn));
      }
    });
    const totalHours = totalMs / 3600000;
    const avgHours = totalDays > 0 ? (totalHours / totalDays) : 0;
    return {
      days: totalDays,
      hours: totalHours.toFixed(1),
      avg: avgHours.toFixed(1)
    };
  }, [myMonthlyAtt]);

  const pendingLeaves = data.leaves.filter((l) => l.status === 'pending');

  const allAtts = useMemo(() => {
    return [...normalizedAttendance]
      .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
      .map((a) => {
        const u = userMap[a.userId];
        return { ...a, user: u };
      })
      .filter((item) => {
        if (!item.user) return false;
        
        // Exclude Admin from list of employee attendance reports unless desired
        if (item.user.role === 'Admin') return false;

        const matchesSearch = item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              item.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (item.user.corporateId || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = deptFilter === 'All' || item.user.role === deptFilter;
        return matchesSearch && matchesDept;
      });
  }, [normalizedAttendance, userMap, searchQuery, deptFilter]);

  const triggerMyAttendanceExport = () => {
    setExportModal({
      title: `My Attendance Log (${selectedMonth})`,
      onExport: (format) => {
        const headers = ['#', 'Date', 'Check In', 'Check Out', 'Duration', 'Location'];
        const rows = myMonthlyAtt.map((a, i) => {
          const duration = a.checkOut ? Math.round((new Date(a.checkOut) - new Date(a.checkIn)) / 60000) : null;
          const durationStr = duration !== null ? `${Math.floor(duration / 60)}h ${duration % 60}m` : 'Active';
          return [
            String(i + 1),
            new Date(a.checkIn).toLocaleDateString(),
            fmtTime(a.checkIn),
            a.checkOut ? fmtTime(a.checkOut) : 'Active',
            durationStr,
            a.locationName || 'Remote'
          ];
        });

        if (format === 'csv') {
          downloadCSV(`my_attendance_${selectedMonth.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
        } else {
          printPDF(`My Attendance Log (${selectedMonth})`, headers, rows);
        }
      }
    });
  };

  const triggerEveryoneExport = () => {
    setExportModal({
      title: "Everyone's Attendance Reports",
      onExport: (format) => {
        const headers = ['Employee Name', 'Email', 'Corporate ID', 'Department', 'Date', 'Check In', 'Check Out', 'Duration', 'Zone'];
        const rows = allAtts.map(a => {
          const duration = a.checkOut ? Math.round((new Date(a.checkOut) - new Date(a.checkIn)) / 60000) : null;
          const durationStr = duration !== null ? `${Math.floor(duration / 60)}h ${duration % 60}m` : 'Active';
          return [
            a.user?.name || '',
            a.user?.email || '',
            a.user?.corporateId || '',
            DEPT_LABEL[a.user?.role] || a.user?.role || '',
            new Date(a.checkIn).toLocaleDateString(),
            fmtTime(a.checkIn),
            a.checkOut ? fmtTime(a.checkOut) : 'Active',
            durationStr,
            a.locationName || 'Remote'
          ];
        });

        if (format === 'csv') {
          downloadCSV(`everyone_attendance_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
        } else {
          printPDF("Everyone's Attendance Reports", headers, rows);
        }
      }
    });
  };

  const triggerActivityExport = () => {
    setExportModal({
      title: "Live Activity Feed Log",
      onExport: (format) => {
        const headers = ['Employee Name', 'Role', 'Date', 'Check In', 'Check Out', 'Duration', 'Location'];
        const rows = [...normalizedAttendance]
          .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
          .map(a => {
            const u = userMap[a.userId];
            if (!u || u.role === 'Admin') return null;
            const duration = a.checkOut ? Math.round((new Date(a.checkOut) - new Date(a.checkIn)) / 60000) : null;
            const durationStr = duration !== null ? `${Math.floor(duration / 60)}h ${duration % 60}m` : 'Active';
            return [
              u.name,
              u.role,
              new Date(a.checkIn).toLocaleDateString(),
              fmtTime(a.checkIn),
              a.checkOut ? fmtTime(a.checkOut) : 'Active',
              durationStr,
              a.locationName || 'Remote'
            ];
          })
          .filter(Boolean);

        if (format === 'csv') {
          downloadCSV(`activity_feed_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
        } else {
          printPDF("Live Activity Feed Log", headers, rows);
        }
      }
    });
  };

  const approve = (id) => update((d) => {
    const lv = d.leaves.find((l) => l.id === id);
    d.leaves = d.leaves.map((l) => l.id === id ? { ...l, status: 'approved' } : l);
    if (lv) {
      d.notifications = [...d.notifications, {
        id: `n_${Date.now()}`,
        userId: lv.userId,
        type: 'leave_approved',
        title: 'Leave approved ✅',
        message: `Your ${lv.type} leave (${new Date(lv.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(lv.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}) has been approved.`,
        createdAt: new Date().toISOString(),
        read: false,
      }];
    }
    return d;
  });
  
  const reject = (id) => update((d) => {
    const lv = d.leaves.find((l) => l.id === id);
    d.leaves = d.leaves.map((l) => l.id === id ? { ...l, status: 'rejected' } : l);
    if (lv) {
      d.notifications = [...d.notifications, {
        id: `n_${Date.now()}`,
        userId: lv.userId,
        type: 'leave_rejected',
        title: 'Leave request denied',
        message: `Your ${lv.type} leave (${new Date(lv.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(lv.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}) was not approved. Please reach out to HR for details.`,
        createdAt: new Date().toISOString(),
        read: false,
      }];
    }
    return d;
  });

  return (
    <div className="px-1 md:px-5 pt-3">
      <h1 className="text-2xl text-stone-900 mb-5 font-extrabold tracking-tight">Reports & Logs</h1>

      {/* Filter pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[!isAdmin && 'report', isHR && 'staff_reports', isHR && 'approvals', isAdmin && 'activity'].filter(Boolean).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 ${tab === t ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 border border-stone-200'}`}>
            {t === 'report' && 'My Attendance'}
            {t === 'staff_reports' && 'Everyone\'s Report'}
            {t === 'approvals' && 'Leave Approvals'}
            {t === 'activity' && 'Activity Log'}
            {t === 'approvals' && pendingLeaves.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[9px]">{pendingLeaves.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'report' && (
        <div className="space-y-4">
          {/* Monthly stats card container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center flex-shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <span className="text-[10px] font-medium text-stone-500 block leading-none">Days Active</span>
                <span className="text-sm font-extrabold text-stone-900 mt-1 block leading-none">{monthlyStats.days} Days</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center flex-shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <span className="text-[10px] font-medium text-stone-500 block leading-none">Total Hours</span>
                <span className="text-sm font-extrabold text-stone-900 mt-1 block leading-none">{monthlyStats.hours} hrs</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center flex-shrink-0">
                <Activity size={18} />
              </div>
              <div>
                <span className="text-[10px] font-medium text-stone-500 block leading-none">Daily Average</span>
                <span className="text-sm font-extrabold text-stone-900 mt-1 block leading-none">{monthlyStats.avg} hrs</span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-stone-900 font-corporate">Monthly Attendance Log</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-stone-400">Month:</span>
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)} 
                    className="text-xs font-bold text-stone-850 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-stone-400 cursor-pointer transition"
                  >
                    {pastMonths.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button 
                onClick={triggerMyAttendanceExport}
                className="text-[10px] text-stone-500 hover:text-stone-900 font-bold flex items-center gap-1 transition active:scale-95"
              >
                <Download size={11} /> EXPORT
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-stone-50">
                  <tr className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                    <th className="px-4 py-2.5 text-left w-12">#</th>
                    <th className="px-4 py-2.5 text-left">Check In</th>
                    <th className="px-4 py-2.5 text-left">Check Out</th>
                    <th className="px-4 py-2.5 text-left">Zone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {myMonthlyAtt.map((a, i) => (
                    <tr key={a.id} className="text-xs hover:bg-stone-50 transition">
                      <td className="px-4 py-3 text-stone-400 font-semibold">{i + 1}</td>
                      <td className="px-4 py-3 text-stone-850 tabular-nums">
                        <div className="font-semibold">{fmtTime(a.checkIn)}</div>
                        <div className="text-[10px] text-stone-500 mt-0.5">{new Date(a.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </td>
                      <td className="px-4 py-3 text-stone-850 tabular-nums">
                        {a.checkOut ? (
                          <>
                            <div className="font-semibold">{fmtTime(a.checkOut)}</div>
                            <div className="text-[10px] text-stone-500 font-medium mt-0.5">
                              {(() => {
                                const diff = Math.round((new Date(a.checkOut) - new Date(a.checkIn)) / 60000);
                                return `${Math.floor(diff / 60)}h ${diff % 60}m`;
                              })()}
                            </div>
                          </>
                        ) : (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Active Session
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-550 font-medium">
                        {a.locationName || 'Remote'}
                      </td>
                    </tr>
                  ))}
                  {myMonthlyAtt.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-12 text-center text-xs text-stone-400">
                        <Calendar size={24} className="text-stone-300 mx-auto mb-2" />
                        No records logged in {selectedMonth}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'staff_reports' && isHR && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-stone-900 font-corporate tracking-tight">Everyone's Attendance Reports</h3>
                <p className="text-xs text-stone-500 mt-0.5">View and filter company-wide attendance and working hours log</p>
              </div>
              <button 
                onClick={triggerEveryoneExport}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Download size={13} />
                Export
              </button>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-5">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search size={15} className="text-stone-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search name, email, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-850 focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder:text-stone-400 transition"
                />
              </div>

              <div>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-850 focus:outline-none focus:ring-1 focus:ring-stone-400 transition"
                >
                  <option value="All">All Departments</option>
                  <option value="HR">Human Resources</option>
                  <option value="Manager">Operations (Managers)</option>
                  <option value="TeamLead">Engineering Leads</option>
                  <option value="Employee">Engineering Staff</option>
                </select>
              </div>
              
              <div className="flex items-center justify-end text-[10px] text-stone-400 font-medium">
                Showing {allAtts.length} record{allAtts.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Reports Table */}
            <div className="overflow-x-auto -mx-5 sm:mx-0">
              <table className="w-full min-w-[700px]">
                <thead className="bg-stone-50 border-y border-stone-100">
                  <tr className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                    <th className="px-5 py-3 text-left w-64">Employee Details</th>
                    <th className="px-5 py-3 text-left w-44">Department</th>
                    <th className="px-5 py-3 text-left w-36">Check In</th>
                    <th className="px-5 py-3 text-left w-36">Check Out</th>
                    <th className="px-5 py-3 text-left w-32">Duration</th>
                    <th className="px-5 py-3 text-left w-32">Zone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {allAtts.map((a) => {
                    const duration = a.checkOut ? Math.round((new Date(a.checkOut) - new Date(a.checkIn)) / 60000) : null;
                    return (
                      <tr key={a.id} className="hover:bg-stone-50/50 transition">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={a.user?.name} size="sm" src={a.user?.logo} />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-stone-900 truncate">{a.user?.name}</p>
                              <p className="text-[10px] text-stone-500 truncate">{a.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider ${DEPT_PILL[a.user?.role] || 'bg-stone-100 text-stone-800'}`}>
                            {DEPT_LABEL[a.user?.role] || a.user?.role}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="p-1 rounded bg-emerald-50 text-emerald-600"><LogIn size={11} /></span>
                            <div>
                              <p className="text-xs font-semibold text-stone-850">{fmtTime(a.checkIn)}</p>
                              <p className="text-[9px] text-stone-400 mt-0.5">{new Date(a.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {a.checkOut ? (
                            <div className="flex items-center gap-1.5">
                              <span className="p-1 rounded bg-rose-50 text-rose-600"><LogOut size={11} /></span>
                              <div>
                                <p className="text-xs font-semibold text-stone-850">{fmtTime(a.checkOut)}</p>
                                <p className="text-[9px] text-stone-400 mt-0.5">{new Date(a.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-xs text-emerald-700 font-semibold">Active Session</span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {duration !== null ? (
                            <span className="text-xs font-semibold text-stone-850 tabular-nums">
                              {Math.floor(duration / 60)}h {duration % 60}m
                            </span>
                          ) : (
                            <span className="text-xs text-stone-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded text-stone-600 font-medium">
                            {a.locationName || 'Remote'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {allAtts.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center text-xs text-stone-400">
                        <Activity size={24} className="text-stone-300 mx-auto mb-2" />
                        No records match the active search filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'approvals' && isHR && (
        <div className="space-y-4">
          {pendingLeaves.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center shadow-sm">
              <Check size={32} className="text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-stone-600 font-semibold">All caught up!</p>
              <p className="text-xs text-stone-400">No pending leave requests</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingLeaves.map((l) => {
                const u = userMap[l.userId];
                return (
                  <div key={l.id} className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar name={u?.name || '?'} src={u?.logo} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-stone-900 truncate">{u?.name}</p>
                          <Pill role={u?.role} />
                        </div>
                        <p className="text-[10px] text-stone-400 mt-0.5 truncate">{u?.email}</p>
                      </div>
                    </div>
                    <div className="bg-stone-50 rounded-2xl p-4 mb-4 space-y-2 border border-stone-100">
                      <div className="flex justify-between text-xs">
                        <span className="text-stone-500">Type</span>
                        <span className="font-semibold text-stone-900">{l.type}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-stone-500">Period</span>
                        <span className="font-semibold text-stone-900">{new Date(l.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(l.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-stone-100 pt-2">
                        <span className="text-stone-500">Reason</span>
                        <span className="font-medium text-stone-900 ml-2 text-right">{l.reason || '—'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => reject(l.id)} className="flex-1 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-rose-100 transition"><X size={14} /> Reject</button>
                      <button onClick={() => approve(l.id)} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"><Check size={14} /> Approve</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'activity' && isAdmin && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold mb-4">Live Activity · Staff Overview</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-stone-50 rounded-xl">
                <p className="text-xl font-bold text-stone-900 tabular-nums">{data.users.filter((u) => u.role !== 'Admin').length}</p>
                <p className="text-[9px] uppercase tracking-wider text-stone-400 font-semibold mt-0.5">Staff Members</p>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-xl">
                <p className="text-xl font-bold text-emerald-700 tabular-nums">{new Set(normalizedAttendance.filter((a) => a.date === todayKey()).map((a) => a.userId)).size}</p>
                <p className="text-[9px] uppercase tracking-wider text-emerald-650 font-semibold mt-0.5">In Today</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-xl">
                <p className="text-xl font-bold text-amber-700 tabular-nums">{new Set(data.attendance.filter((a) => a.date === todayKey() && !a.checkOut).map((a) => a.userId)).size}</p>
                <p className="text-[9px] uppercase tracking-wider text-amber-650 font-semibold mt-0.5">Active Now</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-stone-905">Live Activity Feed · All Staff</p>
              <button onClick={triggerActivityExport} className="text-[10px] text-stone-500 hover:text-stone-900 font-bold flex items-center gap-1 transition"><Download size={11} /> EXPORT LOGS</button>
            </div>
            {normalizedAttendance.length === 0 ? (
              <div className="p-8 text-center">
                <Activity size={28} className="text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-400">No activity yet. Staff check-ins will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 max-h-[420px] overflow-y-auto">
                {[...normalizedAttendance].sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn)).map((a) => {
                  const u = userMap[a.userId];
                  if (!u || u.role === 'Admin') return null;
                  const duration = a.checkOut ? Math.round((new Date(a.checkOut) - new Date(a.checkIn)) / 60000) : null;
                  return (
                    <div key={a.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-stone-50 transition">
                      <Avatar name={u.name} size="sm" src={u.logo} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-stone-900 truncate">{u.name}</p>
                          <Pill role={u.role} />
                        </div>
                        <p className="text-[10px] text-stone-550 mt-0.5">{a.locationName} · {new Date(a.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] flex items-center gap-1 text-emerald-700 font-semibold"><LogIn size={10} /> {fmtTime(a.checkIn)}</span>
                          {a.checkOut ? (
                            <>
                              <span className="text-[10px] flex items-center gap-1 text-rose-700 font-semibold"><LogOut size={10} /> {fmtTime(a.checkOut)}</span>
                              <span className="text-[10px] text-stone-400 font-medium tabular-nums">· {Math.floor(duration / 60)}h {duration % 60}m</span>
                            </>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold mb-4">Leave Records History</p>
            <div className="space-y-3">
              {data.leaves.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-4">No staff leave records logged yet.</p>
              ) : data.leaves.map((l) => {
                const u = userMap[l.userId];
                return (
                  <div key={l.id} className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={u?.name || '?'} size="sm" src={u?.logo} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-stone-900 truncate">{u?.name} · {l.type}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">{new Date(l.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(l.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      l.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      l.status === 'rejected' ? 'bg-rose-100 text-rose-800 border border-rose-250' : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>{l.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {exportModal && (
        <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4" onClick={() => setExportModal(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-150 transform scale-100 transition duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-stone-100 text-stone-850">
                <Download size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-955 font-corporate">Choose Export Format</h4>
                <p className="text-[10px] text-stone-500 mt-0.5">{exportModal.title}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button 
                onClick={() => {
                  exportModal.onExport('pdf');
                  setExportModal(null);
                }}
                className="flex flex-col items-center justify-center p-4 border border-stone-200 rounded-2xl hover:bg-stone-50 hover:border-stone-400 active:scale-95 transition group"
              >
                <span className="text-2xl mb-1.5 group-hover:scale-110 transition duration-150">📄</span>
                <span className="text-xs font-bold text-stone-850 font-corporate">PDF Document</span>
                <span className="text-[9px] text-stone-400 mt-1">Print / Save PDF</span>
              </button>

              <button 
                onClick={() => {
                  exportModal.onExport('csv');
                  setExportModal(null);
                }}
                className="flex flex-col items-center justify-center p-4 border border-stone-200 rounded-2xl hover:bg-stone-50 hover:border-stone-400 active:scale-95 transition group"
              >
                <span className="text-2xl mb-1.5 group-hover:scale-110 transition duration-150">📊</span>
                <span className="text-xs font-bold text-stone-850 font-corporate">CSV (in Excel)</span>
                <span className="text-[9px] text-stone-400 mt-1">Spreadsheet</span>
              </button>
            </div>

            <button 
              onClick={() => setExportModal(null)}
              className="w-full mt-4 py-2.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold text-stone-600 transition active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ PAYROLL / PAYSLIP ============
function PayrollPage({ user, data, update }) {
  const currency = data.settings?.currency || 'USD';
  const C = (n) => fmtCurrency(n, currency);
  const [exportModal, setExportModal] = useState(null);
  const [editPayroll, setEditPayroll] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const pastMonths = useMemo(() => {
    const list = [];
    const date = new Date();
    for (let i = 0; i < 6; i++) {
      const m = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      list.push(m);
      date.setMonth(date.getMonth() - 1);
    }
    return list;
  }, []);

  const [month, setMonth] = useState(pastMonths[0]);
  const isAdmin = user.role === 'Admin';
  const payroll = getPayrollForMonth(user.id, data, month);

  const earnings = (payroll.base || 0) + (payroll.hra || 0) + (payroll.performance || 0);
  const deductions = (payroll.leaveDeduction || 0) + (payroll.tax || 0) + (payroll.prEsi || 0);
  const net = earnings - deductions;

  const triggerSinglePayslipExport = (m) => {
    // PDF-only — professional payslip format
    printPayslip(user, getPayrollForMonth(user.id, data, m), m, data.settings, C);
  };

  const triggerPayrollExport = () => {
    setExportModal({
      title: `All Staff Payroll Sheet for ${month}`,
      onExport: (format) => {
        if (format === 'csv') {
          const headers = ['Employee Name', 'Email', 'Role', 'Base Salary', 'HRA', 'Performance Bonus', 'Auto Leave Deduction', 'Unpaid Leave Days', 'Tax Deductions', 'PF/ESI Deductions', 'Net Payout'];
          const rows = data.users.filter((u) => u.role !== 'Admin').map((u) => {
            const p = getPayrollForMonth(u.id, data, month);
            const n = (p.base + p.hra + p.performance) - ((p.leaveDeduction || 0) + p.tax + p.prEsi);
            return [
              u.name,
              u.email,
              u.role,
              p.base,
              p.hra,
              p.performance,
              p.leaveDeduction || 0,
              p.payrollMeta?.unpaidLeaveDays || 0,
              p.tax,
              p.prEsi,
              n
            ];
          });
          downloadCSV(`payroll_distribution_${month.toLowerCase().replace(' ', '_')}.csv`, headers, rows);
        } else {
          printPDF(
            `Payroll Distribution Registry - ${month}`,
            ['Employee Name', 'Email', 'Role', 'Base Salary', 'HRA', 'Performance', 'Leave Deduction', 'Unpaid Leave Days', 'Tax', 'PF/ESI', 'Net Pay'],
            data.users.filter((u) => u.role !== 'Admin').map((u) => {
              const p = getPayrollForMonth(u.id, data, month);
              const n = (p.base + p.hra + p.performance) - ((p.leaveDeduction || 0) + p.tax + p.prEsi);
              return [u.name, u.email, u.role, C(p.base), C(p.hra), C(p.performance), C(p.leaveDeduction || 0), p.payrollMeta?.unpaidLeaveDays || 0, C(p.tax), C(p.prEsi), C(n)];
            })
          );
        }
      }
    });
  };

  const triggerBankDetailsExport = () => {
    setExportModal({
      title: `Employee Bank Payment Registry - ${month}`,
      onExport: (format) => {
        const headers = ['Employee Name', 'Email', 'Role', 'Month', 'Net Payable', 'Bank Name', 'Account Name', 'Account No.', 'IFSC / SWIFT', 'Branch'];
        const rows = data.users.filter((u) => u.role !== 'Admin').map((u) => {
          const p = getPayrollForMonth(u.id, data, month);
          const netPayable = (p.base + p.hra + p.performance) - ((p.leaveDeduction || 0) + p.tax + p.prEsi);
          return [
            u.name,
            u.email,
            u.role,
            month,
            format === 'csv' ? netPayable : C(netPayable),
            u.bankName || 'Not provided',
            u.bankAccountName || 'Not provided',
            u.bankAccountNo || 'Not provided',
            u.bankIfsc || 'Not provided',
            u.bankBranch || 'Not provided',
          ];
        });

        if (format === 'csv') {
          downloadCSV(`employee_bank_payments_${month.toLowerCase().replace(/\s+/g, '_')}.csv`, headers, rows);
        } else {
          printPDF(`Employee Bank Payment Registry - ${month}`, headers, rows);
        }
      }
    });
  };

  // ---- Non-admin: PAYSLIP DOWNLOAD ONLY ----
  if (!isAdmin) {
    const payslips = pastMonths;
    return (
      <div className="px-1 md:px-5 pt-3">
        <h1 className="text-2xl text-stone-900 mb-1 font-extrabold tracking-tight">My Payslips</h1>
        <p className="text-xs text-stone-500 mb-6">Download your monthly payslips securely.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: Latest Payout Box */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-300/20 rounded-full -translate-y-16 translate-x-16 blur-2xl" />
            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-2">Latest Payout</p>
            <h3 className="text-3xl font-extrabold tracking-tight text-stone-955 mb-1">{C(net)}</h3>
            <p className="text-xs text-stone-500 mb-4">Salary for {month}</p>
            <button 
              onClick={() => triggerSinglePayslipExport(month)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition"
            >
              <Download size={14} /> Download
            </button>
          </div>

          {/* Right: Payslip List */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <p className="text-sm font-semibold text-stone-955">Payslip History</p>
            </div>
            <div className="divide-y divide-stone-100">
              {payslips.map((m) => (
                <div key={m} className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <FileText size={15} className="text-stone-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-900">Payslip · {m}</p>
                      <p className="text-[10px] text-stone-400">Secure Download</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => triggerSinglePayslipExport(m)}
                    className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-855 text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 active:scale-95 transition"
                  >
                    <Download size={11} /> Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {exportModal && (
          <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setExportModal(null)}>
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-150 transform scale-100 transition duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-2xl bg-stone-100 text-stone-850">
                  <Download size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-955 font-corporate">Choose Export Format</h4>
                  <p className="text-[10px] text-stone-550 mt-0.5">{exportModal.title}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-5">
                <button 
                  onClick={() => {
                    exportModal.onExport('pdf');
                    setExportModal(null);
                  }}
                  className="flex flex-col items-center justify-center p-4 border border-stone-200 rounded-2xl hover:bg-stone-50 hover:border-stone-400 active:scale-95 transition group"
                >
                  <span className="text-2xl mb-1.5 group-hover:scale-110 transition duration-150">📄</span>
                  <span className="text-xs font-bold text-stone-850 font-corporate">PDF Document</span>
                  <span className="text-[9px] text-stone-400 mt-1">Print / Save PDF</span>
                </button>

                <button 
                  onClick={() => {
                    exportModal.onExport('csv');
                    setExportModal(null);
                  }}
                  className="flex flex-col items-center justify-center p-4 border border-stone-200 rounded-2xl hover:bg-stone-50 hover:border-stone-400 active:scale-95 transition group"
                >
                  <span className="text-2xl mb-1.5 group-hover:scale-110 transition duration-150">📊</span>
                  <span className="text-xs font-bold text-stone-850 font-corporate">CSV (in Excel)</span>
                  <span className="text-[9px] text-stone-400 mt-1">Spreadsheet</span>
                </button>
              </div>

              <button 
                onClick={() => setExportModal(null)}
                className="w-full mt-4 py-2.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold text-stone-600 transition active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- ADMIN: FULL PAYROLL VIEW ----
  return (
    <div className="px-1 md:px-5 pt-3">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl text-stone-900 font-extrabold tracking-tight">Payroll Management</h1>
        <Pill role="Admin" />
      </div>
      <p className="text-xs text-stone-500 mb-6">Manage and approve payroll distributions for all company staff.</p>

      {/* Month selector */}
      <div className="flex items-center justify-between mb-6 p-3 bg-white rounded-2xl border border-stone-200 shadow-sm max-w-md mx-auto">
        <button className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition"><ChevronLeft size={14} /></button>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="font-semibold text-sm bg-transparent border-0 focus:outline-none cursor-pointer">
          {pastMonths.slice(0, 4).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <button className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition"><ChevronRight size={14} /></button>
      </div>

      {/* ─── ANALYTICS STRIP ─── */}
      {(() => {
        const staff = data.users.filter((u) => u.role !== 'Admin');
        const allPayrolls = staff.map((u) => {
          const p = getPayrollForMonth(u.id, data, month);
          return { ...p, net: (p.base + p.hra + p.performance) - ((p.leaveDeduction||0) + p.tax + p.prEsi), name: u.name };
        });
        const totalPayroll = allPayrolls.reduce((s, p) => s + p.net, 0);
        const avgNet = staff.length ? Math.round(totalPayroll / staff.length) : 0;
        const maxNet = allPayrolls.length ? Math.max(...allPayrolls.map((p) => p.net)) : 1;
        const totalBase = allPayrolls.reduce((s, p) => s + p.base, 0);
        const totalDeductions = allPayrolls.reduce((s, p) => s + p.tax + p.prEsi + (p.leaveDeduction||0), 0);
        return (
          <div className="mb-6 space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Payroll Spend', value: C(totalPayroll), sub: `${month}`, color: 'from-stone-900 to-stone-700', text: 'text-amber-300' },
                { label: 'Average Net Pay', value: C(avgNet), sub: 'Per employee', color: 'from-emerald-600 to-emerald-800', text: 'text-emerald-200' },
                { label: 'Base Salaries', value: C(totalBase), sub: 'Gross fixed cost', color: 'from-sky-600 to-sky-800', text: 'text-sky-200' },
                { label: 'Total Deductions', value: C(totalDeductions), sub: 'Tax + PF/ESI', color: 'from-rose-500 to-rose-700', text: 'text-rose-200' },
              ].map((kpi) => (
                <div key={kpi.label} className={`relative rounded-2xl p-4 overflow-hidden bg-gradient-to-br ${kpi.color} shadow-sm`}>
                  <p className={`text-[9px] uppercase tracking-widest font-semibold mb-1 ${kpi.text}`}>{kpi.label}</p>
                  <p className="text-lg font-extrabold text-white tabular-nums leading-tight">{kpi.value}</p>
                  <p className={`text-[9px] mt-0.5 ${kpi.text}`}>{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* Salary Distribution Bar Chart */}
            {allPayrolls.length > 0 && (
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5">
                <p className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold mb-4">Net Pay Distribution · {month}</p>
                <div className="space-y-3">
                  {allPayrolls.map((p) => {
                    const pct = maxNet > 0 ? Math.round((p.net / maxNet) * 100) : 0;
                    const isTop = p.net === maxNet;
                    return (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className="text-[10px] text-stone-600 font-medium w-24 truncate flex-shrink-0">{p.name.split(' ')[0]}</span>
                        <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${isTop ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-stone-400 to-stone-600'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold tabular-nums w-20 text-right flex-shrink-0 ${isTop ? 'text-amber-600' : 'text-stone-700'}`}>{C(p.net)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Columns: Staff Payroll List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-stone-955 font-corporate">Staff Distribution · {month}</p>
            <button onClick={triggerPayrollExport} className="text-[10px] text-stone-500 hover:text-stone-900 font-bold flex items-center gap-1 transition active:scale-95"><Download size={11} /> EXPORT ALL</button>
          </div>
          <div className="divide-y divide-stone-100">
            {data.users.filter((u) => u.role !== 'Admin').map((u) => {
              const p = getPayrollForMonth(u.id, data, month);
              const n = (p.base + p.hra + p.performance) - ((p.leaveDeduction || 0) + p.tax + p.prEsi);
              return (
                <div key={u.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-stone-50 transition group">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={u.name} size="sm" src={u.logo} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-stone-900 truncate">{u.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Pill role={u.role} />
                        <span className="text-[9px] text-stone-400 truncate">{u.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-stone-950 tabular-nums">{C(n)}</p>
                      <p className="text-[9px] text-stone-450 font-medium uppercase tracking-wider">
                        {p.payrollMeta?.unpaidLeaveDays ? `${p.payrollMeta.unpaidLeaveDays} unpaid leave day${p.payrollMeta.unpaidLeaveDays === 1 ? '' : 's'}` : 'Net Pay'}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditPayroll({ userId: u.id, name: u.name, role: u.role, fields: { base: p.base, hra: p.hra, performance: p.performance, tax: p.tax, prEsi: p.prEsi, leaveDeduction: p.leaveDeduction || 0, unpaidLeaveDays: p.payrollMeta?.unpaidLeaveDays || 0 } })}
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-900 hover:text-white flex items-center justify-center transition text-stone-500 flex-shrink-0"
                      title="Edit salary"
                    >
                      <Edit3 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Salary Analytics — hidden for Admin */}
        {isAdmin && (
          <div className="lg:col-span-3 bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-955 font-corporate">Employee Bank Details</p>
                <p className="text-[10px] text-stone-400 mt-0.5">Bank details and net payable amount for {month}.</p>
              </div>
              <button
                onClick={triggerBankDetailsExport}
                className="text-[10px] text-stone-500 hover:text-stone-900 font-bold flex items-center gap-1 transition active:scale-95"
              >
                <Download size={11} /> DOWNLOAD BANK DETAILS
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                    <th className="px-5 py-3 text-left">Employee</th>
                    <th className="px-5 py-3 text-left">Amount</th>
                    <th className="px-5 py-3 text-left">Bank Name</th>
                    <th className="px-5 py-3 text-left">Account Name</th>
                    <th className="px-5 py-3 text-left">Account No.</th>
                    <th className="px-5 py-3 text-left">IFSC / SWIFT</th>
                    <th className="px-5 py-3 text-left">Branch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.users.filter((u) => u.role !== 'Admin').map((u) => {
                    const hasBank = !!(u.bankName || u.bankAccountName || u.bankAccountNo || u.bankIfsc || u.bankBranch);
                    const p = getPayrollForMonth(u.id, data, month);
                    const netPayable = (p.base + p.hra + p.performance) - ((p.leaveDeduction || 0) + p.tax + p.prEsi);
                    return (
                      <tr key={u.id} className="hover:bg-stone-50 transition">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} size="sm" src={u.logo} />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-stone-900 truncate">{u.name}</p>
                              <p className="text-[10px] text-stone-500 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs font-bold text-emerald-700 tabular-nums">{C(netPayable)}</td>
                        <td className="px-5 py-3 text-xs font-medium text-stone-800">{u.bankName || <span className="text-stone-350">Not provided</span>}</td>
                        <td className="px-5 py-3 text-xs font-medium text-stone-800">{u.bankAccountName || <span className="text-stone-350">Not provided</span>}</td>
                        <td className="px-5 py-3 text-xs font-mono text-stone-800">{u.bankAccountNo || <span className="font-sans text-stone-350">Not provided</span>}</td>
                        <td className="px-5 py-3 text-xs font-mono text-stone-800">{u.bankIfsc || <span className="font-sans text-stone-350">Not provided</span>}</td>
                        <td className="px-5 py-3 text-xs font-medium text-stone-800">
                          <div className="flex items-center justify-between gap-2">
                            <span>{u.bankBranch || <span className="text-stone-350">Not provided</span>}</span>
                            {!hasBank && <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold uppercase tracking-wide">Pending</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {data.users.filter((u) => u.role !== 'Admin').length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-5 py-10 text-center text-xs text-stone-400">
                        No employee bank details available yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isAdmin && (
        <div className="space-y-4">

          {/* SVG Donut Chart: Earnings vs Deductions */}
          {(() => {
            const r = 54;
            const cx = 70;
            const cy = 70;
            const circ = 2 * Math.PI * r;
            const total = earnings + deductions || 1;
            const ePct = earnings / total;
            const dPct = deductions / total;
            const eArc = ePct * circ;
            const dArc = dPct * circ;
            // segments: earnings (emerald), deductions (rose), net gap
            const earnDash = `${eArc} ${circ - eArc}`;
            const dedDash = `${dArc} ${circ - dArc}`;
            const dedOffset = circ - eArc; // starts after earnings
            const components = [
              { label: 'Base Salary', value: payroll.base, total: earnings, color: '#10b981' },
              { label: 'HRA', value: payroll.hra, total: earnings, color: '#34d399' },
              { label: 'Bonus', value: payroll.performance, total: earnings, color: '#6ee7b7' },
              { label: 'Tax', value: payroll.tax, total: deductions || 1, color: '#f43f5e' },
              { label: 'PF/ESI', value: payroll.prEsi, total: deductions || 1, color: '#fb7185' },
            ];
            return (
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5">
                <p className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold mb-4">My Salary Analytics</p>

                {/* Donut Chart */}
                <div className="flex items-center justify-center mb-5">
                  <div className="relative">
                    <svg width={140} height={140} viewBox="0 0 140 140">
                      {/* Track */}
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f5f5f4" strokeWidth={14} />
                      {/* Earnings arc */}
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#10b981" strokeWidth={14}
                        strokeDasharray={earnDash} strokeDashoffset={circ / 4}
                        strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                      {/* Deductions arc */}
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f43f5e" strokeWidth={14}
                        strokeDasharray={dedDash} strokeDashoffset={circ / 4 + circ - eArc}
                        strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                      {/* Center text */}
                      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="9" fill="#78716c" fontWeight="600" fontFamily="system-ui">NET PAY</text>
                      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="12" fill="#1c1917" fontWeight="800" fontFamily="system-ui">{C(net)}</text>
                    </svg>
                    {/* Legend */}
                    <div className="absolute -right-16 top-4 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="text-[9px] text-stone-500 font-medium">Earnings</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                        <span className="text-[9px] text-stone-500 font-medium">Deductions</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Component Bars */}
                <div className="space-y-2.5">
                  {components.map((comp) => {
                    const pct = comp.total > 0 ? Math.round((comp.value / comp.total) * 100) : 0;
                    return (
                      <div key={comp.label}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-stone-500 font-medium">{comp.label}</span>
                          <span className="font-bold text-stone-800 tabular-nums">{C(comp.value)}</span>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: comp.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Row */}
                <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[9px] text-stone-400 uppercase tracking-wider">Gross</p>
                    <p className="text-xs font-bold text-emerald-700 tabular-nums">{C(earnings)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-stone-400 uppercase tracking-wider">Deduct</p>
                    <p className="text-xs font-bold text-rose-600 tabular-nums">-{C(deductions)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-stone-400 uppercase tracking-wider">Take-home</p>
                    <p className="text-xs font-bold text-stone-900 tabular-nums">{C(net)}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Export button */}
          <button onClick={() => triggerSinglePayslipExport(month)} className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition">
            <Download size={13} /> Export My Payslip
          </button>
      </div>
        )}
    </div>

      {/* ---- SALARY EDIT MODAL ---- */}
      {editPayroll && (
        <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4" onClick={() => setEditPayroll(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h4 className="text-base font-bold text-stone-950 font-corporate">Edit Salary Package</h4>
                <p className="text-[11px] text-stone-400 mt-0.5">{editPayroll.name} · <span className="font-semibold">{editPayroll.role}</span></p>
              </div>
              <button onClick={() => setEditPayroll(null)} className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition">
                <X size={14} className="text-stone-600" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { key: 'base', label: 'Base Salary', color: 'emerald', hint: 'Monthly fixed pay' },
                { key: 'hra', label: 'HRA Allowance', color: 'sky', hint: 'House rent allowance' },
                { key: 'performance', label: 'Performance Bonus', color: 'amber', hint: 'Variable monthly incentive' },
                { key: 'tax', label: 'Tax Deduction', color: 'rose', hint: 'Professional & income tax' },
                { key: 'prEsi', label: 'PF / ESI', color: 'rose', hint: 'Provident fund & insurance' },
              ].map(({ key, label, hint }) => (
                <div key={key}>
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-stone-500 mb-1 block">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-semibold">$</span>
                    <input
                      type="number"
                      min="0"
                      value={editPayroll.fields[key]}
                      onChange={(e) => setEditPayroll((prev) => ({ ...prev, fields: { ...prev.fields, [key]: Number(e.target.value) } }))}
                      className="w-full pl-7 pr-3 py-2.5 text-sm font-semibold bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-stone-350 font-medium">{hint}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Net Pay Preview */}
            <div className="mt-5 p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">Net Pay Preview</p>
                <p className="text-xl font-extrabold text-stone-950 tabular-nums mt-0.5">
                  {C((editPayroll.fields.base + editPayroll.fields.hra + editPayroll.fields.performance) - (editPayroll.fields.tax + editPayroll.fields.prEsi + editPayroll.fields.leaveDeduction))}
                </p>
                <p className="text-[10px] text-stone-500 mt-1">
                  Auto leave deduction: {C(editPayroll.fields.leaveDeduction || 0)}
                  {editPayroll.fields.unpaidLeaveDays ? ` for ${editPayroll.fields.unpaidLeaveDays} unpaid day${editPayroll.fields.unpaidLeaveDays === 1 ? '' : 's'}` : ''}
                </p>
              </div>
              <div className="text-right text-[10px] text-stone-400 space-y-0.5">
                <p>Gross: <span className="font-semibold text-stone-700">{C(editPayroll.fields.base + editPayroll.fields.hra + editPayroll.fields.performance)}</span></p>
                <p>Deductions: <span className="font-semibold text-rose-600">-{C(editPayroll.fields.tax + editPayroll.fields.prEsi + editPayroll.fields.leaveDeduction)}</span></p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setEditPayroll(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold text-stone-600 transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  update((d) => {
                    const existing = d.payroll[editPayroll.userId] || {};
                    d.payroll = {
                      ...d.payroll,
                      [editPayroll.userId]: {
                        ...existing,
                        base: editPayroll.fields.base,
                        hra: editPayroll.fields.hra,
                        performance: editPayroll.fields.performance,
                        tax: editPayroll.fields.tax,
                        prEsi: editPayroll.fields.prEsi,
                      }
                    };
                    return d;
                  });
                  setEditPayroll(null);
                }}
                className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check size={13} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {exportModal && (
        <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setExportModal(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-150 transform scale-100 transition duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-stone-100 text-stone-850">
                <Download size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-955 font-corporate">Choose Export Format</h4>
                <p className="text-[10px] text-stone-550 mt-0.5">{exportModal.title}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button 
                onClick={() => {
                  exportModal.onExport('pdf');
                  setExportModal(null);
                }}
                className="flex flex-col items-center justify-center p-4 border border-stone-200 rounded-2xl hover:bg-stone-50 hover:border-stone-400 active:scale-95 transition group"
              >
                <span className="text-2xl mb-1.5 group-hover:scale-110 transition duration-150">📄</span>
                <span className="text-xs font-bold text-stone-855 font-corporate">PDF Document</span>
                <span className="text-[9px] text-stone-400 mt-1">Print / Save PDF</span>
              </button>

              <button 
                onClick={() => {
                  exportModal.onExport('csv');
                  setExportModal(null);
                }}
                className="flex flex-col items-center justify-center p-4 border border-stone-200 rounded-2xl hover:bg-stone-50 hover:border-stone-400 active:scale-95 transition group"
              >
                <span className="text-2xl mb-1.5 group-hover:scale-110 transition duration-150">📊</span>
                <span className="text-xs font-bold text-stone-855 font-corporate">CSV (in Excel)</span>
                <span className="text-[9px] text-stone-400 mt-1">Spreadsheet</span>
              </button>
            </div>

            <button 
              onClick={() => setExportModal(null)}
              className="w-full mt-4 py-2.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold text-stone-600 transition active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ SETTINGS ============
function SettingsPage({ user, data, update, onLogout }) {
  const isAdmin = user.role === 'Admin';
  const isHR = isAdmin || user.role === 'HR';
  const [tab, setTab] = useState('settings');
  const [saved, setSaved] = useState(null); // flash message: 'bank' | 'company'

  // Edit profile modal
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name:     user.name     || '',
    contact:  user.contact  || '',
    password: '',
    logo:     user.logo     || '',
  });
  const [profileError, setProfileError] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [supportModal, setSupportModal] = useState(null);
  const notifications = data.settings?.notifications || { email: false, push: false, weekly: false };
  const twoFactorEnabled = !!data.settings?.twoFactor;

  const saveProfile = () => {
    if (!profileForm.name.trim()) return setProfileError('Name cannot be empty.');
    update((d) => {
      d.users = d.users.map((u) =>
        u.id === user.id
          ? {
              ...u,
              name: profileForm.name.trim(),
              contact: profileForm.contact.trim(),
              logo: profileForm.logo || '',
              ...(profileForm.password ? { password: profileForm.password } : {}),
            }
          : u
      );
      return d;
    });
    setEditProfileOpen(false);
    setProfileError('');
    flash('profile');
  };

  const openPasswordModal = () => {
    setPasswordForm({ current: '', next: '', confirm: '' });
    setPasswordError('');
    setPasswordOpen(true);
  };

  const savePassword = () => {
    if (user.password && passwordForm.current !== user.password) {
      return setPasswordError('Current password is incorrect.');
    }
    if (passwordForm.next.trim().length < 6) {
      return setPasswordError('New password must be at least 6 characters.');
    }
    if (passwordForm.next !== passwordForm.confirm) {
      return setPasswordError('New passwords do not match.');
    }
    update((d) => {
      d.users = d.users.map((u) => u.id === user.id ? { ...u, password: passwordForm.next } : u);
      return d;
    });
    setPasswordOpen(false);
    setPasswordError('');
    flash('password');
  };

  const toggleTwoFactor = () => {
    update((d) => {
      d.settings = { ...(d.settings || {}), twoFactor: !twoFactorEnabled };
      return d;
    });
    flash('security');
  };

  const toggleNotification = (key) => {
    update((d) => {
      const current = d.settings?.notifications || {};
      d.settings = {
        ...(d.settings || {}),
        notifications: {
          email: false,
          push: false,
          weekly: false,
          ...current,
          [key]: !current[key],
        },
      };
      return d;
    });
    flash('notifications');
  };

  const handleProfileLogo = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return setProfileError('Please choose an image file.');
    }
    if (file.size > 1024 * 1024) {
      return setProfileError('Logo image must be under 1 MB.');
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((p) => ({ ...p, logo: reader.result }));
      setProfileError('');
    };
    reader.readAsDataURL(file);
  };

  // Local state for employee bank form
  const [bankForm, setBankForm] = useState({
    bankName:        user.bankName        || '',
    bankAccountName: user.bankAccountName || '',
    bankAccountNo:   user.bankAccountNo   || '',
    bankIfsc:        user.bankIfsc        || '',
    bankBranch:      user.bankBranch      || '',
  });

  // Local state for company info form
  const co0 = data.settings?.company || {};
  const [coForm, setCoForm] = useState({
    name:    co0.name    || '',
    address: co0.address || '',
    city:    co0.city    || '',
    phone:   co0.phone   || '',
    email:   co0.email   || '',
    website: co0.website || '',
    gstin:   co0.gstin   || '',
    logo:    co0.logo    || '',
  });

  // Local state for company bank form
  const cb0 = data.settings?.companyBank || {};
  const [cbForm, setCbForm] = useState({
    bankName:    cb0.bankName    || '',
    accountName: cb0.accountName || '',
    accountNo:   cb0.accountNo   || '',
    ifsc:        cb0.ifsc        || '',
    branch:      cb0.branch      || '',
  });

  const flash = (key) => { setSaved(key); setTimeout(() => setSaved(null), 2500); };

  const saveBankDetails = () => {
    update((d) => {
      d.users = d.users.map((u) => u.id === user.id ? { ...u, ...bankForm } : u);
      return d;
    });
    flash('bank');
  };

  const saveCompanyDetails = () => {
    update((d) => {
      d.settings = {
        ...(d.settings || {}),
        company: { ...coForm },
        companyBank: { ...cbForm },
      };
      return d;
    });
    flash('company');
  };

  const handleCompanyLogo = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return setSupportModal({ title: 'Invalid logo', body: 'Please choose an image file for the company logo.' });
    }
    if (file.size > 1024 * 1024) {
      return setSupportModal({ title: 'Logo too large', body: 'Company logo image must be under 1 MB so payslips stay fast to download.' });
    }
    const reader = new FileReader();
    reader.onload = () => setCoForm((prev) => ({ ...prev, logo: reader.result }));
    reader.readAsDataURL(file);
  };

  const inputCls = 'w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 transition';
  const labelCls = 'block text-[10px] text-stone-500 font-semibold mb-1 uppercase tracking-wide';

  return (
    <div className="px-1 md:px-5 pt-3 pb-4">

      {/* ── Edit Profile Modal ── */}
      {editProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm space-y-4 border border-stone-200">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-stone-900 text-base">Edit Profile</p>
              <button onClick={() => setEditProfileOpen(false)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition"><X size={15} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-stone-500 font-semibold mb-2 uppercase tracking-wide">Profile Logo</label>
                <div className="flex items-center gap-3">
                  <Avatar name={profileForm.name || user.name} size="lg" src={profileForm.logo} />
                  <div className="flex-1 min-w-0">
                    <label className="w-full cursor-pointer px-3 py-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 transition flex items-center justify-center gap-2">
                      <Camera size={13} /> Upload Logo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleProfileLogo(e.target.files?.[0])}
                      />
                    </label>
                    {profileForm.logo && (
                      <button
                        type="button"
                        onClick={() => setProfileForm((p) => ({ ...p, logo: '' }))}
                        className="mt-2 text-[10px] text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        Remove logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-stone-500 font-semibold mb-1 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] text-stone-500 font-semibold mb-1 uppercase tracking-wide">Phone / Contact</label>
                <input
                  type="text"
                  value={profileForm.contact}
                  onChange={(e) => setProfileForm((p) => ({ ...p, contact: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] text-stone-500 font-semibold mb-1 uppercase tracking-wide">New Password <span className="normal-case font-normal text-stone-400">(leave blank to keep current)</span></label>
                <input
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="New password"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 transition"
                />
              </div>

              {profileError && (
                <p className="text-rose-600 text-xs flex items-center gap-1.5">
                  <AlertCircle size={12} /> {profileError}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditProfileOpen(false)} className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold text-stone-700 transition">Cancel</button>
              <button onClick={saveProfile} className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5"><Check size={13} /> Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {passwordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm space-y-4 border border-stone-200">
            <div className="flex items-center justify-between">
              <p className="font-bold text-stone-900 text-base">Change Password</p>
              <button onClick={() => setPasswordOpen(false)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition"><X size={15} /></button>
            </div>
            <div className="space-y-3">
              {user.password && (
                <div>
                  <label className={labelCls}>Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                    className={inputCls}
                    placeholder="Enter current password"
                  />
                </div>
              )}
              <div>
                <label className={labelCls}>New Password</label>
                <input
                  type="password"
                  value={passwordForm.next}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))}
                  className={inputCls}
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className={labelCls}>Confirm Password</label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                  className={inputCls}
                  placeholder="Repeat new password"
                />
              </div>
              {passwordError && (
                <p className="text-rose-600 text-xs flex items-center gap-1.5">
                  <AlertCircle size={12} /> {passwordError}
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setPasswordOpen(false)} className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold text-stone-700 transition">Cancel</button>
              <button onClick={savePassword} className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5"><Check size={13} /> Update</button>
            </div>
          </div>
        </div>
      )}

      {supportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-stone-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-stone-900 text-base">{supportModal.title}</p>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">{supportModal.body}</p>
              </div>
              <button onClick={() => setSupportModal(null)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition flex-shrink-0"><X size={15} /></button>
            </div>
            {supportModal.action && (
              <a
                href={supportModal.action.href}
                className="mt-5 w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                {supportModal.action.label}
              </a>
            )}
          </div>
        </div>
      )}
      <h1 className="text-2xl text-stone-900 mb-5 font-extrabold tracking-tight">Settings</h1>

      {/* Sub tabs for admin/HR */}
      {(isAdmin || isHR) && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          <button onClick={() => setTab('settings')} className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap ${tab === 'settings' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 border border-stone-200'}`}>Account</button>
          {isHR && <button onClick={() => setTab('employees')} className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap ${tab === 'employees' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 border border-stone-200'}`}>Employees</button>}
          {isAdmin && <button onClick={() => setTab('company')} className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap ${tab === 'company' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 border border-stone-200'}`}>Company & Bank</button>}
          {isHR && <button onClick={() => setTab('locations')} className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap ${tab === 'locations' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 border border-stone-200'}`}>Locations</button>}
        </div>
      )}

      {tab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex items-center gap-4">
              <Avatar name={user.name} size="lg" src={user.logo} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-950 text-base truncate">{user.name}</p>
                <p className="text-xs text-stone-500 truncate mb-1.5">{user.email}</p>
                <Pill role={user.role} />
              </div>
              <button
                onClick={() => {
                  setProfileForm({ name: user.name || '', contact: user.contact || '', password: '', logo: user.logo || '' });
                  setProfileError('');
                  setEditProfileOpen(true);
                }}
                className="w-9 h-9 rounded-full bg-stone-50 hover:bg-stone-100 flex items-center justify-center border border-stone-100 transition active:scale-90"
                title="Edit profile"
              >
                <Edit3 size={14} />
              </button>
            </div>

            {/* About settings fields */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                <p className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">About</p>
              </div>
              <div className="divide-y divide-stone-100">
                <div className="flex items-center gap-3 px-4 py-3.5"><Mail size={15} className="text-stone-400" /><span className="text-sm text-stone-800">{user.email}</span></div>
                <div className="flex items-center gap-3 px-4 py-3.5"><Phone size={15} className="text-stone-400" /><span className="text-sm text-stone-850">{user.contact || 'Not set'}</span></div>
                <div className="flex items-center gap-3 px-4 py-3.5"><Briefcase size={15} className="text-stone-400" /><span className="text-sm text-stone-850 uppercase font-semibold text-[11px] tracking-wide">{user.role}</span></div>
              </div>
            </div>

            {/* Employee Bank Details */}
            {!isAdmin && (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                  <div>
                    <p className={labelCls}>My Bank Details</p>
                    <p className="text-[9px] text-stone-400 mt-0.5">Shown on your payslip when downloaded</p>
                  </div>
                  {saved === 'bank' && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full flex items-center gap-1">
                      <Check size={10} /> Saved!
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { field: 'bankName',        label: 'Bank Name',    placeholder: 'HDFC / SBI / ICICI...' },
                    { field: 'bankAccountName', label: 'Account Name', placeholder: 'Full name as per bank' },
                    { field: 'bankAccountNo',   label: 'Account No.',  placeholder: 'Enter account number' },
                    { field: 'bankIfsc',        label: 'IFSC / SWIFT', placeholder: 'HDFC0001234' },
                    { field: 'bankBranch',      label: 'Branch',       placeholder: 'Branch name & city' },
                  ].map(({ field, label, placeholder }) => (
                    <div key={field}>
                      <label className={labelCls}>{label}</label>
                      <input
                        type="text"
                        value={bankForm[field]}
                        onChange={(e) => setBankForm((prev) => ({ ...prev, [field]: e.target.value }))}
                        placeholder={placeholder}
                        className={inputCls}
                      />
                    </div>
                  ))}
                  <button
                    onClick={saveBankDetails}
                    className="w-full mt-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Check size={13} /> Save Bank Details
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Account settings */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">Account Options</p>
                  {(saved === 'password' || saved === 'security') && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full flex items-center gap-1">
                      <Check size={10} /> Saved!
                    </span>
                  )}
                </div>
              </div>
              <div className="divide-y divide-stone-100">
                <button type="button" onClick={openPasswordModal} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 transition">
                  <span className="text-sm text-stone-850">Change Password</span>
                  <ChevronRight size={15} className="text-stone-400" />
                </button>
                <button type="button" onClick={toggleTwoFactor} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 transition">
                  <div className="text-left">
                    <p className="text-sm text-stone-850">Two-Factor Authentication</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition relative ${twoFactorEnabled ? 'bg-emerald-500' : 'bg-stone-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${twoFactorEnabled ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>
            </div>

            {/* Currency Settings — Admin/HR only */}
            {isHR && (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">Payroll Currency</p>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    {CURRENCIES.find((c) => c.code === (data.settings?.currency || 'USD'))?.symbol} {data.settings?.currency || 'USD'}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-[10px] text-stone-400 mb-3">Select the currency used across all payroll screens and exports. This applies globally for all staff.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CURRENCIES.map((cur) => {
                      const isActive = (data.settings?.currency || 'USD') === cur.code;
                      return (
                        <button
                          key={cur.code}
                          onClick={() => update((d) => { if (!d.settings) d.settings = {}; d.settings.currency = cur.code; return d; })}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition active:scale-95 ${
                            isActive
                              ? 'bg-stone-900 border-stone-900 text-white'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
                          }`}
                        >
                          <span className={`text-sm font-bold w-6 text-center flex-shrink-0 ${isActive ? 'text-amber-300' : 'text-stone-500'}`}>{cur.symbol}</span>
                          <div className="min-w-0">
                            <p className={`text-[10px] font-bold truncate ${isActive ? 'text-white' : 'text-stone-800'}`}>{cur.code}</p>
                            <p className={`text-[9px] truncate ${isActive ? 'text-stone-300' : 'text-stone-400'}`}>{cur.label}</p>
                          </div>
                          {isActive && <div className="ml-auto w-3.5 h-3.5 bg-emerald-400 rounded-full flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications settings switches */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">Notification Rules</p>
                  {saved === 'notifications' && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full flex items-center gap-1">
                      <Check size={10} /> Saved!
                    </span>
                  )}
                </div>
              </div>
              <div className="divide-y divide-stone-100">
                {[
                  { key: 'email', label: 'Email Alerts' },
                  { key: 'push', label: 'Push Notifications' },
                  { key: 'weekly', label: 'Weekly Summary' },
                ].map((item) => (
                  <button key={item.key} type="button" onClick={() => toggleNotification(item.key)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 transition">
                    <span className="text-sm text-stone-850">{item.label}</span>
                    <div className={`w-10 h-5 rounded-full transition relative ${notifications[item.key] ? 'bg-emerald-500' : 'bg-stone-300'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${notifications[item.key] ? 'left-5' : 'left-0.5'}`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Support option items */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                <p className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">Corporate Support</p>
              </div>
              <div className="divide-y divide-stone-100">
                <button
                  type="button"
                  onClick={() => setSupportModal({
                    title: 'Help Center',
                    body: 'For attendance, payroll, leave, or access issues, contact your company HR/admin team. Include your corporate ID, email, and a short description of the issue.',
                    action: { label: 'Email Support', href: `mailto:${data.settings?.company?.email || 'support@clowi.com'}?subject=Clowi%20Support%20Request` },
                  })}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 transition"
                >
                  <div className="flex items-center gap-2.5"><HelpCircle size={15} className="text-stone-400" /><span className="text-sm text-stone-850">Help Center</span></div><ChevronRight size={15} className="text-stone-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setSupportModal({
                    title: 'Privacy',
                    body: 'Your attendance, leave, payroll, and bank information are stored for company HR operations. Access is limited by role, and employee bank details are shown only where needed for payslips.',
                  })}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 transition"
                >
                  <div className="flex items-center gap-2.5"><Shield size={15} className="text-stone-400" /><span className="text-sm text-stone-850">Privacy</span></div><ChevronRight size={15} className="text-stone-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setSupportModal({
                    title: 'Terms',
                    body: 'Use this system only for authorized company attendance, leave, payroll, and admin workflows. Your organization is responsible for validating payroll settings before distribution.',
                  })}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-stone-50 transition"
                >
                  <div className="flex items-center gap-2.5"><FileText size={15} className="text-stone-400" /><span className="text-sm text-stone-850">Terms</span></div><ChevronRight size={15} className="text-stone-400" />
                </button>
              </div>
            </div>

            <button onClick={onLogout} className="w-full py-3.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition shadow-sm">
              <LogOut size={15} /> Logout from Session
            </button>
          </div>
        </div>
      )}

      {tab === 'employees' && isHR && <EmployeeManager data={data} update={update} user={user} />}
      {tab === 'locations' && isHR && <LocationManager data={data} update={update} user={user} />}

      {/* ── Company & Bank Settings (Admin only) ── */}
      {tab === 'company' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Company Info */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
              <div>
                <p className={labelCls}>Company Information</p>
                <p className="text-[9px] text-stone-400 mt-0.5">Appears on all payslips</p>
              </div>
              {saved === 'company' && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full flex items-center gap-1">
                  <Check size={10} /> Saved!
                </span>
              )}
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className={labelCls}>Company Logo</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {coForm.logo ? (
                      <img src={coForm.logo} alt="Company logo preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Logo size="mobile" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="w-full cursor-pointer px-3 py-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 transition flex items-center justify-center gap-2">
                      <Camera size={13} /> Upload Company Logo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleCompanyLogo(e.target.files?.[0])}
                      />
                    </label>
                    {coForm.logo && (
                      <button
                        type="button"
                        onClick={() => setCoForm((prev) => ({ ...prev, logo: '' }))}
                        className="mt-2 text-[10px] text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        Remove logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {[
                { field: 'name',    label: 'Company Name',       placeholder: 'Clowi Technologies Pvt. Ltd.' },
                { field: 'address', label: 'Address',            placeholder: '123 Corporate Avenue' },
                { field: 'city',    label: 'City / State / PIN', placeholder: 'Mumbai, Maharashtra - 400001' },
                { field: 'phone',   label: 'Phone',              placeholder: '+91 98765 43210' },
                { field: 'email',   label: 'HR Email',           placeholder: 'hr@company.com' },
                { field: 'website', label: 'Website',            placeholder: 'www.company.com' },
                { field: 'gstin',   label: 'GSTIN / Tax ID',     placeholder: 'GSTIN27AAAAA0000A1Z5' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className={labelCls}>{label}</label>
                  <input
                    type="text"
                    value={coForm[field]}
                    onChange={(e) => setCoForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-6">
            {/* Company Bank */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/50">
                <p className={labelCls}>Company Bank Details</p>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { field: 'bankName',    label: 'Bank Name',    placeholder: 'HDFC Bank' },
                  { field: 'accountName', label: 'Account Name', placeholder: 'Company full name' },
                  { field: 'accountNo',   label: 'Account No.',  placeholder: '50200012345678' },
                  { field: 'ifsc',        label: 'IFSC / SWIFT', placeholder: 'HDFC0001234' },
                  { field: 'branch',      label: 'Branch',       placeholder: 'Nariman Point, Mumbai' },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label className={labelCls}>{label}</label>
                    <input
                      type="text"
                      value={cbForm[field]}
                      onChange={(e) => setCbForm((prev) => ({ ...prev, [field]: e.target.value }))}
                      placeholder={placeholder}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={saveCompanyDetails}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-sm font-bold transition active:scale-95 flex items-center justify-center gap-2 shadow-sm"
            >
              <Check size={15} /> Save Company & Bank Details
            </button>

            {/* Employee Bank note */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-amber-900 mb-1">Employee Bank Details</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Employees can update their own bank details from the <strong>Account</strong> settings tab. These will automatically appear on their payslips when downloaded.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ EMPLOYEE MGMT (Admin & HR) ============
function EmployeeManager({ data, update, user }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'Employee', password: '' });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const reset = () => { setForm({ name: '', email: '', role: 'Employee', password: '' }); setEditingId(null); setShowForm(false); };

  const save = () => {
    if (!form.name || !form.email) return;
    update((d) => {
      if (editingId) {
        d.users = d.users.map((u) => u.id === editingId ? { ...u, ...form } : u);
      } else {
        const userId = `u_${Date.now()}`;
        d.users = [...d.users, { id: userId, ...form, contact: '', badges: ['timekeeper'], corporateId: user.corporateId || '' }];
        // Initialize default payroll details
        d.payroll[userId] = { base: 5000, hra: 1200, performance: 800, leaveDeduction: 0, tax: 600, prEsi: 200, medical: 150 };
      }
      return d;
    });
    reset();
  };

  const remove = (id) => {
    if (!confirm('Remove this employee?')) return;
    update((d) => { d.users = d.users.filter((u) => u.id !== id); return d; });
  };

  const employees = data.users.filter((u) => u.role !== 'Admin');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-4">
      {/* Form Card (1 Column wide on desktop) */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4">
        <p className="text-xs uppercase tracking-widest text-stone-500 font-bold border-b border-stone-50 pb-2">
          {editingId ? 'Edit Employee Details' : 'Add New Employee'}
        </p>
        <div className="space-y-3">
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 transition" />
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 transition" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 transition">
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Temporary password" className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 transition" />
          <div className="flex gap-2 pt-2">
            {editingId && <button onClick={reset} className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold text-stone-700">Cancel</button>}
            <button onClick={save} className="flex-1 py-2 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-semibold shadow-md">{editingId ? 'Save changes' : 'Add Employee'}</button>
          </div>
        </div>
      </div>

      {/* Employees List (2 Columns wide on desktop) */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-sm divide-y divide-stone-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-50 bg-stone-50/50">
          <p className="text-sm font-semibold text-stone-950">Staff Registry</p>
        </div>
        {employees.length === 0 ? (
          <p className="text-xs text-stone-400 py-10 text-center">No registered employees. Add staff using the registration form.</p>
        ) : employees.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-3.5 hover:bg-stone-50/50 transition">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar name={u.name} src={u.logo} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-stone-900 truncate">{u.name}</p>
                <p className="text-[10px] text-stone-400 truncate mt-0.5">{u.email}</p>
                <div className="mt-1"><Pill role={u.role} /></div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <button onClick={() => { setForm({ name: u.name, email: u.email, role: u.role, password: u.password }); setEditingId(u.id); setShowForm(true); }} className="w-8 h-8 rounded-full bg-stone-50 hover:bg-stone-100 flex items-center justify-center border border-stone-100 transition" title="Edit"><Edit3 size={12} className="text-stone-600" /></button>
              <button onClick={() => remove(u.id)} className="w-8 h-8 rounded-full hover:bg-rose-50 flex items-center justify-center border border-transparent hover:border-rose-100 transition" title="Delete"><Trash2 size={12} className="text-rose-600" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ LOCATION MGMT (HR) ============
function LocationManager({ data, update, user }) {
  const [form, setForm] = useState({ name: '', lat: '', lng: '', radius: 150 });

  const save = () => {
    const lat = parseFloat(form.lat), lng = parseFloat(form.lng), radius = parseFloat(form.radius);
    if (!form.name || isNaN(lat) || isNaN(lng)) return;
    update((d) => {
      d.locations = [...d.locations, { id: `loc_${Date.now()}`, name: form.name, lat, lng, radius, corporateId: user.corporateId || '' }];
      return d;
    });
    setForm({ name: '', lat: '', lng: '', radius: 150 });
  };

  const remove = (id) => {
    if (!confirm('Remove this location?')) return;
    update((d) => { d.locations = d.locations.filter((l) => l.id !== id); return d; });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-4">
      {/* Form Panel (1 Column wide) */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4">
        <p className="text-xs uppercase tracking-widest text-stone-500 font-bold border-b border-stone-50 pb-2">
          Add Attendance Location
        </p>
        <div className="space-y-3">
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Location name (e.g. Branch)" className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 transition" />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" step="0.000001" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="Latitude" className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 transition" />
            <input type="number" step="0.000001" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="Longitude" className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 transition" />
          </div>
          <input type="number" value={form.radius} onChange={(e) => setForm({ ...form, radius: e.target.value })} placeholder="Radius (meters)" className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 transition" />
          <button onClick={() => setForm({ ...form, lat: '37.7749', lng: '-122.4194' })} className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition">Use Sample Coordinates</button>
          <button onClick={save} className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-md transition">Add Location</button>
        </div>
      </div>
 
      {/* Locations List (2 Columns wide) */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-sm divide-y divide-stone-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-50 bg-stone-50/50">
          <p className="text-sm font-semibold text-stone-950">Active Locations</p>
        </div>
        {data.locations.length === 0 ? (
          <p className="text-xs text-stone-400 py-10 text-center">No locations set up yet. Use the registration form to add zones.</p>
        ) : data.locations.map((l) => (
          <div key={l.id} className="flex items-center justify-between p-3.5 hover:bg-stone-50/50 transition">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Building2 size={15} className="text-emerald-700" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-stone-900 truncate">{l.name}</p>
                <p className="text-[10px] text-stone-400 font-mono truncate mt-0.5">{l.lat.toFixed(4)}, {l.lng.toFixed(4)} · {l.radius}m radius</p>
              </div>
            </div>
            <button onClick={() => remove(l.id)} className="w-8 h-8 rounded-full hover:bg-rose-50 flex items-center justify-center border border-transparent hover:border-rose-100 transition" title="Delete"><Trash2 size={12} className="text-rose-600" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ NOTIFICATIONS PANEL ============
function NotificationsPanel({ user, data, update, onClose }) {
  useEffect(() => {
    update((d) => {
      d.notifications = d.notifications.map((n) =>
        n.userId === user.id && !n.read ? { ...n, read: true } : n
      );
      return d;
    });
  }, []);

  const myNotifs = [...data.notifications]
    .filter((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      <div className="bg-white border-b border-stone-200 px-6 py-5 flex items-center justify-between flex-shrink-0">
        <h2 className="text-lg font-extrabold tracking-tight text-stone-900">Notifications</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-50 hover:bg-stone-100 flex items-center justify-center border border-stone-150 transition"><X size={14} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {myNotifs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 border border-stone-150">
              <Bell size={22} className="text-stone-400" />
            </div>
            <p className="text-sm text-stone-850 font-semibold">All caught up</p>
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">Notifications regarding your check-ins and leaves will show up here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myNotifs.map((n) => {
              const isReject = n.type === 'leave_rejected';
              const isApprove = n.type === 'leave_approved';
              return (
                <div key={n.id} className={`bg-white rounded-2xl border p-4 shadow-sm transition ${isReject ? 'border-rose-200 bg-rose-50/10' : isApprove ? 'border-emerald-200 bg-emerald-50/10' : 'border-stone-200'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isReject ? 'bg-rose-100' : isApprove ? 'bg-emerald-100' : 'bg-stone-100'}`}>
                      {isReject ? <X size={14} className="text-rose-700" /> : isApprove ? <Check size={14} className="text-emerald-700" /> : <Bell size={14} className="text-stone-700" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold uppercase tracking-wider ${isReject ? 'text-rose-800' : isApprove ? 'text-emerald-800' : 'text-stone-900'}`}>{n.title}</p>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">{n.message}</p>
                      <p className="text-[9px] text-stone-400 mt-2 font-medium">
                        {new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ MAIN APP / BOTTOM NAV & SIDEBAR shell ============
function App() {
  const [data, setData] = useState(INITIAL_DATA);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('clowi_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [tab, setTab] = useState('home');
  const [showNotifs, setShowNotifs] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Real-time toast alert state
  const [activeToast, setActiveToast] = useState(null);
  const [prevNotifsCount, setPrevNotifsCount] = useState(0);
  const hasInitializedRef = useRef(false);

  // Sync state dynamically - update both data store AND user state if user record changed
  const update = (fn) => {
    setData((prev) => {
      const next = fn({ ...prev });

      // Sync to MongoDB in background if logged in
      if (user && user.corporateId) {
        fetch(`${API_URL}/api/tenant/${user.corporateId}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: next })
        }).catch(() => {}); // silent fail — offline mode
      }

      // Always persist to localStorage
      localStorage.setItem(`clowi_data_${user?.corporateId || 'guest'}`, JSON.stringify(next));

      // Keep user state in sync with data.users (so profile/bank saves reflect immediately)
      const updatedUser = next.users?.find((u) => u.id === user?.id);
      if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(user)) {
        const merged = { ...user, ...updatedUser };
        setUser(merged);
        localStorage.setItem('clowi_user', JSON.stringify(merged));
      }

      return next;
    });
  };

  // Load data once on login — try backend first, fall back to localStorage
  useEffect(() => {
    if (!user || !user.corporateId) return;

    const saved = localStorage.getItem(`clowi_data_${user.corporateId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
      } catch (e) {
        console.error('Failed to parse local data:', e);
      }
    }

    // Try to fetch fresh data from backend once (no polling)
    fetch(`${API_URL}/api/tenant/${user.corporateId}`)
      .then((res) => { if (!res.ok) throw new Error('offline'); return res.json(); })
      .then((res) => {
        if (res.data) {
          setData(res.data);
          localStorage.setItem(`clowi_data_${user.corporateId}`, JSON.stringify(res.data));
        }
      })
      .catch(() => {}); // offline — already loaded from localStorage above
  }, [user?.id]); // only re-run when the logged-in user changes, NOT on every data update

  // Track notifications to automatically show elegant floating toast alerts
  useEffect(() => {
    if (!user) {
      hasInitializedRef.current = false;
      return;
    }
    const myNotifs = data.notifications.filter((n) => n.userId === user.id);
    const unreadNotifs = myNotifs.filter((n) => !n.read);

    if (!hasInitializedRef.current) {
      setPrevNotifsCount(unreadNotifs.length);
      hasInitializedRef.current = true;
      return;
    }

    if (unreadNotifs.length > prevNotifsCount) {
      const sorted = [...unreadNotifs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const latest = sorted[0];
      if (latest) {
        setActiveToast({
          id: latest.id,
          title: latest.title,
          message: latest.message,
          type: latest.type
        });
      }
    }
    setPrevNotifsCount(unreadNotifs.length);
  }, [data.notifications, user]);

  // Auto-dismiss the floating toast alert after 6 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRegister = async (newUser) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'Registration failed');
    setData(resData.data);
    return resData;
  };

  const handleLogin = async (credentials) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'Login failed');
    
    setUser(resData.user);
    setData(resData.data);
    localStorage.setItem('clowi_user', JSON.stringify(resData.user));
    setTab('home');
  };

  const handleLogout = () => {
    setUser(null);
    setData(INITIAL_DATA);
    localStorage.removeItem('clowi_user');
  };

  if (!user) {
    return (
      <Login
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  const isAdmin = user.role === 'Admin';
  const unreadCount = data.notifications.filter((n) => n.userId === user.id && !n.read).length;

  // MULTI-TENANT FILTERING
  const userCorp = user.corporateId || '';
  const scopedData = {
    ...data,
    users: data.users.filter(u => (u.corporateId || '') === userCorp),
    locations: data.locations.filter(l => (l.corporateId || '') === userCorp || !l.corporateId),
  };
  const scopedUserIds = new Set(scopedData.users.map(u => u.id));
  scopedData.attendance = data.attendance.filter(a => scopedUserIds.has(a.userId));
  scopedData.leaves = data.leaves.filter(l => scopedUserIds.has(l.userId));
  scopedData.payroll = Object.fromEntries(Object.entries(data.payroll).filter(([uid]) => scopedUserIds.has(uid)));
  scopedData.notifications = data.notifications.filter(n => scopedUserIds.has(n.userId));

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'report', icon: FileBarChart, label: 'Reports' },
    { id: 'payroll', icon: Wallet, label: isAdmin ? 'Payroll' : 'Payslips' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  if (isMobile) {
    // ============ MOBILE PURE FULL-VIEWPORT LAYOUT (Responsive & Native phone feel) ============
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col relative">
        {/* Mobile Sticky Header Bar */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-40 px-4 py-3 border-b border-stone-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Logo size="mobile" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNotifs(true)} className="relative w-9 h-9 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center active:scale-95 transition">
              <Bell size={16} className="text-stone-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white rounded-full text-[8px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => setTab('settings')} className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-full pl-1 pr-3 py-1 active:scale-95 transition" title="Settings">
              <Avatar name={user.name} size="sm" src={user.logo} />
              <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wide">{user.role}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Mobile Body Content */}
        <div className="flex-1 overflow-y-auto pb-24">
          {tab === 'home' && <HomePage user={user} data={scopedData} update={update} onOpenNotifs={() => setShowNotifs(true)} />}
          {tab === 'calendar' && <CalendarPage user={user} data={scopedData} update={update} onBack={() => setTab('home')} />}
          {tab === 'report' && <ReportPage user={user} data={scopedData} update={update} />}
          {tab === 'payroll' && <PayrollPage user={user} data={scopedData} update={update} />}
          {tab === 'settings' && <SettingsPage user={user} data={scopedData} update={update} onLogout={handleLogout} />}
        </div>

        {showNotifs && (
          <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-end justify-center p-0">
            <div className="bg-white rounded-t-3xl w-full h-[85vh] shadow-2xl relative overflow-hidden animate-slide-up">
              <NotificationsPanel user={user} data={data} update={update} onClose={() => setShowNotifs(false)} />
            </div>
          </div>
        )}

        {/* Bottom Tab Navigation Bar */}
        {!showNotifs && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-2 pb-safe z-40" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
            <div className="flex items-center justify-around max-w-lg mx-auto">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 min-w-[52px] ${
                      active
                        ? 'bg-stone-900 text-white shadow-lg scale-105'
                        : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                    <span className={`text-[9px] font-bold tracking-wide ${active ? 'text-white' : 'text-stone-400'}`}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Real-time Floating Toast Alert */}
        {activeToast && (
          <div 
            onClick={() => { setShowNotifs(true); setActiveToast(null); }}
            className="fixed top-20 right-4 left-4 z-[9999] bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200 shadow-2xl p-4 flex gap-3 items-start animate-slide-in cursor-pointer hover:bg-stone-50 transition active:scale-[0.98]"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              activeToast.type === 'leave_rejected' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
              activeToast.type === 'leave_approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
              'bg-amber-100 text-amber-700 border border-amber-200'
            }`}>
              {activeToast.type === 'leave_rejected' ? <X size={16} /> : activeToast.type === 'leave_approved' ? <Check size={16} /> : <Bell size={16} />}
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-xs font-bold text-stone-900 uppercase tracking-wide">{activeToast.title}</p>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed truncate">{activeToast.message}</p>
              <span className="inline-block text-[9px] text-amber-600 font-bold mt-1 hover:underline">
                Tap to view details
              </span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setActiveToast(null); }} 
              className="text-stone-400 hover:text-stone-600 p-0.5 rounded-full hover:bg-stone-100 transition flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============ WIDESCREEN DESKTOP/PC LAYOUT ============
  const desktopTabs = [
    { id: 'home',     icon: Home,         label: 'Dashboard' },
    { id: 'calendar', icon: Calendar,     label: 'Calendar & Leaves' },
    { id: 'report',   icon: FileBarChart, label: 'Reports & Logs' },
    { id: 'payroll',  icon: Wallet,       label: isAdmin ? 'Payroll Management' : 'My Payslips' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings & Admin Controls' },
  ];

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex">
      {/* Sidebar Navigation */}
      <div
        className="w-60 text-stone-700 flex flex-col flex-shrink-0"
        style={{
          background: 'radial-gradient(circle at 20% 20%, #fef3c7 0%, transparent 50%), radial-gradient(circle at 80% 80%, #fce7f3 0%, transparent 50%), #fafaf9'
        }}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b border-stone-200/70">
          <div className="h-24 flex items-center justify-center overflow-hidden">
            <Logo size="sidebar" />
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {desktopTabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setShowNotifs(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all duration-150 text-left ${
                  active
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'text-stone-600 hover:text-stone-950 hover:bg-white/70'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                  active ? 'bg-white text-stone-900' : 'text-stone-500'
                }`}>
                  <Icon size={16} strokeWidth={active ? 2.3 : 1.8} />
                </div>
                <span className="truncate text-[13px]">{t.label}</span>
                {active && <div className="ml-auto w-1.5 h-5 rounded-full bg-amber-300 flex-shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar User Card */}
        <div className="p-3 border-t border-stone-200/70">
          <div className="flex items-center gap-3 bg-white/75 border border-stone-200 rounded-2xl px-3 py-3 shadow-sm">
            <Avatar name={user.name} src={user.logo} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-stone-950 truncate">{user.name}</p>
              <span className="text-[9px] text-amber-700 font-bold uppercase tracking-widest">{user.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-7 h-7 rounded-xl hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-900 transition flex-shrink-0"
              title="Log Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-stone-50">
        {/* Top Header */}
        <header className="bg-white border-b border-stone-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0 z-10">
          <div>
            <p className="text-sm font-semibold text-stone-500">Welcome back, <span className="text-stone-950 font-bold">{user.name.split(' ')[0]}</span></p>
            <p className="text-xs text-stone-400 mt-0.5 font-medium">{fmtDate(new Date().toISOString())}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Current page label */}
            <span className="hidden lg:inline-flex items-center px-3 py-1.5 bg-stone-100 rounded-full text-[10px] font-bold text-stone-600 uppercase tracking-wider">
              {desktopTabs.find(t => t.id === tab)?.label || 'Dashboard'}
            </span>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative w-9 h-9 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 flex items-center justify-center transition active:scale-95"
              title="Notifications"
            >
              <Bell size={17} className="text-stone-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-stone-50 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto w-full pb-12">
            {tab === 'home' && <HomePage user={user} data={scopedData} update={update} onOpenNotifs={() => setShowNotifs(true)} />}
            {tab === 'calendar' && <CalendarPage user={user} data={scopedData} update={update} />}
            {tab === 'report' && <ReportPage user={user} data={scopedData} update={update} />}
            {tab === 'payroll' && <PayrollPage user={user} data={scopedData} update={update} />}
            {tab === 'settings' && <SettingsPage user={user} data={scopedData} update={update} onLogout={handleLogout} />}
          </div>
        </main>

        {showNotifs && (
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-stone-50 border-l border-stone-200 shadow-2xl z-50 flex flex-col transition-all">
            <NotificationsPanel user={user} data={scopedData} update={update} onClose={() => setShowNotifs(false)} />
          </div>
        )}

        {/* Real-time Floating Toast Alert */}
        {activeToast && (
          <div 
            onClick={() => { setShowNotifs(true); setActiveToast(null); }}
            className="fixed top-6 right-6 z-[9999] w-[350px] bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200 shadow-2xl p-4 flex gap-3 items-start animate-slide-in cursor-pointer hover:bg-stone-50 transition active:scale-[0.98]"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              activeToast.type === 'leave_rejected' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
              activeToast.type === 'leave_approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
              'bg-amber-100 text-amber-700 border border-amber-200'
            }`}>
              {activeToast.type === 'leave_rejected' ? <X size={16} /> : activeToast.type === 'leave_approved' ? <Check size={16} /> : <Bell size={16} />}
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-xs font-bold text-stone-900 uppercase tracking-wide">{activeToast.title}</p>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed truncate">{activeToast.message}</p>
              <span className="inline-block text-[9px] text-amber-600 font-bold mt-1 hover:underline">
                Tap to view details
              </span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setActiveToast(null); }} 
              className="text-stone-400 hover:text-stone-600 p-0.5 rounded-full hover:bg-stone-100 transition flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
