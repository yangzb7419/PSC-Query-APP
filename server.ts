import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import svgCaptcha from 'svg-captcha';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Memory store for captchas (in production use Redis or similar)
const captchaStore = new Map<string, { code: string; expires: number }>();

// Clean up expired captchas periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of captchaStore.entries()) {
    if (data.expires < now) {
      captchaStore.delete(id);
    }
  }
}, 60000);

// GET /api/captcha
app.get('/api/captcha', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,
    noise: 2,
    color: true,
    background: '#f8f9fa'
  });
  const id = Math.random().toString(36).substring(2, 15);
  captchaStore.set(id, {
    code: captcha.text.toLowerCase(),
    expires: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
  res.json({ id, data: captcha.data });
});

// GET /api/query-dates
app.get('/api/query-dates', async (req, res) => {
  try {
    const { data, error } = await supabase.from('student_sz').select('*').single();
    if (error) {
       console.error('Supabase error fetching dates:', error);
       return res.status(500).json({ error: '无法获取查询日期设置' });
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/query-student
app.post('/api/query-student', async (req, res) => {
  const { studentId, idLast6, captchaId, captchaCode } = req.body;

  if (!studentId || !idLast6 || !captchaId || !captchaCode) {
    return res.status(400).json({ success: false, message: '请完整填写查询信息' });
  }

  // 1. Verify Captcha
  const stored = captchaStore.get(captchaId);
  if (!stored) {
    return res.status(400).json({ success: false, message: '验证码无效，请刷新后重试' });
  }
  if (stored.expires < Date.now()) {
    captchaStore.delete(captchaId);
    return res.status(400).json({ success: false, message: '验证码已过期，请刷新' });
  }
  if (stored.code !== captchaCode.toLowerCase()) {
    return res.status(400).json({ success: false, message: '验证码错误' });
  }
  captchaStore.delete(captchaId); // One-time use

  try {
    // 2. Check query dates
    const { data: config, error: configError } = await supabase.from('student_sz').select('*').single();
    if (configError) throw configError;

    const now = new Date();
    // Get year, month, date to compare without time
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(config.start_date);
    const end = new Date(config.end_date);
    
    if (today < start || today > end) {
      return res.status(403).json({ 
        success: false, 
        message: `当前不可查询。可查询日期为：${config.start_date} 至 ${config.end_date}` 
      });
    }

    // 3. Query student
    // We match student_id and use LIKE or ends_with logic for id_number
    // PostgreSQL RIGHT function is useful here
    const { data: students, error: studentError } = await supabase
      .from('student_test')
      .select('*')
      .eq('student_id', studentId);

    if (studentError) throw studentError;

    const student = students?.find(s => s.id_number.endsWith(idLast6));

    if (!student) {
      return res.status(404).json({ success: false, message: '查询失败：未找到匹配的考生信息' });
    }

    // Success
    res.json({ success: true, data: student });
  } catch (error: any) {
    console.error('Query error:', error);
    res.status(500).json({ success: false, message: '系统繁忙，请稍后再试' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
