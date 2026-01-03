
/* ____________________________________Ruinix Code_________________________________
1_monaco
2_constants
3-function 
4-save
5-download
6-run code
7-send question
8-microphone
9-autosave

*/



// Monaco
let editor;
require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@0.34.1/min/vs' }});
require(['vs/editor/editor.main'], function() {
  editor = monaco.editor.create(document.getElementById('editor'), {
    value: '// Welcome to Runix CodeTalk\nconsole.log("Hello, Runix!");',
    language: 'javascript',
    theme: 'vs-dark',
    automaticLayout: true
  });
});

//constants
const filenameInput = document.getElementById('filename');
const langSelect = document.getElementById('langSelect');
const chat = document.getElementById('chat');
const consoleOutput = document.getElementById('consoleOutput');


//function to speak 
function appendChat(text, who='ai') {
  const d = document.createElement('div');
  d.className = 'msg ' + (who==='user' ? 'user' : 'ai');
  d.textContent = text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
  if (who==='ai') speakText(text);
}

// --- دالة تشغيل الصوت (النسخة الاحترافية) ---
// هذه الدالة ستطلب الصوت من الخادم بدلاً من كروم
async function speakText(text) {
  // إيقاف أي صوتيات سابقة
  window.speechSynthesis.cancel(); 

  try {
    // 1. اطلب ملف الصوت من الخادم
    const response = await fetch('/api/speak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audio from server.');
    }

    // 2. حول الاستجابة إلى ملف صوتي (blob)
    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);

    // 3. قم بتشغيله
    const audio = new Audio(audioUrl);
    audio.play();

  } catch (err) {
    console.error("Error playing audio:", err);
    // كحل بديل إذا فشل الخادم، استخدم الصوت القبيح
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    window.speechSynthesis.speak(utterance);
  }
}




//Extension from language
function extFromLang(l) {
  return { javascript:'js', html:'html', css:'css', python:'py', cpp:'cpp' }[l] || 'txt';
}


//save 
document.getElementById('saveBtn')?.addEventListener('click', ()=>{
  const content = editor.getValue();
  const filename = (filenameInput.value || 'project') + '.' + extFromLang(langSelect.value);
  fetch('/api/save', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({filename, content})
  }).then(()=> alert('Saved to server!'))
  .catch(()=> alert('Save failed'));
});


// Downllowd file
document.getElementById('downloadBtn').addEventListener('click', ()=>{
  const blob = new Blob([editor.getValue()], {type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (filenameInput.value || 'project') + '.' + extFromLang(langSelect.value);
  a.click();
});

//run code
document.getElementById('runBtn').addEventListener('click', async ()=>{
  const lang = langSelect.value;
  const code = editor.getValue();
  consoleOutput.textContent = "Running " + lang + "...\n";

  try {
    const res = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        language: lang,
        version: '*',
        files: [{ content: code }]
      })
    });
    const data = await res.json();
    consoleOutput.textContent += data.run.output || '(no output)';
  } catch (err) {
    consoleOutput.textContent = 'Error: ' + err.message;
  }
});



// Send qustion
document.getElementById('askBtn').addEventListener('click', sendQuestion);
document.getElementById('userQuestion').addEventListener('keydown', (e)=>{
  if(e.key==='Enter') sendQuestion();
});

async function sendQuestion(){
  const q = document.getElementById('userQuestion').value.trim();
  if(!q) return;
  appendChat(q, 'user');
  document.getElementById('userQuestion').value = '';
  async function sendQuestion(){
  const q = document.getElementById('userQuestion').value.trim();
  if(!q) return;
  appendChat(q, 'user');
  document.getElementById('userQuestion').value = '';

  // --- هذا هو التغيير ---
  // جلب السجل الكامل
  const chatHistory = getChatHistory(); 
  // ملاحظة: السجل الآن يحتوي على السؤال الجديد الذي أضفته للتو

  const API_URL = "/api/ask"; 
  const payload = {
    // أرسل السجل كاملاً بدلاً من سؤال واحد
    history: chatHistory, 
    code: editor.getValue()
  };
  // --- نهاية التغيير ---

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    appendChat(data.answer || "No response", 'ai');
  } catch {
    appendChat("AI Error: Unable to connect to server", 'ai');
  }
}

  // This is the new, correct API call
  const API_URL = "/api/ask"; // Calls your own server
  const payload = {
    question: q,
    code: editor.getValue()
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    // Use data.answer, which is what our new server.js sends
    appendChat(data.answer || "No response", 'ai');
  } catch {
    appendChat("AI Error: Unable to connect to server", 'ai');
  }
}


// MIcrophone 
let recognition;
document.getElementById('micBtn').addEventListener('click', ()=>{
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){ alert('Your browser does not support SpeechRecognition'); return; }

  // --- هذا هو التعديل ---
  const micButton = document.getElementById('micBtn');

  if (recognition && recognition.isListening) {
    // إذا كان يستمع بالفعل، أوقفه
    recognition.stop();
    return;
  }
  // --- نهاية التعديل ---

  recognition = new SpeechRecognition();
  recognition.lang = 'en-us'; // لغتك
  recognition.isListening = false; // متغير لتتبع الحالة

  // --- حدث "عندما يبدأ الاستماع" ---
  recognition.onstart = () => {
    recognition.isListening = true;
    micButton.classList.add('listening'); // أضف الكلاس لتفعيل النبض
  };

  // --- حدث "عندما ينتهي الاستماع" ---
  recognition.onend = () => {
    recognition.isListening = false;
    micButton.classList.remove('listening'); // أزل الكلاس لإيقاف النبض
  };

  // --- حدث "عندما تأتي النتيجة" ---
  recognition.onresult = (e)=>{
    const t = e.results[0][0].transcript;
    document.getElementById('userQuestion').value = t;
    sendQuestion();
    // (سيتوقف تلقائياً بعد النتيجة)
  };

  recognition.start(); // ابدأ الاستماع
});

// --- Autosave ---
setInterval(() => {
  const content = editor.getValue();
  const filename = (filenameInput.value || 'project') + '.' + extFromLang(langSelect.value);

  fetch('/api/save', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({filename, content, autosave: true})
  }).then(res => res.json())
    .then(data => console.log('Autosaved ' + data.filename))
    .catch(err => console.error('Autosave failed', err));
}, 5000); // 5000ms = 5 seconds

// في ملف app.js عند الضغط على زر Run
document.getElementById('runBtn').addEventListener('click', async ()=>{
  const lang = langSelect.value;
  const code = editor.getValue();
  
  // إذا كانت لغة ويب، اعرضها في iframe
  if (lang === 'html' || lang === 'css' || lang === 'javascript') {
    // افترض أن لديك iframe بهذا الـ id في index.html
    const previewFrame = document.getElementById('previewFrame'); 
    
    // هذا الكود ينشئ صفحة HTML كاملة ويعرضها
    // ملاحظة: هذا يتطلب دمج الـ CSS والـ JS داخل הـ HTML
    // إذا كان الكود JS فقط، يمكنك إنشاء <script>
    // إذا كان HTML فقط، يمكنك عرضه مباشرة
    const htmlContent = `
      <html>
        <head>
          ${lang === 'css' ? `<style>${code}</style>` : ''}
        </head>
        <body>
          ${lang === 'html' ? code : ''}
          ${lang === 'javascript' ? `<script>${code}</script>` : ''}
        </body>
      </html>
    `;
    previewFrame.srcdoc = htmlContent;
    consoleOutput.textContent = "Rendering Web preview...";
  } else {
    // إذا كانت لغة أخرى، استخدم Piston API
    consoleOutput.textContent = "Running " + lang + "...\n";
    // ... (الكود الحالي الذي يستخدم Piston)
  }
});

// --- دالة جديدة لجلب سجل المحادثة ---
function getChatHistory() {
  const history = [];
  const messages = document.querySelectorAll('#chat .msg'); // جلب كل الرسائل

  messages.forEach(msg => {
    // نتجاهل رسالة "يكتب الآن"
    if (msg.classList.contains('ai-typing')) return; 

    const role = msg.classList.contains('user') ? 'user' : 'assistant';
    const content = msg.textContent;
    history.push({ role, content });
  });
  return history;
}
// --- 1. دالة جديدة لتحديد اللغة من اسم الملف ---
// (هذه عكس الدالة الموجودة عندك)
function langFromExt(ext) {
  const map = {
    'js': 'javascript',
    'html': 'html',
    'css': 'css',
    'py': 'python',
    'cpp': 'cpp',
    'txt': 'plaintext' // لغة افتراضية
  };
  return map[ext] || 'plaintext';
}


// --- 2. الكود الخاص بفتح الملفات ---
const openBtn = document.getElementById('openBtn');
const fileInput = document.getElementById('fileInput');

// عندما تضغط على زر "Open File"
openBtn.addEventListener('click', () => {
  fileInput.click(); // قم بتشغيل زر الملفات المخفي
});

// عندما يختار المستخدم ملفاً
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) {
    return; // المستخدم أغلق النافذة
  }

  // استخدم FileReader لقراءة محتوى الملف كنص
  const reader = new FileReader();
  
  reader.onload = (e) => {
    const content = e.target.result;
    
    // 1. ضع المحتوى داخل المحرر
    editor.setValue(content);

    // 2. تحديث اسم الملف في مربع الإدخال
    const parts = file.name.split('.');
    const extension = parts.pop().toLowerCase();
    const name = parts.join('.'); 
    filenameInput.value = name;

    // 3. تحديث قائمة اختيار اللغة
    const language = langFromExt(extension);
    langSelect.value = language;

    // 4. تحديث لغة المحرر (Monaco)
    monaco.editor.setModelLanguage(editor.getModel(), language);
  };

  reader.readAsText(file); // ابدأ القراءة
  
  // (مهم) أعد تعيين القيمة للسماح بفتح نفس الملف مرة أخرى
  event.target.value = null;
});
