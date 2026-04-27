import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  GraduationCap, 
  IdCard, 
  MapPin, 
  Map as MapIcon, 
  ListOrdered, 
  DoorClosed, 
  Monitor, 
  AlertTriangle, 
  Ban, 
  Smartphone, 
  BookX, 
  Info, 
  Search, 
  Calendar, 
  ClipboardList, 
  UserSearch,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface StudentData {
  student_id: string;
  name: string;
  gender: string;
  college: string;
  class_name: string;
  id_number: string;
  exam_number: string;
  test_date: string;
  report_time: string;
}

interface QueryDates {
  start_date: string;
  end_date: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'guidelines' | 'query'>('guidelines');
  
  // Form State
  const [studentId, setStudentId] = useState('');
  const [idLast6, setIdLast6] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  
  // Captcha State
  const [captchaCode, setCaptchaCode] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // App State
  const [queryDates, setQueryDates] = useState<QueryDates | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    refreshCaptcha();
    fetchQueryDates();
  }, []);

  // Update captcha whenever code changes
  useEffect(() => {
    drawCaptcha();
  }, [captchaCode]);

  const fetchQueryDates = async () => {
    try {
      const { data, error } = await supabase.from('student_sz').select('*').single();
      if (error) throw error;
      setQueryDates(data);
    } catch (err) {
      console.error('Failed to fetch query dates:', err);
    }
  };

  const refreshCaptcha = () => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  const drawCaptcha = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text
    ctx.font = 'bold 30px Arial';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < captchaCode.length; i++) {
      ctx.fillStyle = `rgb(${Math.random() * 150}, ${Math.random() * 150}, ${Math.random() * 150})`;
      const x = 20 + i * 25;
      const y = canvas.height / 2 + (Math.random() - 0.5) * 10;
      const angle = (Math.random() - 0.5) * 0.4;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(captchaCode[i], 0, 0);
      ctx.restore();
    }

    // Noise lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
  };

  const handleQuery = async () => {
    if (!studentId || !idLast6 || !captchaInput) {
      setError('请完整填写所有查询信息');
      return;
    }

    if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
      setError('验证码错误');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setStudentData(null);

    try {
      // 1. Check Query Dates
      const { data: config, error: configError } = await supabase.from('student_sz').select('*').single();
      if (configError) throw configError;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const start = new Date(config.start_date);
      const end = new Date(config.end_date);

      if (today < start || today > end) {
        setError(`当前不可查询。可查询日期为：${config.start_date} 至 ${config.end_date}`);
        setLoading(false);
        return;
      }

      // 2. Query Student
      const { data: students, error: studentError } = await supabase
        .from('student_test')
        .select('*')
        .eq('student_id', studentId);

      if (studentError) throw studentError;

      const student = students?.find(s => s.id_number.endsWith(idLast6));

      if (!student) {
        setError('查询失败：未找到匹配的考生信息');
        refreshCaptcha();
      } else {
        setStudentData(student);
        setSuccessMsg('查询成功！');
      }
    } catch (err: any) {
      console.error('Query Error:', err);
      setError('查询系统繁忙，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9fc] flex justify-center text-[#1a1c1e] font-sans">
      <div className="w-full max-w-md bg-[#f9f9fc] relative pb-[90px] min-h-screen flex flex-col shadow-2xl">
        
        {/* Header */}
        <header className="fixed top-0 w-full max-w-md bg-white border-b border-gray-200 h-16 flex justify-between items-center px-5 z-50">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-[#00205f] w-6 h-6" />
            <h1 className="text-lg font-bold text-[#00205f]">安徽财经大学普通话测试</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-5 pt-20">
          
          {/* Tab 1: Guidelines */}
          {activeTab === 'guidelines' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-[28px] font-bold text-[#00174b] mb-2 mt-2">考生注意事项</h2>
              <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                请务必仔细阅读并严格遵守以下测试规定，确保顺利完成考试。
              </p>

              {/* Guidelines Cards ... (Unchanged) */}
              <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] mb-5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00205f]"></div>
                <div className="p-5 pl-7">
                  <div className="w-10 h-10 bg-blue-100/50 rounded-lg flex items-center justify-center mb-4 text-[#00205f]">
                    <IdCard className="w-5 h-5" />
                  </div>
                  <h3 className="text-[19px] font-bold text-gray-900 mb-3 tracking-wide">一、身份核验</h3>
                  <p className="text-[15px] text-gray-600 leading-relaxed">
                    考生必须携带本人<span className="text-[#00205f] font-bold">有效二代身份证原件</span>参加测试。
                  </p>
                </div>
              </div>
              
              {/* More cards... simplified for brevity here but keeping the structure */}
              <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] mb-5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00205f]"></div>
                <div className="p-5 pl-7">
                   <div className="w-10 h-10 bg-blue-100/50 rounded-lg flex items-center justify-center mb-4 text-[#00205f]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="text-[19px] font-bold text-gray-900 mb-4 tracking-wide">二、报到地点</h3>
                  <div className="bg-[#f3f4f6] p-4 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-[#00205f] text-[17px]">笃行楼一楼西侧大厅</span>
                    <MapIcon className="text-gray-400 w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] mb-5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00205f]"></div>
                <div className="p-5 pl-7">
                  <div className="flex items-center gap-3 mb-6">
                    <ListOrdered className="text-[#00205f] w-6 h-6" />
                    <h3 className="text-[19px] font-bold text-gray-900 tracking-wide">三、测试流程</h3>
                  </div>
                  <div className="bg-[#f3f4f6] p-4 rounded-lg mb-4 text-gray-800">
                    <span className="font-bold text-[17px]">105室 - 身份核验</span>
                  </div>
                  <div className="bg-[#00205f] text-white p-4 rounded-lg">
                    <span className="font-bold text-[17px]">106室 - 正式机考</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#fff5f5] border border-red-100 rounded-xl mb-6 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#b6152b]"></div>
                <div className="p-5 pl-7">
                  <div className="flex items-center gap-2.5 mb-4">
                    <AlertTriangle className="text-[#b6152b] w-6 h-6" />
                    <h3 className="text-[19px] font-bold text-[#b6152b] tracking-wide">四、考场禁止事项</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white p-2 rounded-lg text-center shadow-sm">
                      <Ban className="text-[#b6152b] w-5 h-5 mx-auto mb-1" />
                      <span className="text-[11px] font-bold text-[#b6152b]">严禁化妆</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg text-center shadow-sm">
                      <Smartphone className="text-[#b6152b] w-5 h-5 mx-auto mb-1" />
                      <span className="text-[11px] font-bold text-[#b6152b]">严禁手机</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg text-center shadow-sm">
                      <BookX className="text-[#b6152b] w-5 h-5 mx-auto mb-1" />
                      <span className="text-[11px] font-bold text-[#b6152b]">严禁资料</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Query Form */}
          {activeTab === 'query' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-8">
              <h2 className="text-[28px] font-bold text-[#00174b] mb-2 mt-2">信息查询</h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                请输入您的个人信息以查询普通话水平测试的报名及考试安排。
              </p>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3.5 items-start mb-6">
                <div className="bg-[#00205f] rounded-full p-1 mt-0.5 shrink-0">
                  <Info className="text-white w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-[#00205f] mb-1.5 uppercase tracking-wide">查询开放时段</h4>
                  <p className="text-[14.5px] text-gray-700 leading-relaxed">
                    {queryDates ? (
                      <>当前系统开放查询日期：<br /><span className="font-bold text-[#00205f]">{queryDates.start_date} 至 {queryDates.end_date}</span></>
                    ) : (
                      "正在获取系统开放状态..."
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
                <div className="mb-4">
                  <label className="block text-[12.5px] font-bold text-gray-500 mb-2">学号信息</label>
                  <input 
                    type="text" 
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="请输入完整学号" 
                    className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 placeholder:text-gray-400 outline-none focus:border-[#00205f] focus:ring-1 focus:ring-[#00205f] transition-all text-[15px]" 
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-[12.5px] font-bold text-gray-500 mb-2">
                    身份证后六位 <span className="text-[11px] font-normal text-gray-400 ml-1">(如包含X，请大写X)</span>
                  </label>
                  <input 
                    type="text" 
                    value={idLast6}
                    onChange={(e) => setIdLast6(e.target.value)}
                    placeholder="请输入身份证最后六位字符 (包含X)" 
                    className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 placeholder:text-gray-400 outline-none focus:border-[#00205f] focus:ring-1 focus:ring-[#00205f] transition-all text-[15px]" 
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-[12.5px] font-bold text-gray-500 mb-2">验证码</label>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="验证码" 
                      className="w-[120px] bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 placeholder:text-gray-400 outline-none focus:border-[#00205f] focus:ring-1 focus:ring-[#00205f] transition-all text-[15px]" 
                    />
                    <div 
                      onClick={refreshCaptcha}
                      className="flex-1 h-[48px] bg-gray-100 rounded-lg overflow-hidden cursor-pointer border border-gray-200 flex items-center justify-center relative group"
                      title="点击刷新验证码"
                    >
                      <canvas 
                        ref={canvasRef} 
                        width={150} 
                        height={48} 
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 flex items-center justify-center transition-colors">
                        <RefreshCw className="w-4 h-4 text-[#00205f] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleQuery}
                  disabled={loading}
                  className="w-full bg-[#00174b] hover:bg-[#00205f] disabled:bg-gray-400 active:scale-[0.98] text-white font-semibold rounded-lg py-3.5 flex justify-center items-center gap-2 transition-all shadow-md">
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  {loading ? '正在查询...' : '查询结果'}
                </button>
              </div>

              {/* Status Messages */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 items-center mb-6 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="text-red-500 w-5 h-5 shrink-0" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {successMsg && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex gap-3 items-center mb-6 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 className="text-green-600 w-5 h-5 shrink-0" />
                  <p className="text-sm text-green-700 font-medium">{successMsg}</p>
                </div>
              )}

              {/* Result State */}
              {studentData && (
                <div className="bg-white border rounded-xl shadow-md mb-6 overflow-hidden relative animate-in fade-in slide-in-from-top-4">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00205f]"></div>
                  <div className="flex justify-between items-center border-b border-gray-100 p-4 pl-6 bg-[#f8f9fa]">
                    <div className="flex items-center gap-2">
                      <IdCard className="text-[#00205f] w-5 h-5" />
                      <h3 className="text-[17px] font-bold text-gray-900">考生信息档案</h3>
                    </div>
                  </div>
                  <div className="p-5 pl-6 grid grid-cols-2 gap-y-5 gap-x-4 border-b border-gray-100">
                    <div className="col-span-1">
                      <p className="text-[11px] text-gray-400 font-bold mb-1 uppercase tracking-wider">姓名</p>
                      <p className="font-bold text-gray-900 text-[17px]">{studentData.name}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-[11px] text-gray-400 font-bold mb-1 uppercase tracking-wider">性别</p>
                      <p className="text-gray-900 text-[16px] font-medium">{studentData.gender}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-[11px] text-gray-400 font-bold mb-1 uppercase tracking-wider">学号</p>
                      <p className="text-gray-900 text-[16px] font-medium">{studentData.student_id}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-[11px] text-gray-400 font-bold mb-1 uppercase tracking-wider">身份证后六位</p>
                      <p className="text-gray-900 text-[16px] font-mono tracking-wider">{studentData.id_number.slice(-6)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[11px] text-gray-400 font-bold mb-1 uppercase tracking-wider">学院 / 班级</p>
                      <p className="text-gray-900 text-[16px] font-medium">{studentData.college} / {studentData.class_name}</p>
                    </div>
                  </div>
                  <div className="bg-[#f8f9fa] p-5 pl-6">
                    <div className="mb-4">
                      <p className="text-[11px] text-gray-400 font-bold mb-1.5 uppercase tracking-wider">准考证号</p>
                      <p className="text-[#00205f] font-bold text-[22px] tracking-widest font-mono">{studentData.exam_number}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-bold mb-2 uppercase tracking-wider">测试日期 & 报到时间</p>
                      <div className="flex items-center gap-2.5">
                        <Calendar className="text-gray-400 w-4 h-4" />
                        <p className="text-gray-900 font-bold text-[16px]">{studentData.test_date} {studentData.report_time}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 flex px-2 pt-2 pb-[1.5rem] z-50">
          <button onClick={() => setActiveTab('guidelines')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all ${activeTab === 'guidelines' ? 'text-[#00205f]' : 'text-gray-400'}`}>
            <div className={`px-5 py-1 rounded-full transition-all ${activeTab === 'guidelines' ? 'bg-[#f0f4ff]' : ''}`}>
               <ClipboardList className="w-[22px] h-[22px]" />
            </div>
            <span className={`text-[12px] font-bold ${activeTab === 'guidelines' ? 'text-[#00205f]' : 'text-gray-500'}`}>注意事项</span>
          </button>
          <button onClick={() => setActiveTab('query')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all ${activeTab === 'query' ? 'text-[#00205f]' : 'text-gray-400'}`}>
            <div className={`px-5 py-1 rounded-full transition-all ${activeTab === 'query' ? 'bg-[#f0f4ff]' : ''}`}>
               <UserSearch className="w-[22px] h-[22px]" />
            </div>
            <span className={`text-[12px] font-bold ${activeTab === 'query' ? 'text-[#00205f]' : 'text-gray-500'}`}>信息查询</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
