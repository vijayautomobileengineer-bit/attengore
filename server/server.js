import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

dotenv.config();

// Force Google DNS so SRV records resolve (router DNS often blocks SRV lookups)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ============ RESILIENT LOCAL FALLBACK DATABASE CONFIG ============
let isOfflineDB = false;
const fallbackFilePath = path.join(process.cwd(), 'db_fallback.json');

const loadFallbackData = () => {
  if (!fs.existsSync(fallbackFilePath)) {
    fs.writeFileSync(fallbackFilePath, JSON.stringify([]));
  }
  try {
    return JSON.parse(fs.readFileSync(fallbackFilePath, 'utf8'));
  } catch (err) {
    console.error('Error reading fallback JSON file:', err);
    return [];
  }
};

const saveFallbackData = (companies) => {
  try {
    fs.writeFileSync(fallbackFilePath, JSON.stringify(companies, null, 2));
  } catch (err) {
    console.error('Error writing fallback JSON file:', err);
  }
};

// ============ MONGODB CONNECTION ============
const MONGODB_URI = process.env.MONGODB_URI;

console.log('Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Successfully connected to MongoDB Cluster!'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  FALLBACK ACTIVE: Clowi will run using local JSON database (db_fallback.json)');
    isOfflineDB = true;
  });

// ============ MULTI-TENANT SCHEMA ============
const CompanyDataSchema = new mongoose.Schema({
  corporateId: { type: String, required: true, unique: true, index: true },
  data: {
    users:         { type: Array,  default: [] },
    locations:     { type: Array,  default: [] },
    attendance:    { type: Array,  default: [] },
    leaves:        { type: Array,  default: [] },
    holidays:      { type: Array,  default: [] },
    payroll:       { type: Object, default: {} },
    settings:      { type: Object, default: {} },
    notifications: { type: Array,  default: [] },
  }
}, { timestamps: true });

const CompanyData = mongoose.model('CompanyData', CompanyDataSchema);

// ============ API ENDPOINTS ============

// 1. Check if a Corporate ID exists and has users
app.get('/api/tenant/:corporateId/exists', async (req, res) => {
  try {
    const cleanCorpId = req.params.corporateId.trim();
    let company;
    if (isOfflineDB) {
      const companies = loadFallbackData();
      company = companies.find(c => c.corporateId.toLowerCase() === cleanCorpId.toLowerCase());
    } else {
      company = await CompanyData.findOne({ corporateId: { $regex: new RegExp(`^${cleanCorpId}$`, 'i') } });
    }
    if (!company) return res.json({ exists: false, hasUsers: false });
    const hasUsers = company.data?.users?.length > 0;
    return res.json({ exists: true, hasUsers });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Fetch all company data for a given tenant
app.get('/api/tenant/:corporateId', async (req, res) => {
  try {
    const cleanCorpId = req.params.corporateId.trim();
    let company;
    if (isOfflineDB) {
      const companies = loadFallbackData();
      company = companies.find(c => c.corporateId.toLowerCase() === cleanCorpId.toLowerCase());
    } else {
      company = await CompanyData.findOne({ corporateId: { $regex: new RegExp(`^${cleanCorpId}$`, 'i') } });
    }
    if (!company) return res.status(404).json({ error: 'Tenant not found.' });
    return res.json({ data: company.data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Register a new user in a tenant (creates tenant if none exists)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { corporateId, email, name, role, password } = req.body;
    if (!corporateId || !email || !name || !role || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const cleanCorpId = corporateId.trim();
    const cleanEmail  = email.trim().toLowerCase();

    let company;
    let companies = [];

    if (isOfflineDB) {
      companies = loadFallbackData();
      company = companies.find(c => c.corporateId.toLowerCase() === cleanCorpId.toLowerCase());
    } else {
      company = await CompanyData.findOne({ corporateId: { $regex: new RegExp(`^${cleanCorpId}$`, 'i') } });
    }

    if (!company) {
      const newCompanyObj = {
        corporateId: cleanCorpId,
        data: {
          users: [],
          locations: [{ id: 'loc_hq', name: 'HQ — Downtown', lat: 37.7749, lng: -122.4194, radius: 150 }],
          attendance: [],
          leaves: [],
          holidays: [
            `${new Date().getFullYear()}-05-26`,
            `${new Date().getFullYear()}-06-19`,
            `${new Date().getFullYear()}-07-04`
          ],
          payroll: {},
          settings: {
            notifications: { email: true, push: true, weekly: false },
            twoFactor: false
          },
          notifications: []
        }
      };
      if (isOfflineDB) {
        company = newCompanyObj;
        companies.push(company);
      } else {
        company = new CompanyData(newCompanyObj);
      }
    }

    const exists = company.data.users.some(u => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return res.status(400).json({ error: 'A user with this email address already exists in this company.' });
    }

    const userId = `u_${Date.now()}`;
    const newUser = {
      id: userId,
      email: cleanEmail,
      name: name.trim(),
      role,
      password,
      corporateId: cleanCorpId,
      contact: '',
      badges: []
    };

    company.data.users.push(newUser);

    const basePayroll = role === 'Admin' ? 9000 : role === 'Manager' ? 7500 : role === 'HR' ? 6500 : 5000;
    const hraPayroll  = role === 'Admin' ? 2200 : role === 'Manager' ? 1800 : role === 'HR' ? 1500 : 1200;

    company.data.payroll = {
      ...company.data.payroll,
      [userId]: {
        base: basePayroll,
        hra: hraPayroll,
        performance: 1000,
        leaveDeduction: 0,
        tax: 600,
        prEsi: 200,
        medical: 150
      }
    };

    if (isOfflineDB) {
      saveFallbackData(companies);
    } else {
      company.markModified('data');
      await company.save();
    }

    return res.json({ success: true, user: newUser, data: company.data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Authenticate user login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { corporateId, email, password } = req.body;
    if (!corporateId || !email || !password) {
      return res.status(400).json({ error: 'Please enter Corporate ID, Email, and Password.' });
    }

    const cleanCorpId = corporateId.trim();
    const cleanEmail  = email.trim().toLowerCase();

    let company;
    if (isOfflineDB) {
      const companies = loadFallbackData();
      company = companies.find(c => c.corporateId.toLowerCase() === cleanCorpId.toLowerCase());
    } else {
      company = await CompanyData.findOne({ corporateId: { $regex: new RegExp(`^${cleanCorpId}$`, 'i') } });
    }

    if (!company) return res.status(404).json({ error: 'Invalid Corporate ID. Company does not exist.' });

    const user = company.data.users.find(
      u => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    return res.json({ success: true, user, data: company.data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Synchronise the tenant's full data state
app.post('/api/tenant/:corporateId/sync', async (req, res) => {
  try {
    const cleanCorpId = req.params.corporateId.trim();
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'No data payload provided.' });

    if (isOfflineDB) {
      const companies = loadFallbackData();
      const idx = companies.findIndex(c => c.corporateId.toLowerCase() === cleanCorpId.toLowerCase());
      if (idx === -1) return res.status(404).json({ error: 'Company tenant not found.' });
      companies[idx].data = data;
      saveFallbackData(companies);
    } else {
      const company = await CompanyData.findOne({ corporateId: { $regex: new RegExp(`^${cleanCorpId}$`, 'i') } });
      if (!company) return res.status(404).json({ error: 'Company tenant not found.' });
      company.data = data;
      company.markModified('data');
      await company.save();
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`🚀 Clowi Server running on http://localhost:${PORT}`);
});
